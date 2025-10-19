import mongoose from "mongoose";

const tripSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  destination: String,
  country: String,
  date: String,
  image: String,
  rating: { type: Number, default: 0 },
  status: { type: String, enum: ["Completed", "Planned"], default: "Planned" },
}, { timestamps: true });

export default mongoose.model("Trip", tripSchema);
