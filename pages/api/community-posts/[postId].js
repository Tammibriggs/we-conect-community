import CommunityPost from "@/server/models/CommunityPost";
import { verifyToken } from "@/server/utils/jwt";
import connectDB from "@/server/utils/mongodb";

const deletePost = async (req, res) => {
  try {
    const userId = req.userId;
    const post = await CommunityPost.findById(req.query.postId);
    if (post.userId === userId) {
      await post.deleteOne();
      res.status(200).json({ message: "ok" });
    } else {
      res.status(403).json({ message: "you can delete only your post" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getPost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.query.postId);
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const handler = async (req, res) => {
  if (req.method === "DELETE") {
    const result = await verifyToken(req);
    if (result.isError) {
      return res.status(401).json({ message: result.message });
    }
    return await deletePost(req, res);
  } else if (req.method === "GET") {
    const result = await verifyToken(req);
    if (result.isError) {
      return res.status(401).json({ message: result.message });
    }
    return await getPost(req, res);
  } else {
    res.status(405).send("Not Allowed");
  }
};

export default connectDB(handler);
