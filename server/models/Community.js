import { model, Schema, models, Types } from "mongoose";

// Filter Criteria Schema
const CriteriaSchema = new Schema({
  key: {
    type: String,
    required: true,
    enum: ["postsInOneHour", "shortPost"],
  },
  threshold: {
    type: Number,
  },
  enabled: {
    type: Boolean,
    required: true,
    default: true,
  },
});

// Preset Filter Schema
const PresetFilterSchema = new Schema({
  options: {
    type: [
      {
        name: { type: String, required: true },
        criteria: [CriteriaSchema],
        actions: {
          type: [String],
          required: true,
          default: ["blockPost"],
          enum: ["blockPost", "timeoutUser"],
        },
        actionConfig: {
          timeoutDuration: {
            type: String,
            default: "1-hour",
            enum: ["1-hour", "1-day", "1-week"],
          },
        },
        enabled: {
          type: Boolean,
          default: false,
        },
      },
    ],
    required: true,
  },
  enabled: {
    type: Boolean,
    default: false,
  },
});

const GeneratedFiltersSchema = new Schema({
  options: {
    type: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        enabled: { type: Boolean, required: true, default: false },
      },
    ],
    required: true,
    default: [],
  },
  enabled: {
    type: Boolean,
    default: false,
  },
});

const MembersSchema = new Schema({
  userId: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "member"],
    default: "member",
  },
  restriction: {
    type: {
      violationsCount: {
        type: Number,
        default: 0,
      },
      violations: {
        type: Array,
        required: true,
      },
      endTime: {
        type: Date,
      },
    },
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const CommunitySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      max: 500,
    },
    ownerId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverPicture: {
      url: {
        type: String,
      },
      filename: {
        type: String,
      },
    },
    members: [MembersSchema],
    rules: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    moderationFilters: {
      presets: { type: PresetFilterSchema, default: {} },
      generatedFilters: { type: GeneratedFiltersSchema, default: {} },
    },
  },
  { timestamps: true }
);

const Community = models.Community || model("Community", CommunitySchema);
export default Community;
