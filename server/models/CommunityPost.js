import { Types } from "mongoose";
import { model, Schema, models } from "mongoose";

const CommunityPostSchema = new Schema(
  {
    content: {
      type: String,
      max: 500,
    },
    media: {
      url: {
        type: String,
      },
      filename: {
        type: String,
      },
    },
    author: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    communityId: {
      type: Types.ObjectId,
      ref: "Community",
      required: true,
    },
    likes: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      default: "approved",
      enum: ["approved", "rejected"],
    },
    rejectionReason: { type: [{ type: String }] },
  },
  { timestamps: true }
);

const CommunityPost =
  models.CommunityPost || model("CommunityPost", CommunityPostSchema);
export default CommunityPost;
