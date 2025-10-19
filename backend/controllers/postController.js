//new one ->1
import jwt from "jsonwebtoken";
import Post from "../models/Post.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// ---------------- Auth Middleware ----------------
export const authUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Not Authorized, login again" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// ---------------- Create Post ----------------
export const createPost = async (req, res) => {
  try {
    const { description, locationText, country } = req.body;

    if (!description || !locationText || !country) {
      return res.status(400).json({ success: false, message: "Description, location, and country are required" });
    }

    let imageUrl = "";
    let imagePublicId = "";

    if (req.file) {
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "posts", transformation: [{ width: 800, height: 600, crop: "limit" }] },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      imageUrl = uploaded.secure_url;
      imagePublicId = uploaded.public_id;
    }

    const newPost = new Post({
      author: req.userId,
      description,
      imageUrl,
      imagePublicId,
      locationText,
      country,
    });

    const savedPost = await newPost.save();
    await savedPost.populate("author", "name username avatarUrl");

    res.status(201).json({ success: true, post: savedPost });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Get All Posts ----------------
// ---------------- Get All Posts (Safe version) ----------------
export const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = "createdAt", order = "desc" } = req.query;

    const sortOptions = {};
    sortOptions[sortBy] = order === "desc" ? -1 : 1;

    const posts = await Post.find()
      .populate("author", "name username avatarUrl")
      .populate("comments.user", "name username avatarUrl")
      .populate("ratings.user", "name username avatarUrl")
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // ✅ Filter out posts with missing authors
    const validPosts = posts.filter((post) => post.author && post.author._id);

    // ✅ Log invalid ones (for debugging)
    const invalidPosts = posts.filter((post) => !post.author);
    if (invalidPosts.length > 0) {
      console.warn("⚠️ Posts with missing author:", invalidPosts.map((p) => p._id));
    }

    // ✅ Safely build postsWithOwner
    const postsWithOwner = validPosts.map((post) => ({
      ...post.toObject(),
      isOwner: post.author?._id?.toString() === req.userId,
      likedByCurrentUser: Array.isArray(post.likes)
        ? post.likes.includes(req.userId)
        : false,
    }));

    const totalPosts = await Post.countDocuments();

    res.json({
      success: true,
      posts: postsWithOwner,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: parseInt(page),
      totalPosts,
    });
  } catch (error) {
    console.error(" Get posts error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ---------------- Like / Unlike Post ----------------
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId.trim());
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const userIndex = post.likes.indexOf(req.userId);

    if (userIndex === -1) {
      post.likes.push(req.userId);
    } else {
      post.likes.splice(userIndex, 1);
    }

    await post.save();

    res.json({
      success: true,
      likes: post.likes,
      likedByCurrentUser: post.likes.includes(req.userId),
      likesCount: post.likes.length
    });

  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Rate Post ----------------
export const ratePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { value } = req.body;

    if (!value || value < 1 || value > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const existingRatingIndex = post.ratings.findIndex(r => r.user.toString() === req.userId);
    
    if (existingRatingIndex !== -1) {
      post.ratings[existingRatingIndex].value = value;
    } else {
      post.ratings.push({ user: req.userId, value });
    }

    await post.save();

    // Calculate average rating
    const totalRating = post.ratings.reduce((sum, rating) => sum + rating.value, 0);
    const avgRating = post.ratings.length > 0 ? totalRating / post.ratings.length : 0;

    res.json({ 
      success: true, 
      avgRating: parseFloat(avgRating.toFixed(1)),
      ratings: post.ratings,
      ratingsCount: post.ratings.length
    });
  } catch (error) {
    console.error("Rate post error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Add Comment ----------------
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Comment cannot be empty" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    post.comments.push({ 
      user: req.userId, 
      text: text.trim(),
      createdAt: new Date()
    });
    
    await post.save();
    await post.populate("comments.user", "name username avatarUrl");

    res.json({ 
      success: true, 
      comments: post.comments,
      commentsCount: post.comments.length
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Get User's Posts ----------------
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const posts = await Post.find({ author: userId })
      .populate("author", "name username avatarUrl")
      .populate("comments.user", "name username avatarUrl")
      .populate("ratings.user", "name username avatarUrl")
      .sort({ createdAt: -1 });

    const postsWithOwner = posts.map(post => ({
      ...post.toObject(),
      isOwner: post.author._id.toString() === req.userId,
      likedByCurrentUser: post.likes.includes(req.userId)
    }));

    res.json({ 
      success: true, 
      posts: postsWithOwner,
      totalPosts: posts.length
    });
  } catch (error) {
    console.error("Get user posts error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Get Post Stats ----------------
export const getPostStats = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId).populate("author", "name username avatarUrl");

    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const totalRating = post.ratings.reduce((sum, rating) => sum + rating.value, 0);
    const avgRating = post.ratings.length > 0 ? totalRating / post.ratings.length : 0;

    res.json({
      success: true,
      stats: {
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        avgRating: parseFloat(avgRating.toFixed(1)),
        ratingsCount: post.ratings.length,
      },
    });
  } catch (error) {
    console.error("Get post stats error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Get Trending Posts ----------------
export const getTrendingPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name username avatarUrl")
      .populate("comments.user", "name username avatarUrl")
      .populate("ratings.user", "name username avatarUrl");

    const scoredPosts = posts.map(post => {
      const totalRating = post.ratings.reduce((sum, rating) => sum + rating.value, 0);
      const avgRating = post.ratings.length > 0 ? totalRating / post.ratings.length : 0;

      // Calculate trending score (weighted algorithm)
      const likeScore = post.likes.length * 2;
      const commentScore = post.comments.length * 3;
      const ratingScore = avgRating * 10;
      const timeScore = Math.log(Date.now() - new Date(post.createdAt).getTime() + 1) * 0.1;

      const score = likeScore + commentScore + ratingScore - timeScore;

      return {
        ...post.toObject(),
        score,
        trendingScore: parseFloat(score.toFixed(2)),
        isOwner: post.author._id.toString() === req.userId,
        likedByCurrentUser: post.likes.includes(req.userId)
      };
    });

    scoredPosts.sort((a, b) => b.score - a.score);
    const trendingPosts = scoredPosts.slice(0, 10); // Top 10 trending posts

    res.json({ success: true, posts: trendingPosts });
  } catch (error) {
    console.error("Get trending posts error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Delete Post ----------------
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Ownership check
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this post" });
    }

    // Delete image from Cloudinary
    if (post.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(post.imagePublicId);
      } catch (cloudinaryError) {
        console.error("Cloudinary delete error:", cloudinaryError);
        // Continue with post deletion even if image deletion fails
      }
    }

    // Delete post from DB
    await Post.findByIdAndDelete(postId);

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Update Post ----------------
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { description, locationText, country } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Not authorized to update this post" });
    }

    // Update fields if provided
    if (description !== undefined) post.description = description;
    if (locationText !== undefined) post.locationText = locationText;
    if (country !== undefined) post.country = country;

    // Handle image update
    if (req.file) {
      // Delete old image from Cloudinary
      if (post.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(post.imagePublicId);
        } catch (cloudinaryError) {
          console.error("Cloudinary delete error:", cloudinaryError);
        }
      }

      // Upload new image
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "posts", transformation: [{ width: 800, height: 600, crop: "limit" }] },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      post.imageUrl = uploaded.secure_url;
      post.imagePublicId = uploaded.public_id;
    }

    post.updatedAt = new Date();
    await post.save();

    await post.populate("author", "name username avatarUrl");
    await post.populate("comments.user", "name username avatarUrl");
    await post.populate("ratings.user", "name username avatarUrl");

    res.json({ 
      success: true, 
      message: "Post updated successfully", 
      post 
    });
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Get Global Stats ----------------
export const getGlobalStats = async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    
    const posts = await Post.find();
    const totalLikes = posts.reduce((sum, p) => sum + p.likes.length, 0);
    const totalComments = posts.reduce((sum, p) => sum + p.comments.length, 0);
    
    const allRatings = posts.flatMap(p => p.ratings.map(r => r.value));
    const avgRating = allRatings.length > 0 
      ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length 
      : 0;

    const totalUsers = await User.countDocuments();
    
    // Most active users
    const userPostCounts = await Post.aggregate([
      { $group: { _id: "$author", postCount: { $sum: 1 } } },
      { $sort: { postCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { "user.name": 1, "user.avatarUrl": 1, postCount: 1 } }
    ]);

    res.json({
      success: true,
      stats: { 
        totalPosts, 
        totalLikes, 
        totalComments, 
        avgRating: parseFloat(avgRating.toFixed(1)),
        totalUsers,
        mostActiveUsers: userPostCounts
      },
    });
  } catch (err) {
    console.error("Get global stats error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------- Get User Stats ----------------
export const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Fetch posts authored by the user
    const posts = await Post.find({ author: userId });

    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, p) => sum + p.likes.length, 0);
    const totalComments = posts.reduce((sum, p) => sum + p.comments.length, 0);

    // Collect all ratings values across user's posts
    const allRatings = posts.flatMap(p => p.ratings.map(r => r.value));
    const avgRating = allRatings.length > 0
      ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
      : 0;

    // Get unique countries visited
    const countriesVisited = [...new Set(posts.map(p => p.country).filter(Boolean))];

    // Calculate engagement rate
    const totalEngagement = totalLikes + totalComments;
    const engagementRate = totalPosts > 0 ? totalEngagement / totalPosts : 0;

    res.json({
      success: true,
      stats: {
        totalPosts,
        totalLikes,
        totalComments,
        avgRating: parseFloat(avgRating.toFixed(1)),
        countriesVisited: countriesVisited.length,
        engagementRate: parseFloat(engagementRate.toFixed(1)),
        totalEngagement
      },
      user: {
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    console.error("Get user stats error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------- Search Posts ----------------
export const searchPosts = async (req, res) => {
  try {
    const { q, location, country, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    let query = {};
    
    // Build search query
    if (q) {
      query.$or = [
        { description: { $regex: q, $options: 'i' } },
        { locationText: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (location) {
      query.locationText = { $regex: location, $options: 'i' };
    }
    
    if (country) {
      query.country = { $regex: country, $options: 'i' };
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const posts = await Post.find(query)
      .populate("author", "name username avatarUrl")
      .populate("comments.user", "name username avatarUrl")
      .populate("ratings.user", "name username avatarUrl")
      .sort(sortOptions);

    const postsWithOwner = posts.map(post => ({
      ...post.toObject(),
      isOwner: post.author._id.toString() === req.userId,
      likedByCurrentUser: post.likes.includes(req.userId)
    }));

    res.json({ 
      success: true, 
      posts: postsWithOwner,
      totalResults: posts.length
    });
  } catch (error) {
    console.error("Search posts error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

