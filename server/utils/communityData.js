export default {
  _id: "64a9db3270935dc4f81d0e01",
  name: "TechNote Community",
  description:
    "Dive into the world of the latest gadgets! From smartphones to gaming gear, connect with tech enthusiasts, share insights, compare specs, and explore innovations shaping the future.",
  moderationFilters: {
    presets: {
      options: [
        {
          name: "Spam Filter",
          criteria: [
            { key: "postsInOneHour", threshold: 20 },
            { key: "shortPost", threshold: 10 },
          ],
          actions: ["blockPost"],
        },
      ],
    },
  },
};
