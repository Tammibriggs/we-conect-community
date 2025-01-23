import Community from "@/server/models/Community";
import genAI from "@/server/utils/gemini";
import { verifyToken } from "@/server/utils/jwt";
import connectDb from "@/server/utils/mongodb";

const prompt = `
You are an AI assistant tasked with evaluating user-specified custom moderation filters. These filters describe criteria for content violations that users want to enforce in the platform.  

Your goal is to determine whether a violation of the custom filter can be identified by the Gemini 1.5 Flash language model (LLM), without requiring fine-tuning, by analyzing only the body and media of a submitted post.

A post consists only of:  
1. **Body**: The text content of the post.  
2. **Media**: Descriptive features derived from the post's images.  

### Instructions:  
For each custom moderation filter provided:  
1. **Evaluate Feasibility**: Determine if a violation of the filter can be identified by analyzing **only** the post's body or media.  
2. **Return the Result in JSON format**:
- **If Fully Feasible**:
  - Include the title and description in the JSON output. The "partial_match" field should be an empty array ("[]").
  - **Descriptions MUST begin with the word "Block".**
- **If Partially Feasible (Too Broad but Partially Detectable)**:
  - Include the title, description, and a "partial_match" array. The "partial_match" array should list the specific parts of the filter that *can* be detected. The description should then explain how those parts are detected.
  - **Descriptions MUST begin with the word "Block".**
- **If Not Feasible**:
  - Provide a JSON object with:
    - An error message explaining why the violation cannot be identified based on the post's body or media.
    - A suggestion field containing advice on how to modify or clarify the filter to make it actionable.
3. description 

### Output Format:  

#### If Fully Feasible:  
\`\`\`json
{
  "title": "Filter Title",
  "description": "A Provide a clear and concise explanation (maximum 30 words) describing how violations of the filter are identified",
  "partial_match": []
}
\`\`\`

#### If Partially Feasible:  
\`\`\`json
{
  "title": "Filter Title",
  "description": "A clear and concise explanation (maximum 30 words) describing how the DETECTABLE parts of the filter are identified",
  "partial_match": [
    "List of specific parts of the filter that CAN be detected"
  ]
}
\`\`\`

#### If Not Feasible:  
\`\`\`json
{
  "title": "Filter Title",
  "error": "A concise explanation stating why the filter is not feasible.",
  "suggestion": "Advice on how to modify the filter to make it actionable (maximum 20 words)."
}
\`\`\`

### Example Outputs:  
**Fully Feasible Example**:  
\`\`\`json
{
  "title": "Posts with Hate Speech",
  "description": "Block posts containing text targeting groups based on race, religion, or gender."
}
\`\`\`

\`\`\`json
{
  "title": "Posts Containing Explicit Content",
  "description": "Block posts with text or images depicting nudity or explicit sexual acts."
}
\`\`\`

**Partially Feasible Example**:  
\`\`\`json
{
  "title": "Posts Discussing Illegal Activities",
  "description": "Block posts that explicitly describe performing illegal acts or provide instructions for illegal activities."
}
\`\`\`

\`\`\`json
{
  "title": "Posts Containing Spam ",
  "description": "Block posts identified as unsolicited promotional content or advertising."
}
\`\`\`

**Not Feasible Example**:  
\`\`\`json
{
  "title": "Posts from Suspicious Accounts",
  "error": "Filter requires user account history, which is unavailable in the post's body or media."
  "suggestion": "Define criteria in terms of detectable content, such as language indicating account spam in the post body."
}
\`\`\`

\`\`\`json
{
  "title": "Posts Violating Local Laws",
  "error": "Determining violations of local laws requires knowledge of the user's location, which is not available in post content."
  "suggestion": "Limit the filter to specific content like explicit references to illegal activities in the post body or images."
}
\`\`\`

### Evaluation Guidelines:
1. **Focus on Content**: Only consider information within the post's body or media for determining feasibility.  
2. **Avoid Vague Terms**: Reject filters that are overly generic (e.g., "offensive content") or undefined unless specific, detectable aspects can be identified and listed in "partial_match".  

Now, evaluate the following custom moderation filter titles provided by users and return the appropriate result.
`;

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

const eveluateCustomFilter = async (req, res) => {
  try {
    const { filterTitle } = req.query;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent(
      `${prompt}\n\n
      **Title**:${filterTitle}`
    );
    const responseText = result.response.text();

    let cleanedText = responseText.replace(/```json|```/g, "").trim();
    const jsonResponse = JSON.parse(cleanedText);

    return res.status(200).json(jsonResponse);
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
  } else if (req.method === "GET") {
    await eveluateCustomFilter(req, res);
  } else {
    res.status(405).json("Method Not Allowed");
  }
};

export default connectDb(handler);
