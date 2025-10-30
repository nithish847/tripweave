import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";

// Routes
import placeRoutes from "./routes/placeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import itineraryRoutes from "./routes/itineraryRoutes.js";
import weatherRoutes from './routes/weatherRoutes.js';
import postRoutes from "./routes/postRoutes.js";

dotenv.config();
const app = express();

// Middleware
app.use(express.json());

// Enable CORS
const allowedOrigins = [
  "http://localhost:5173",             
  "https://tripweave-f.onrender.com",   
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));



// Routes
app.use("/api/places", placeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/itinerary", itineraryRoutes);


app.use('/api', weatherRoutes);
app.use("/api/posts", postRoutes);


// Connect to DB
connectDB();

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
