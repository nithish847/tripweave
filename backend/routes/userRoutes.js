 import express from "express";
import multer from "multer";
import authUser from "../middlewares/authUser.js";

import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount, // <-- import the delete controller
} from "../controllers/userController.js";

const router = express.Router();
const upload = multer(); // memory storage for avatar uploads

// ---------------- Public Routes ----------------
router.post("/register", registerUser);
router.post("/login", loginUser);

// ---------------- Protected Routes ----------------
router.post("/logout", authUser, logoutUser);
router.get("/profile", authUser, getUserProfile);
router.put("/profile", authUser, upload.single("avatar"), updateUserProfile);
router.delete("/account", authUser, deleteUserAccount); // <-- added DELETE route

export default router;
