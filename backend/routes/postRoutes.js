

import express from "express";
import authUser from "../middlewares/authUser.js";
import upload from "../middlewares/upload.js"; // Multer (memory storage)
import {
  createPost,
  getPosts,
  likePost,
  ratePost,
  addComment,
  deletePost,
  updatePost,
  getPostStats,      // <-- added
  getTrendingPosts, 
  getGlobalStats, // <-- added
  getUserStats
} from "../controllers/postController.js";

const router = express.Router();

// ---------------- Protected Post Routes ----------------

// Create a new post (with image upload to Cloudinary)
router.post("/", authUser, upload.single("image"), createPost);

// Get all posts
router.get("/", authUser, getPosts);

// 🔥 Trending posts (placed BEFORE :postId routes)
router.get("/trending/all", authUser, getTrendingPosts);

// 📊 Post stats (placed BEFORE :postId routes)
router.get("/:postId/stats", authUser, getPostStats);

// Like / Unlike a post
router.post("/like/:postId", authUser, likePost);

// Rate a post (1–5)
router.post("/rate/:postId", authUser, ratePost);

// Add a comment
router.post("/comment/:postId", authUser, addComment);

// Update post
router.put("/:postId", authUser, upload.single("image"), updatePost);

// Delete post
router.get("/stats/global", authUser, getGlobalStats);
router.delete("/:postId", authUser, deletePost);

router.get("/users/:userId/stats", authUser, getUserStats);

export default router;
