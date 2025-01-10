import Community from "@/server/models/Community";
import { verifyToken } from "@/server/utils/jwt";
import connectDb from "@/server/utils/mongodb";

const deleteFilter = async (req, res) => {
  try {
    const userId = req.userId;
    const { communityId, filterId } = req.body;
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }
    const member = community.members.find(
      (member) => member.userId.toString() === userId
    );
    if (member.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    community.moderationFilters.generatedFilters.options =
      community.moderationFilters.generatedFilters.options.filter(
        (filter) => filter._id.toString() !== filterId
      );
    await community.save();
    return res.status(200).json({ message: "ok" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const saveCustomFilter = async (req, res) => {
  try {
    const userId = req.userId;
    const { communityId, filterTitle, filterDescription } = req.body;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    const member = community.members.find(
      (member) => member.userId.toString() === userId
    );
    if (member.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const options = community.moderationFilters.generatedFilters.options;

    const updatedCommunity = await Community.findOneAndUpdate(
      { _id: communityId },
      {
        $set: {
          "moderationFilters.generatedFilters.options": [
            { title: filterTitle, description: filterDescription },
            ...(options ? options : []),
          ],
        },
      },
      { new: true } // Return the updated document
    );

    return res
      .status(200)
      .json(updatedCommunity.moderationFilters.generatedFilters.options);
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const handler = async (req, res) => {
  if (req.method === "POST") {
    const result = await verifyToken(req);
    if (result.isError) {
      return res.status(401).json({ message: result.message });
    }
    await saveCustomFilter(req, res);
  } else if (req.method === "DELETE") {
    const result = await verifyToken(req);
    if (result.isError) {
      return res.status(401).json({ message: result.message });
    }
    await deleteFilter(req, res);
  } else {
    res.status(405).json("Method Not Allowed");
  }
};

export default connectDb(handler);
