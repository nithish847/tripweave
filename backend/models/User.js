

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Basic info
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },

    // Profile pic
    avatarUrl: {
      type: String,
      default: "https://www.gravatar.com/avatar/?d=mp",
    },
    avatarPublicId: { type: String }, // store Cloudinary public_id for deletion

    // Optional details
    country: { type: String },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    about: { type: String, default: "" },
    lastLoginAt: { type: Date, default: Date.now },

    // Preferences
    preferences: {
      budgetStyle: { type: String, default: "Mid-range" },
      travelStyle: { type: String, default: "Cultural" },
      groupSize: { type: String, default: "2-4 people" },
      accommodation: { type: String, default: "Hotels" },
    },

    // Recent trips
    trips: [
      {
        destination: { type: String, required: true },
        country: { type: String },
        date: { type: String },
        image: { type: String },
        rating: { type: Number, default: 0 },
        status: { type: String, enum: ["Completed", "Planned"], default: "Planned" },
      },
    ],

    // Saved destinations (referencing Place collection)
    savedDestinations: [
      {
        place: { type: mongoose.Schema.Types.ObjectId, ref: "Place" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
