import mongoose from "mongoose";

const connectDb = (handler) => async (req, res) => {
  if (mongoose.connection.readyState) {
    // Use current db connection
    return handler(req, res);
  }
  await mongoose
    .connect(process.env.MONGO_URL, { family: 4 })
    .catch((err) => console.log(err));

  return handler(req, res);
};

export default connectDb;
