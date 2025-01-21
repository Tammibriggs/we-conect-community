import fs from "fs";
import CommunityPost from "../models/CommunityPost";
import permit from "./permit";

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

const chechSpam = async (post, filters) => {
  const violations = await evaluateFiltersCriteria(post, filters);
  return violations["Spam Filter"]?.length > 0;
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

const checkPostForViolations = async (
  post,
  member = {},
  presets = {},
  generatedFilters = {}
) => {
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
  }

  return { post, member, violations };
};

export {
  runMiddleware,
  hasDisallowedFields,
  deleteFile,
  chechSpam,
  getTimeoutDuration,
  checkPostForViolations,
};
