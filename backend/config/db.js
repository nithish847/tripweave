import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URL) {
      throw new Error(" MONGODB_URL not defined in .env");
    }

    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(" MongoDB Connected Successfully");
  } catch (err) {
    console.error(" MongoDB Connection Failed:", err.message);
    process.exit(1);
  }
};

export default connectDB;
