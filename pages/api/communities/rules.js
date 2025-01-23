import Community from "@/server/models/Community";
import genAI from "@/server/utils/gemini";
import { verifyToken } from "@/server/utils/jwt";
import connectDb from "@/server/utils/mongodb";
import permit from "@/server/utils/permit";

const prompt = `
You are an AI assistant tasked with analyzing the provided social media community guidelines. These guidelines define acceptable behavior and content for users in the community.

Your goal is to identify actionable moderation rules specifically tailored for detecting violations in a post using the Gemini 1.5 flash language model (LLM) without requiring fine-tuning. A post consists only of:
- **Body**: The text content of the post.
- **Media**: Descriptive features derived from the post's image.

### Instructions:
- The generated moderation rules must be identifiable by analyzing **only** the post's body or media.
- Do **not** include moderation rules that depend on additional context or information such as:
- The community's core themes or topics.
- User account history or behavior.
- Post origin (e.g., location or author metadata).
- Community-specific information not present in the post body or media.
- Avoid vague terms like "irrelevant" or "off-topic." Instead, clearly define the type of content being restricted.

### Output Requirements:
- The generated moderation rules must be provided in JSON format.
- The top-level JSON structure must be a JSON Array.
- Each moderation rule must be a JSON Object within the Array that includes:
  - **A title** (maximum 40 characters).
  - **A description** (maximum 30 words).
- Titles must be structured so that adding the word "Block" at the beginning results in a grammatically correct title.
- Titles must be **direct, specific, and self-explanatory** without relying on the description to clarify their meaning.
- Focus only on violations explicitly described in the provided guidelines.
- Combine similar or overlapping rules into one concise and comprehensive rule.
- Do **not** include generic or overly broad titles.

### Example Output Format:
\`\`\`json
[
 {
   "title": "Posts with Hate Speech",
   "description": "Block posts with language targeting groups based on race, religion, or gender."
 },
 {
    "title": "Posts with Graphic Violence",
   "description": "Block posts containing images with excessive gore or harm."
 }
]
\`\`\`

### What to Avoid:
- **Bad Example:**
**Title:** Posts Promoting Illegal Events
**Why?** This requires context about the legality of events, which may not be fully apparent in the post content.
- **Bad Example:**
**Title:** Irrelevant Content
**Why?** The scope of what is considered "irrelevant" is unclear and not self-explanatory.
- **Bad Example:**
**Title:** Off-Topic Posts
**Why?** "Off-topic" is a vague term that does not specify the actual violation.

Now, analyze the following guidelines and generate the rules.
`;

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

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent(
      `${prompt}\n\n
      ${title}:${description}`
    );
    const responseText = result.response.text();

    try {
      let cleanedText = responseText.replace(/```json|```/g, "").trim();
      const jsonResponse = JSON.parse(cleanedText);
      const generatedFilters = community.moderationFilters.generatedFilters;
      generatedFilters.options = [
        ...jsonResponse,
        ...(generatedFilters.options ? generatedFilters.options : []),
      ];
    } catch (err) {}

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
    console.log(err);
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
