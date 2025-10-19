


import Itinerary from "../models/Itinerary.js";
import Place from "../models/Place.js";


export const getItinerary = async (req, res) => {
  try {
    const userId = req.userId;
    
    const itinerary = await Itinerary.findOne({ userId })
      .populate("places", "Name State City Latitude Longitude EntranceFee Image ReviewRating Category Type Significance TimeNeededHrs");

    if (!itinerary) {
      return res.json({ 
        success: true, 
        itinerary: { 
          places: [],
          totalPlaces: 0,
          totalBudget: 0,
          totalEntranceFee: 0,
          estimatedTravelTime: 0
        } 
      });
    }

    // Calculate additional stats
    const totalPlaces = itinerary.places.length;
    const totalEntranceFee = itinerary.places.reduce((sum, place) => sum + (place.EntranceFee || 0), 0);
    const estimatedTravelTime = itinerary.places.reduce((sum, place) => sum + (place.TimeNeededHrs || 2), 0);
    
  
    const totalBudget = totalEntranceFee + (totalPlaces * 50);

    res.json({ 
      success: true, 
      itinerary: {
        ...itinerary.toObject(),
        totalPlaces,
        totalEntranceFee,
        estimatedTravelTime: Math.round(estimatedTravelTime * 10) / 10,
        totalBudget
      }
    });
  } catch (err) {
    console.error("GET /itinerary error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch itinerary", 
      error: err.message 
    });
  }
};

export const addPlaceToItinerary = async (req, res) => {
  try {
    const userId = req.userId;
    const { placeIds } = req.body;

    if (!Array.isArray(placeIds) || placeIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No places provided" 
      });
    }

    // Validate place IDs exist
    const existingPlaces = await Place.find({ _id: { $in: placeIds } });
    if (existingPlaces.length !== placeIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some places were not found"
      });
    }

    let itinerary = await Itinerary.findOne({ userId });
    
    if (!itinerary) {
      itinerary = new Itinerary({ 
        userId, 
        places: [],
        createdAt: new Date()
      });
    }

    // Add only new places and avoid duplicates
    const newPlaces = placeIds.filter(placeId => 
      !itinerary.places.includes(placeId)
    );

    if (newPlaces.length === 0) {
      return res.json({
        success: true,
        message: "Places already in itinerary",
        addedCount: 0,
        totalPlaces: itinerary.places.length
      });
    }

    itinerary.places.push(...newPlaces);
    itinerary.updatedAt = new Date();
    
    await itinerary.save();

    // Populate the updated itinerary for response
    await itinerary.populate("places", "Name State City EntranceFee Image ReviewRating Category");

    res.json({
      success: true,
      message: `${newPlaces.length} place(s) added to itinerary`,
      addedCount: newPlaces.length,
      totalPlaces: itinerary.places.length,
      itinerary: itinerary
    });
  } catch (err) {
    console.error("ADD to itinerary error:", err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid place ID format" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to add places to itinerary",
      error: err.message 
    });
  }
};

// Remove place from itinerary
export const removePlaceFromItinerary = async (req, res) => {
  try {
    const userId = req.userId;
    const { placeId } = req.body;

    if (!placeId) {
      return res.status(400).json({ 
        success: false, 
        message: "Place ID is required" 
      });
    }

    const itinerary = await Itinerary.findOne({ userId });
    if (!itinerary) {
      return res.status(404).json({ 
        success: false, 
        message: "Itinerary not found" 
      });
    }

    const initialLength = itinerary.places.length;
    itinerary.places = itinerary.places.filter(id => id.toString() !== placeId);
    
    if (itinerary.places.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Place not found in itinerary"
      });
    }

    itinerary.updatedAt = new Date();
    await itinerary.save();

    // Populate the updated itinerary
    await itinerary.populate("places", "Name State City EntranceFee Image ReviewRating Category");

    res.json({ 
      success: true, 
      message: "Place removed from itinerary",
      removedPlaceId: placeId,
      totalPlaces: itinerary.places.length,
      itinerary: itinerary
    });
  } catch (err) {
    console.error("REMOVE from itinerary error:", err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid place ID format" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to remove place from itinerary",
      error: err.message 
    });
  }
};

