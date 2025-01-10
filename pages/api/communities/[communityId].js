import Community from "@/server/models/Community";
import { hasDisallowedFields } from "@/server/utils";
import { verifyToken } from "@/server/utils/jwt";
import connectDb from "@/server/utils/mongodb";

const getCommunity = async (req, res) => {
  try {
    const { communityId } = req.query;
    const community = await Community.findById(communityId);
    return res.status(200).json(community);
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
const updateCommunity = async (req, res) => {
  try {
    const userId = req.userId;
    const { communityId } = req.query;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    const isAllowed = community.members.find(
      (member) => member.userId.toString() === userId && member.role === "admin"
    );
    if (!isAllowed) {
      return res.status(403).json({
        message: "Only community admin and moderators can create rules",
      });
    }

    let disAllowedFields = ["createdAt", "updatedAt", "ownerId"];
    if (hasDisallowedFields(req.body, disAllowedFields)) {
      return res.status(422).json({
        message: "Request body includes disallowed field",
      });
    }

    await Community.updateOne({ _id: communityId }, { ...req.body });

    return res.status(200).json({ message: "ok" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const handler = async (req, res) => {
  if (req.method === "GET") {
    const result = await verifyToken(req);
    if (result.isError) {
      return res.status(401).json({ message: result.message });
    }
    await getCommunity(req, res);
  } else if (req.method === "PATCH") {
    const result = await verifyToken(req);
    if (result.isError) {
      return res.status(401).json({ message: result.message });
    }
    await updateCommunity(req, res);
  } else {
    res.status(405).json("Method Not Allowed");
  }
};

export default connectDb(handler);
