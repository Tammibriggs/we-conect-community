import Community from "@/server/models/Community";
import CommunityPost from "@/server/models/CommunityPost";
import { verifyToken } from "@/server/utils/jwt";
import connectDb from "@/server/utils/mongodb";
import permit from "@/server/utils/permit";

const toogleLike = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.body;
    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const community = await Community.findById(post.communityId);
    const member = community.members.find(
      (member) => member.userId.toString() === userId
    );
    const permitted = await permit.check(
      {
        key: userId,
        attributes: {
          role: member.role,
          violations_count: member?.restriction?.violationsCount || 0,
        },
      },
      "react",
      "community"
    );
    if (!permitted) {
      return res.status(403).json({ message: "Permission denied" });
    }

    if (!post.likes.includes(userId)) {
      await post.updateOne({ $push: { likes: userId } });
    } else {
      await post.updateOne({ $pull: { likes: userId } });
    }
    res.status(200).json({ message: "ok" });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const handler = async (req, res) => {
  if (req.method === "POST") {
    const result = await verifyToken(req);
    if (result.isError) {
      return res.status(401).json({ message: result.message });
    }
    return await toogleLike(req, res);
  } else {
    res.status(405).send("Not Allowed");
  }
};

export default connectDb(handler);
