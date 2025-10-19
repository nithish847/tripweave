

//new one->1
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// ---------------- Register User ----------------
export const registerUser = async (req, res) => {
  try {
    const { name, username, email, password, avatarUrl, country } = req.body;

    // Validation
    if (!name || !username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required: name, username, email, password" 
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Please enter a valid email address" 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 8 characters long" 
      });
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: "Username can only contain letters, numbers, and underscores"
      });
    }

    // Check email & username uniqueness
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ 
          success: false, 
          message: "Email already registered" 
        });
      }
   
    }

    // Hash password
    const saltRounds = 12; // More secure salt rounds
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      avatarUrl: avatarUrl || "",
      country: country || "",
      preferences: {},
      trips: [],
      savedDestinations: [],
    });

    const user = await newUser.save();

    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        country: user.country,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error during registration" 
    });
  }
};

// ---------------- Login User ----------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        country: user.country,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error during login" 
    });
  }
};

// ---------------- Logout User ----------------
export const logoutUser = async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // or handle logout on the client side by removing the token
    res.json({ 
      success: true, 
      message: "Logged out successfully" 
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error during logout" 
    });
  }
};

// ---------------- Get User Profile ----------------
export const getUserProfile = async (req, res) => {
  try {
    const userProfile = await User.findById(req.userId).select("-password");
    if (!userProfile) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.json({
      success: true,
      user: {
        id: userProfile._id,
        name: userProfile.name,
        username: userProfile.username,
        email: userProfile.email,
        avatarUrl: userProfile.avatarUrl,
        country: userProfile.country,
        lastLoginAt: userProfile.lastLoginAt,
        preferences: userProfile.preferences,
        trips: userProfile.trips,
        savedDestinations: userProfile.savedDestinations,
        bio: userProfile.bio,
        location: userProfile.location,
        about: userProfile.about,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error while fetching profile" 
    });
  }
};

// ---------------- Update User Profile ----------------
export const updateUserProfile = async (req, res) => {
  try {
    const { name, username, email, bio, location, about, country } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Update text fields
    if (name) user.name = name.trim();
    
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ 
        username: username.toLowerCase().trim(),
        _id: { $ne: req.userId } // Exclude current user
      });
      
      if (usernameExists) {
        return res.status(409).json({ 
          success: false, 
          message: "Username already taken" 
        });
      }
      user.username = username.toLowerCase().trim();
    }
    
    if (email && email !== user.email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ 
          success: false, 
          message: "Please enter a valid email address" 
        });
      }

      const emailExists = await User.findOne({ 
        email: email.toLowerCase().trim(),
        _id: { $ne: req.userId } // Exclude current user
      });
      
      if (emailExists) {
        return res.status(409).json({ 
          success: false, 
          message: "Email already registered" 
        });
      }
      user.email = email.toLowerCase().trim();
    }

    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (about !== undefined) user.about = about;
    if (country !== undefined) user.country = country;

    // Update avatar if uploaded
    if (req.file) {
      try {
        // Delete previous avatar if exists
        if (user.avatarPublicId) {
          await cloudinary.uploader.destroy(user.avatarPublicId);
        }

        const uploaded = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { 
              folder: "avatars",
              transformation: [
                { width: 200, height: 200, crop: "fill" },
                { quality: "auto" },
                { format: "webp" } // Modern format
              ]
            },
            (error, result) => (result ? resolve(result) : reject(error))
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

        user.avatarUrl = uploaded.secure_url;
        user.avatarPublicId = uploaded.public_id;
      } catch (uploadError) {
        console.error("Avatar upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Error uploading avatar image"
        });
      }
    }

    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        country: user.country,
        bio: user.bio,
        location: user.location,
        about: user.about,
        preferences: user.preferences,
        trips: user.trips,
        savedDestinations: user.savedDestinations,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error while updating profile" 
    });
  }
};

// ---------------- Delete User Account ----------------
export const deleteUserAccount = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete avatar from Cloudinary if exists
    if (user.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (cloudErr) {
        console.error("Failed to delete avatar from Cloudinary:", cloudErr);
        // Continue deleting user even if avatar deletion fails
      }
    }

    // Delete the user from DB
    await User.findByIdAndDelete(req.userId);

    return res.status(200).json({
      success: true,
      message: "User account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting account",
    });
  }
};