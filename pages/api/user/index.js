import User from "@/server/models/User";
import connectDb from "@/server/utils/mongodb";
import { deleteFile, hasDisallowedFields } from "@/server/utils";
import { runMiddleware } from "@/server/utils";
import multer from "multer";
import { verifyToken } from "@/server/utils/jwt";
// import { updateUserSchema } from "@/server/utils/yupSchemas";

// const storage = multer.memoryStorage();
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/uploads");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + file.originalname);
    },
  }),
});
const uploadMiddleware = upload.fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "coverPicture", maxCount: 1 },
]);

const updateUser = async (req, res) => {
  const userId = req.userId;
  try {
    await runMiddleware(req, res, uploadMiddleware);
    let disAllowedFields = ["createdAt", "updatedAt"];
    if (hasDisallowedFields(req.body, disAllowedFields)) {
      return res.status(422).json({
        message:
          'Only the "username", "bio", "profilePicture", "coverPicture" fields are allowed.',
      });
    }
    const requestBody = { ...req.body };

    const { coverPicture, profilePicture } = req.files;
    if (coverPicture) {
      const url = `${process.env.BASE_URL}/${coverPicture[0].path.replace(
        /^public\//,
        ""
      )}`;
      requestBody.coverPicture = { filename: coverPicture[0].filename, url };
    }
    if (profilePicture) {
      const url = `${process.env.BASE_URL}/${profilePicture[0].path.replace(
        /^public\//,
        ""
      )}`;
      requestBody.profilePicture = {
        filename: profilePicture[0].filename,
        url,
      };
    }

    const user = await User.findById(userId);

    if (typeof requestBody.coverPicture === "string" && !coverPicture) {
      deleteFile(`public/uploads/${user.coverPicture.filename}`);
      requestBody.coverPicture = {};
    }
    if (typeof requestBody.profilePicture === "string" && !profilePicture) {
      deleteFile(`public/uploads/${user.profilePicture.filename}`);
      requestBody.profilePicture = {};
    }

    const updatedUser = await User.findByIdAndUpdate(userId, requestBody, {
      new: true,
    });

    res.status(200).json(updatedUser);
  } catch (err) {
    return res.status(500).json({ message: "Interanl Server Error" });
  }
};

const handler = async (req, res) => {
  if (req.method === "PATCH") {
    const result = await verifyToken(req);
    if (result.isError) {
      return res.status(401).json({ message: result.message });
    }
    return await updateUser(req, res);
  } else {
    res.status(405).send("Not Allowed");
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default connectDb(handler);
