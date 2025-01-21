import Community from "@/server/models/Community";
import { verifyToken } from "@/server/utils/jwt";
import connectDb from "@/server/utils/mongodb";
import permit from "@/server/utils/permit";

const createRule = async (req, res) => {
  try {
    const userId = req.userId;
    const { communityId, title, description } = req.body;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    const member = community.members.find(
      (member) => member.userId.toString() === userId
    );
    const permitted = await permit.check(
      {
        key: userId,
        attributes: {
          role: member.role,
        },
      },
      "create",
      "community"
    );
    if (!permitted) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    community.rules.push({ title, description });
    await community.save();
    return res.status(200).json({ message: "ok" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const editRule = async (req, res) => {
  try {
    const userId = req.userId;
    const { communityId, ruleId, title, description } = req.body;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    const member = community.members.find(
      (member) => member.userId.toString() === userId
    );
    const permitted = await permit.check(
      {
        key: userId,
        attributes: {
          role: member.role,
        },
      },
      "update",
      "community"
    );
    if (!permitted) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const ruleIndex = community.rules.findIndex(
      (rule) => rule._id.toString() === ruleId
    );
    if (ruleIndex === -1) {
      return res.status(404).json({ message: "Rule not found." });
    }

    community.rules[ruleIndex] = { title, description };
    await community.save();
    return res.status(200).json({ message: "ok" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteRule = async (req, res) => {
  try {
    const userId = req.userId;
    const { communityId, ruleId } = req.body;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    const member = community.members.find(
      (member) => member.userId.toString() === userId
    );
    const permitted = await permit.check(
      {
        key: userId,
        attributes: {
          role: member.role,
        },
      },
      "delete",
      "community"
    );
    if (!permitted) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const remainingRules = community.rules.filter(
      (rule) => rule._id.toString() !== ruleId
    );
    community.rules = remainingRules;
    await community.save();
    return res.status(200).json({ message: "ok" });
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
    await createRule(req, res);
  } else if (req.method === "PATCH") {
    const result = await verifyToken(req);
    if (result.isError) {
      return res.status(401).json({ message: result.message });
    }
    await editRule(req, res);
  } else if (req.method === "DELETE") {
    const result = await verifyToken(req);
    if (result.isError) {
      return res.status(401).json({ message: result.message });
    }
    await deleteRule(req, res);
  } else {
    res.status(405).json("Method Not Allowed");
  }
};

export default connectDb(handler);
