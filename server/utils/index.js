import fs from "fs";
import CommunityPost from "../models/CommunityPost";
import genAI from "./gemini";

const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

const hasDisallowedFields = (requestBody, disallowedFields) => {
  const fieldChecks = [];
  for (const field of disallowedFields) {
    if (field in requestBody) {
      fieldChecks.push(field);
    }
  }
  return !!fieldChecks.length;
};

const deleteFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Failed to delete file: ${filePath}`, err);
      throw new Error(`Failed to delete file: ${filePath}`);
    } else {
      console.log(`Successfully deleted file: ${filePath}`);
    }
  });
};

// Check if a post violates any of the violates any of the preset filter criteria
// and return object containing the volated filter and criterias
const evaluatePresetsCriteria = (post, filters) => {
  const violations = {};

  filters.map(async (filter) => {
    if (!filter.enabled) return;

    await Promise.all(
      filter.criteria.map(async ({ key, threshold, enabled }) => {
        if (!enabled) return;

        switch (key) {
          case "postsInOneHour":
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

            // Query for posts authored by the user within the last hour
            const posts = await CommunityPost.find({
              author: post.userId,
              createdAt: { $gte: oneHourAgo },
            });

            if (posts.length > threshold) {
              violations[filter.name] = [
                `${threshold} post in one hour`,
                ...(violations[filter.name] ? violations[filter.name] : []),
              ];
            }

            break;
          case "shortPost":
            if (post.content.length < threshold) {
              violations[filter.name] = [
                `Post with less than ${threshold} characters`,
                ...(violations[filter.name] ? violations[filter.name] : []),
              ];
            }
            break;

          default:
            break;
        }
      })
    );
  });

  return violations;
};

const getTimeoutDuration = (durationString) => {
  const now = new Date();
  switch (durationString) {
    case "1-hour":
      return new Date(now.getTime() + 60 * 1000);
    case "1-day":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "1-week":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
};

// Function to construct the prompt from rules and post
function constructPostCheckPrompt(rules, postContent) {
  const prompt = `You are a content moderation assistant. Your task is to analyze a social media post and determine if it violates any of the provided moderation rules. 

      **Moderation Rules:**

       ${JSON.stringify(rules)} 

      **Post Analysis:**

      Analyze the following post, considering both its text content and any accompanying media (if applicable). For each moderation rule, determine if the post violates the rule.

      **Post Content:**

      ${JSON.stringify(postContent)}

      **Output:**

      Present your output in a JSON format as an array of objects, each object should represent the rule and the post's status. The object should have the following fields \`rule_title\` , \`violation_status\` (Boolean; \`true\` for violation, \`false\` otherwise), and  \`reasoning\`. For the violation status, set it to \`true\` if there's a clear violation; otherwise, it should be \`false\`. If the status is \`true\`, the reasoning field should contain a concise justification for the violation. If \`false\`, the reasoning should indicate why the rule was not violated.
      `;
  return prompt;
}

const mediaToParts = async (media) => {
  return [
    {
      inlineData: {
        data: Buffer.from(fs.readFileSync(media.path)).toString("base64"),
        mimeType: media.mimetype,
      },
    },
  ];
};

const checkPostForViolations = async (
  post,
  media,
  member = {},
  moderationFilters
) => {
  const { presets, generatedFilters } = moderationFilters;
  let violations = [];
  if (member.role !== "admin") {
    member.restriction = member.restriction ? member.restriction : {};
    if (presets.enabled) {
      const filters = presets.options;
      const presetViolations = await evaluatePresetsCriteria(post, filters);

      // Set the post status to rejected if any of the violated preset filters specifies a 'blockPosts' action
      // and set the restrication end time to the combined timeout of all violated filters
      if (Object.keys(presetViolations).length) {
        violations = Object.values(presetViolations).flat();
        const isBlockPost = filters.some(
          (filter) =>
            !!presetViolations[filter.name] &&
            filter.actions.includes("blockPost")
        );
        if (isBlockPost) {
          post.status = "rejected";
        }

        const combinedTimeout = filters.reduce((acc, filter) => {
          if (
            !!presetViolations[filter.name] &&
            filter.actions.includes("timeoutUser")
          ) {
            const timoutDuraction = getTimeoutDuration(
              filter.actionConfig.timeoutDuration
            ).getTime();

            return acc + timoutDuraction;
          }
        }, 0);

        if (combinedTimeout) {
          member.restriction.endTime = new Date(combinedTimeout);
        }
        member.restriction.violationsCount += 1;
        member.restriction.violations = violations;
      }
    }

    if (generatedFilters.enabled && generatedFilters.options?.length) {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const rules = generatedFilters.options.map((filter) => ({
        title: filter.title,
        description: filter.description,
      }));
      const prompt = constructPostCheckPrompt(rules, post.content);
      let result;

      if (media) {
        const mediaParts = await mediaToParts(media);
        result = await model.generateContent([...mediaParts, prompt]);
      } else {
        result = await model.generateContent(prompt);
      }

      const response = await result.response;
      const responseText = response.text();
      try {
        let cleanedText = responseText.replace(/```json|```/g, "").trim();
        const moderationResult = JSON.parse(cleanedText);
        const generatedFilterViolations = moderationResult
          .filter((result) => result.violation_status === true)
          .map((result) => result.rule_title);
        violations = [...generatedFilterViolations, ...violations];
        if (generatedFilterViolations.length) {
          post.status = "rejected";
          member.restriction.violationsCount += 1;
          member.restriction.violations = violations;
        }
      } catch (err) {
        if (media) {
          deleteFile(media.path);
        }
        throw new Error("Error occured while processing post");
      }
    }
  }

  return { post, member, violations };
};

export {
  runMiddleware,
  hasDisallowedFields,
  deleteFile,
  getTimeoutDuration,
  checkPostForViolations,
};
