import connectDb from "@/server/utils/mongodb";
import { verifyToken } from "@/server/utils/jwt";
import CommunityPost from "@/server/models/CommunityPost";
import multer from "multer";
import { checkPostForViolations, runMiddleware } from "@/server/utils";
import Community from "@/server/models/Community";
import User from "@/server/models/User";

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/uploads");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + file.originalname);
    },
  }),
});
const uploadMiddleware = upload.single("media");

const createPost = async (req, res) => {
  try {
    const userId = req.userId;
    await runMiddleware(req, res, uploadMiddleware);
    const { content, communityId } = req.body;
    const community = await Community.findById(communityId);

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    const memberIndex = community.members.findIndex(
      (member) => member.userId.toString() === userId
    );

    if (memberIndex === -1) {
      return res
        .status(403)
        .json({ message: "You are not a member of this community" });
    }

    let member = community.members[memberIndex];
    const canPost = member.permissions.canPost;

    if (!canPost) {
      const now = new Date();
      const restrictionEndTime = new Date(member.restriction.endTime);
      if (member.role === "banned" || restrictionEndTime > now) {
        return res.status(403).json({ message: "Permission denied" });
      }
      // Restriction has expired, reset status and permissions
      member.permissions = {
        canPost: true,
        canComment: true,
        canInvite: true,
      };
      delete member.restriction;
    }

    let media;
    if (req.file) {
      const url = `${process.env.BASE_URL}/${req.file.path.replace(
        /^public\//,
        ""
      )}`;
      media = { filename: req.file.filename, url };
    }

    let post = {
      author: userId,
      content,
      media,
      communityId,
    };
    const presets = community.moderationFilters.presets;
    const {
      post: updatedPost,
      member: updatedMember,
      violations,
    } = await checkPostForViolations(post, member, presets);
    post = updatedPost;
    member = updatedMember;

    await community.save();
    const newPost = await CommunityPost.create(post);

    if (post.status === "rejected") {
      return res.status(403).json({
        message: `Your post was rejected due to the following violations: ${violations.join(
          ","
        )}`,
      });
    }

    const user = await User.findById(userId).select("username profilePicture");
    newPost.author = user;
    res.status(200).json(newPost);
  } catch (err) {
    console.log(err, "Error occured while creating post");
    res.status(500).json({ messsage: "Internal Server Error" });
  }
};

const getPosts = async (req, res) => {
  try {
    const { communityId } = req.query;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const posts = await CommunityPost.find({ communityId, status: "approved" })
      .sort({
        createdAt: "desc",
      })
      .skip(skip)
      .limit(Number(limit))
      .populate("author", "username profilePicture");

    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const handler = async (req, res) => {
  if (req.method === "GET") {
    return await getPosts(req, res);
  } else if (req.method === "POST") {
    const result = await verifyToken(req);
    if (result.isError) {
      return res.status(401).json({ message: result.message });
    }
    return await createPost(req, res);
  } else {
    res.status(405).send("Not Allowed");
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default connectDb(handler);
