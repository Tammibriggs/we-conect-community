import fs from "fs";
import CommunityPost from "../models/CommunityPost";

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
      return new Date(now.getTime() * 60 * 60 * 1000);
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
    if (presets.enabled) {
      const filters = presets.options;
      const presetViolations = await evaluatePresetsCriteria(post, filters);
      const spamViolations = presetViolations["Spam Filter"] || [];
      const isSpam = spamViolations?.length > 0;

      if (isSpam) {
        violations = [...spamViolations];
        member.role = "spammer";
        filters.forEach((filter) => {
          if (
            filter.actions.includes("timeoutUser") &&
            filter.actionConfig?.timeoutDuration
          ) {
            member.permissions.canPost = false;
            member.restriction.reason = "Spam post";
            member.restriction.endTime = getTimeoutDuration(
              filter.actionConfig?.timeoutDuration
            );
          }
          if (filter.actions.includes("blockPost")) {
            post.status = "rejected";
          }
        });
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
