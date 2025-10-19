import mongoose from "mongoose";

const savedDestinationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
}, { timestamps: true });

export default mongoose.model("SavedDestination", savedDestinationSchema);
