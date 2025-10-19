
import express from 'express';
import { 
  getItinerary,
  addPlaceToItinerary, 
  removePlaceFromItinerary,
  removeMultiplePlacesFromItinerary,
  getItineraryBudget, 
  getItineraryStats,
  clearItinerary,
  deletePlaceFromItinerary
} from '../controllers/itineraryController.js';
import authUser from "../middlewares/authUser.js";

const router = express.Router();

// All routes are protected by authUser middleware

// GET routes
router.get('/', authUser, getItinerary); // Get user's itinerary
router.get('/budget', authUser, getItineraryBudget); // Get itinerary budget breakdown
router.get('/stats', authUser, getItineraryStats); // Get itinerary statistics

// POST routes
router.post('/add', authUser, addPlaceToItinerary); // Add place(s) to itinerary
router.post('/remove', authUser, removePlaceFromItinerary); // Remove single place from itinerary
router.post('/remove-multiple', authUser, removeMultiplePlacesFromItinerary); // Remove multiple places

// DELETE routes
router.delete('/clear', authUser, clearItinerary); // Clear entire itinerary
router.delete('/:placeId', authUser, deletePlaceFromItinerary); // Remove place by URL parameter

export default router;