// Remove multiple places from itinerary
export const removeMultiplePlacesFromItinerary = async (req, res) => {
  try {
    const userId = req.userId;
    const { placeIds } = req.body;

    if (!Array.isArray(placeIds) || placeIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Place IDs array is required" 
      });
    }

    const itinerary = await Itinerary.findOne({ userId });
    if (!itinerary) {
      return res.status(404).json({ 
        success: false, 
        message: "Itinerary not found" 
      });
    }

    const initialLength = itinerary.places.length;
    itinerary.places = itinerary.places.filter(id => 
      !placeIds.includes(id.toString())
    );
    
    const removedCount = initialLength - itinerary.places.length;
    
    if (removedCount === 0) {
      return res.json({
        success: true,
        message: "No matching places found in itinerary",
        removedCount: 0,
        totalPlaces: itinerary.places.length
      });
    }

    itinerary.updatedAt = new Date();
    await itinerary.save();

    await itinerary.populate("places", "Name State City EntranceFee Image ReviewRating Category");

    res.json({ 
      success: true, 
      message: `${removedCount} place(s) removed from itinerary`,
      removedCount,
      totalPlaces: itinerary.places.length,
      itinerary: itinerary
    });
  } catch (err) {
    console.error("REMOVE multiple from itinerary error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to remove places from itinerary",
      error: err.message 
    });
  }
};

// Get itinerary budget with detailed breakdown
export const getItineraryBudget = async (req, res) => {
  try {
    const userId = req.userId;
    const itinerary = await Itinerary.findOne({ userId })
      .populate("places", "Name EntranceFee TimeNeededHrs State City");

    if (!itinerary || itinerary.places.length === 0) {
      return res.json({
        success: true,
        budget: {
          totalEntranceFee: 0,
          estimatedTravelCost: 0,
          estimatedAccommodation: 0,
          estimatedFood: 0,
          totalBudget: 0,
          places: [],
          breakdown: {
            entranceFees: 0,
            travel: 0,
            accommodation: 0,
            food: 0
          }
        }
      });
    }

    // Calculate costs
    const totalEntranceFee = itinerary.places.reduce((sum, place) => sum + (place.EntranceFee || 0), 0);
    const totalTravelTime = itinerary.places.reduce((sum, place) => sum + (place.TimeNeededHrs || 2), 0);
    
    // Cost estimates (simplified)
    const estimatedTravelCost = Math.round(totalTravelTime * 100); // ₹100 per hour of travel
    const estimatedAccommodation = itinerary.places.length * 1500; // ₹1500 per place (simplified)
    const estimatedFood = itinerary.places.length * 500; // ₹500 per place for food
    const totalBudget = totalEntranceFee + estimatedTravelCost + estimatedAccommodation + estimatedFood;

    const budget = {
      totalEntranceFee,
      estimatedTravelCost,
      estimatedAccommodation,
      estimatedFood,
      totalBudget,
      places: itinerary.places.map(place => ({
        id: place._id,
        name: place.Name,
        entranceFee: place.EntranceFee || 0,
        state: place.State,
        city: place.City
      })),
      breakdown: {
        entranceFees: totalEntranceFee,
        travel: estimatedTravelCost,
        accommodation: estimatedAccommodation,
        food: estimatedFood
      },
      summary: {
        totalPlaces: itinerary.places.length,
        estimatedTotalTime: Math.round(totalTravelTime * 10) / 10,
        costPerCategory: {
          entrance: Math.round((totalEntranceFee / totalBudget) * 100) || 0,
          travel: Math.round((estimatedTravelCost / totalBudget) * 100) || 0,
          accommodation: Math.round((estimatedAccommodation / totalBudget) * 100) || 0,
          food: Math.round((estimatedFood / totalBudget) * 100) || 0
        }
      }
    };

    res.json({
      success: true,
      budget
    });
  } catch (err) {
    console.error("GET /itinerary/budget error:", err);
    res.status(500).json({ 
      success: false,
      message: "Budget calculation failed", 
      error: err.message 
    });
  }
};

