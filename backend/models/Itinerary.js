import mongoose from "mongoose";

const ItinerarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  places: [{ type: mongoose.Schema.Types.ObjectId, ref: "Place" }]
}, { timestamps: true });

export default mongoose.model("Itinerary", ItinerarySchema);
