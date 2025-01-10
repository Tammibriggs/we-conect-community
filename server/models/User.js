import { model, Schema, models, Model } from "mongoose";

const UserSchema = new Schema(
  {
    username: {
      type: String,
      min: 3,
      max: 20,
      require: true,
      unique: true,
    },
    profilePicture: {
      type: {
        url: {
          type: String,
        },
        filename: {
          type: String,
        },
      },
      default: {},
    },
    coverPicture: {
      type: {
        url: {
          type: String,
        },
        filename: {
          type: String,
        },
      },
      default: {},
    },
    bio: {
      type: String,
      max: 50,
    },
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);
export default User;
