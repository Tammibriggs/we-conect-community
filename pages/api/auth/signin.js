import Community from "@/server/models/Community";
import User from "@/server/models/User";
import communityData from "@/server/utils/communityData";
import { generateAccessToken } from "@/server/utils/jwt";
import connectDb from "@/server/utils/mongodb";

const signIn = async (req, res) => {
  try {
    const username = req.body.username;
    if (!username?.trim()) {
      return res.status(422).json({ message: '"username" is required' });
    }
    let user = await User.findOne({ username });
    if (!user) {
      // create user and assign resulting document to the user variable
      // After that chech if the dummuy community document exist,
      // if it does add new user as a member else create the document and add new user as admin
      user = await User.create({ username });
      const community = await Community.findById(communityData._id);
      if (community) {
        await community.updateOne({
          $push: { members: { userId: user._id, role: "member" } },
        });
      } else {
        await Community.create({
          ...communityData,
          ownerId: user._id,
          members: [{ userId: user._id, role: "admin" }],
        });
      }
    }
    const accessToken = generateAccessToken(user._id);
    return res.status(200).json({ user: user._doc, accessToken });
  } catch (err) {
    console.log(err, "This is the error");
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const handler = async (req, res) => {
  if (req.method === "POST") {
    await signIn(req, res);
  } else {
    res.status(405).json("Method Not Allowed");
  }
};

export default connectDb(handler);
