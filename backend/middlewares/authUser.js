


import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization; // get "Authorization" header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Not Authorized, login again" });
    }

    const token = authHeader.split(" ")[1]; // extract token after "Bearer"
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id; // attach user ID to request
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export default authUser;
