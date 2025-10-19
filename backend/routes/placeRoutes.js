
//update->1
import express from "express";
import {
  syncPlacesFromCSV,
  getPlaces,
  getRandomPlaces,
  searchPlacesByState,
  getPlacesByStateAndCategory,
  getPlacesByCity,
  getUniqueStates
} from "../controllers/placeController.js";

const router = express.Router();

// --- Admin Routes ---
router.post("/sync", syncPlacesFromCSV);

// --- Public Routes ---
router.get("/", getPlaces);
router.get("/random", getRandomPlaces);

// --- Search & Filter Routes ---
router.get("/search/:state", searchPlacesByState); // Search by state name
router.get("/state/:state", searchPlacesByState);  // ← FIXED: Use correct function
router.get("/state/:state/:category", getPlacesByStateAndCategory); // State + category
router.get("/city/:cityName", getPlacesByCity);
router.get("/states", getUniqueStates);

export default router;
