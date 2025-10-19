// models/Post.js
import mongoose from "mongoose";
const ratingSub = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  value: { type: Number, min: 1, max: 5, required: true },
}, { _id: false });

const commentSub = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  description: { type: String, required: true },     // your “content”
  imageUrl: { type: String, required: true },        // Cloudinary URL
  imagePublicId: { type: String, required: true },   // for delete/replace
  locationText: { type: String, required: true },    // e.g., “Kerala, India”
  country: { type: String, required: true },         // “India” for stats
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // who liked
  ratings: [ratingSub],                               // one rating per user
  comments: [commentSub],
}, { timestamps: true });

// Useful virtuals
postSchema.virtual("likesCount").get(function () { return this.likes?.length || 0; });
postSchema.virtual("avgRating").get(function () {
  if (!this.ratings?.length) return 0;
  return this.ratings.reduce((a, r) => a + r.value, 0) / this.ratings.length;
});
postSchema.set("toJSON", { virtuals: true });
postSchema.set("toObject", { virtuals: true });
export default mongoose.model("Post", postSchema);