// Clear entire itinerary
export const clearItinerary = async (req, res) => {
  try {
    const userId = req.userId;
    
    const itinerary = await Itinerary.findOne({ userId });
    if (!itinerary) {
      return res.status(404).json({ 
        success: false, 
        message: "Itinerary not found" 
      });
    }

    const removedCount = itinerary.places.length;
    itinerary.places = [];
    itinerary.updatedAt = new Date();
    
    await itinerary.save();

    res.json({
      success: true,
      message: `Itinerary cleared. ${removedCount} place(s) removed.`,
      removedCount,
      itinerary: {
        places: [],
        totalPlaces: 0
      }
    });
  } catch (err) {
    console.error("CLEAR itinerary error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to clear itinerary",
      error: err.message 
    });
  }
};

// Get itinerary statistics
export const getItineraryStats = async (req, res) => {
  try {
    const userId = req.userId;
    const itinerary = await Itinerary.findOne({ userId })
      .populate("places", "Category State EntranceFee TimeNeededHrs ReviewRating");

    if (!itinerary || itinerary.places.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalPlaces: 0,
          categories: {},
          states: {},
          totalCost: 0,
          totalTime: 0,
          averageRating: 0
        }
      });
    }

    // Calculate statistics
    const categories = {};
    const states = {};
    let totalCost = 0;
    let totalTime = 0;
    let totalRating = 0;

    itinerary.places.forEach(place => {
      // Category statistics
      const category = place.Category || 'Other';
      categories[category] = (categories[category] || 0) + 1;

      // State statistics
      const state = place.State || 'Unknown';
      states[state] = (states[state] || 0) + 1;

      // Totals
      totalCost += place.EntranceFee || 0;
      totalTime += place.TimeNeededHrs || 2;
      totalRating += place.ReviewRating || 4;
    });

    const averageRating = totalRating / itinerary.places.length;

    res.json({
      success: true,
      stats: {
        totalPlaces: itinerary.places.length,
        categories,
        states,
        totalCost,
        totalTime: Math.round(totalTime * 10) / 10,
        averageRating: Math.round(averageRating * 10) / 10,
        costRange: {
          min: 0,
          max: totalCost,
          average: Math.round(totalCost / itinerary.places.length)
        }
      }
    });
  } catch (err) {
    console.error("GET /itinerary/stats error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to get itinerary statistics", 
      error: err.message 
    });
  }
};

// Delete specific place from itinerary (by URL parameter)
export const deletePlaceFromItinerary = async (req, res) => {
  try {
    const userId = req.userId;
    const { placeId } = req.params;

    if (!placeId) {
      return res.status(400).json({ 
        success: false, 
        message: "Place ID is required" 
      });
    }

    const itinerary = await Itinerary.findOne({ userId });
    if (!itinerary) {
      return res.status(404).json({ 
        success: false, 
        message: "Itinerary not found" 
      });
    }

    const initialLength = itinerary.places.length;
    itinerary.places = itinerary.places.filter(id => id.toString() !== placeId);
    
    if (itinerary.places.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Place not found in itinerary"
      });
    }

    itinerary.updatedAt = new Date();
    await itinerary.save();

    await itinerary.populate("places", "Name State City EntranceFee Image ReviewRating Category");

    res.json({ 
      success: true, 
      message: "Place removed from itinerary",
      removedPlaceId: placeId,
      totalPlaces: itinerary.places.length,
      itinerary: itinerary
    });
  } catch (err) {
    console.error("DELETE /itinerary/:placeId error:", err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid place ID format" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to remove place from itinerary",
      error: err.message 
    });
  }
};