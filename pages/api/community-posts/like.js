import CommunityPost from "@/server/models/CommunityPost";
import { verifyToken } from "@/server/utils/jwt";
import connectDb from "@/server/utils/mongodb";
import Community from "@/server/models/Community";

const toogleLike = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.body;
    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
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
