
import fs from "fs";
import csv from "csv-parser";
import Place from "../models/Place.js";

// --- ENHANCED CSV SYNC WITH PERFORMANCE OPTIMIZATION ---
export const syncPlacesFromCSV = async (req, res) => {
  try {
    const batchSize = 100;
    const rows = [];
    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log(" Starting CSV sync process...");

    fs.createReadStream("data/updated_dataset_with_images.csv")
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on("data", (row) => rows.push(row))
      .on("end", async () => {
        try {
          console.log(` Processing ${rows.length} rows...`);

          // Get all existing places at once (much faster than individual queries)
          const existingPlaces = new Set(
            (await Place.find({}, { Name: 1, State: 1 })).map(p => `${p.Name}-${p.State}`)
          );

          // Process in batches for better performance and memory management
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const placesToInsert = [];

            for (const row of batch) {
              try {
                const placeKey = `${row.Name?.trim()}-${row.State?.trim()}`;
                
                if (!existingPlaces.has(placeKey) && row.Name?.trim()) {
                  const placeData = {
                    Zone: row.Zone?.trim() || null,
                    State: row.State?.trim() || null,
                    City: row.City?.trim() || null,
                    Name: row.Name?.trim(),
                    Type: row.Type?.trim() || null,
                    EstablishmentYear: row["Establishment Year"]?.trim() || null,
                    TimeNeededHrs: parseFloat(row["time needed to visit in hrs"]) || 0,
                    ReviewRating: Math.min(5, Math.max(0, parseFloat(row["Google review rating"]) || 0)),
                    EntranceFee: Math.max(0, parseFloat(row["Entrance Fee in INR"]) || 0),
                    AirportWithin50km: row["Airport with 50km Radius"]?.trim() === "Yes",
                    WeeklyOff: row["Weekly Off"]?.trim() || null,
                    Significance: row["Significance"]?.trim() || null,
                    DSLRAllowed: row["DSLR Allowed"]?.trim() === "Yes",
                    ReviewCountLakhs: Math.max(0, parseFloat(row["Number of google review in lakhs"]) || 0),
                    BestTime: row["Best Time to visit"]?.trim() || null,
                    Category: row["Category"]?.trim() || null,
                    Lat: parseFloat(row.Latitude) || null,
                    Lon: parseFloat(row.Longitude) || null,
                    Wikipedia_URL: row["Wikipedia_URL"]?.trim() || null,
                    Image: row["Wikipedia_Image"]?.trim() || null,
                    Source: "CSV Import",
                    isActive: true
                  };

                  // Add to batch
                  placesToInsert.push(placeData);
                } else {
                  skippedCount++;
                }
              } catch (err) {
                console.error(`Error processing row: ${row.Name}`, err.message);
                errorCount++;
              }
            }

            // Batch insert for much better performance
            if (placesToInsert.length > 0) {
              try {
                await Place.insertMany(placesToInsert, { ordered: false });
                insertedCount += placesToInsert.length;
                console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: Inserted ${placesToInsert.length} places`);
              } catch (batchInsertError) {
                console.error(` Batch insert error:`, batchInsertError.message);
                errorCount += placesToInsert.length;
              }
            }
          }

          console.log(`\n Import Summary:`);
          console.log(` Inserted: ${insertedCount}`);
          console.log(`⏭ Skipped: ${skippedCount}`);
          console.log(` Errors: ${errorCount}`);

          res.json({ 
            success: true,
            message: `✅ Sync complete. ${insertedCount} new places added, ${skippedCount} skipped.`,
            stats: {
              inserted: insertedCount,
              skipped: skippedCount,
              errors: errorCount,
              total: rows.length,
              processingTime: `${Date.now() - Date.now()} ms`
            }
          });
        } catch (batchError) {
          console.error(" Batch processing error:", batchError);
          res.status(500).json({ 
            success: false,
            error: "Failed during batch processing",
            message: batchError.message 
          });
        }
      })
      .on("error", (csvError) => {
        console.error(" CSV reading error:", csvError);
        res.status(500).json({ 
          success: false,
          error: "Failed to read CSV file",
          message: csvError.message 
        });
      });
  } catch (error) {
    console.error(" Error syncing places:", error.message);
    res.status(500).json({ 
      success: false,
      error: "Failed to sync places from CSV",
      message: error.message 
    });
  }
};

// --- ENHANCED GET ALL PLACES WITH PAGINATION ---
export const getPlaces = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      state,
      category,
      zone,
      minRating,
      maxFee,
      sortBy = 'ReviewRating',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    const query = { isActive: { $ne: false } };
    
    // Add search filters
    if (search) {
      query.$or = [
        { Name: { $regex: search, $options: 'i' } },
        { City: { $regex: search, $options: 'i' } },
        { Significance: { $regex: search, $options: 'i' } },
        { Type: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (state) query.State = { $regex: state, $options: 'i' };
    if (category) query.Category = { $regex: category, $options: 'i' };
    if (zone) query.Zone = { $regex: zone, $options: 'i' };
    if (minRating) query.ReviewRating = { $gte: parseFloat(minRating) };
    if (maxFee) query.EntranceFee = { $lte: parseFloat(maxFee) };

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute paginated query with optimizations
    const places = await Place.find(query)
      .sort(sort)
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('-__v -userReviews -userPhotos -tips') // Exclude heavy fields for list view
      .lean(); // Faster query execution

    // Get total count for pagination
    const total = await Place.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      success: true,
      places,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPlaces: total,
        hasNext,
        hasPrev,
        limit: parseInt(limit),
        showing: `${((page - 1) * limit) + 1}-${Math.min(page * limit, total)} of ${total}`
      },
      filters: {
        search, state, category, zone, minRating, maxFee, sortBy, sortOrder
      }
    });
  } catch (error) {
    console.error("Error fetching places:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch places",
      message: error.message 
    });
  }
};

// --- ENHANCED RANDOM PLACES WITH BETTER ALGORITHM ---
export const getRandomPlaces = async (req, res) => {
  try {
    const { limit = 4, diverseStates = 'true', minRating = 3.5 } = req.query;

    let places = [];

    if (diverseStates === 'true') {
      // Get places from different states for better diversity
      places = await Place.aggregate([
        { 
          $match: { 
            isActive: { $ne: false }, 
            ReviewRating: { $gte: parseFloat(minRating) },
            Image: { $ne: null, $ne: '' } // Ensure places have images
          } 
        },
        { 
          $group: { 
            _id: '$State', 
            places: { $push: '$$ROOT' },
            maxRating: { $max: '$ReviewRating' },
            count: { $sum: 1 }
          } 
        },
        { $sort: { maxRating: -1, count: -1 } },
        { $limit: parseInt(limit) },
        { 
          $project: { 
            // Pick random place from each state
            place: { 
              $arrayElemAt: [
                '$places', 
                { $floor: { $multiply: [{ $rand: {} }, { $size: '$places' }] } }
              ] 
            }
          } 
        },
        { $replaceRoot: { newRoot: '$place' } },
        { $project: { __v: 0, userReviews: 0, userPhotos: 0, tips: 0 } }
      ]);

      // If we don't have enough diverse states, fill remaining with random places
      if (places.length < parseInt(limit)) {
        const existingStates = places.map(p => p.State);
        const additionalPlaces = await Place.aggregate([
          { 
            $match: { 
              isActive: { $ne: false },
              ReviewRating: { $gte: parseFloat(minRating) },
              State: { $nin: existingStates }
            } 
          },
          { $sample: { size: parseInt(limit) - places.length } },
          { $project: { __v: 0, userReviews: 0, userPhotos: 0, tips: 0 } }
        ]);
        places = places.concat(additionalPlaces);
      }
    } else {
      // Simple random selection
      places = await Place.aggregate([
        { 
          $match: { 
            isActive: { $ne: false }, 
            ReviewRating: { $gte: parseFloat(minRating) }
          } 
        },
        { $sample: { size: parseInt(limit) } },
        { $project: { __v: 0, userReviews: 0, userPhotos: 0, tips: 0 } }
      ]);
    }

    res.json({
      success: true,
      places,
      count: places.length,
      diverseStates: diverseStates === 'true',
      minRating: parseFloat(minRating)
    });
  } catch (error) {
    console.error(" Error fetching random places:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch random places",
      error: error.message 
    });
  }
};

// --- ENHANCED SEARCH PLACES BY STATE ---
export const searchPlacesByState = async (req, res) => {
  try {
    const { state } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      category, 
      minRating,
      maxFee,
      sortBy = 'ReviewRating',
      sortOrder = 'desc'
    } = req.query;

    const query = { 
      State: { $regex: state, $options: "i" },
      isActive: { $ne: false }
    };

    // Add optional filters
    if (category && category !== 'all') {
      query.Category = { $regex: category, $options: 'i' };
    }
    if (minRating) query.ReviewRating = { $gte: parseFloat(minRating) };
    if (maxFee) query.EntranceFee = { $lte: parseFloat(maxFee) };

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const places = await Place.find(query)
      .sort(sort)
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('-__v -userReviews -userPhotos -tips')
      .lean();

    const total = await Place.countDocuments(query);

    // Get state statistics
    const stateStats = await Place.aggregate([
      { $match: { State: { $regex: state, $options: "i" }, isActive: { $ne: false } } },
      {
        $group: {
          _id: null,
          totalPlaces: { $sum: 1 },
          avgRating: { $avg: '$ReviewRating' },
          categories: { $addToSet: '$Category' },
          avgEntranceFee: { $avg: '$EntranceFee' },
          freeEntry: { $sum: { $cond: [{ $eq: ['$EntranceFee', 0] }, 1, 0] } },
          topRated: { $max: '$ReviewRating' }
        }
      }
    ]);

    res.json({
      success: true,
      state,
      places,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPlaces: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
        limit: parseInt(limit)
      },
      stateStats: stateStats.length > 0 ? {
        ...stateStats[0],
        categoryCount: stateStats[0].categories.length,
        avgRating: Math.round(stateStats[0].avgRating * 10) / 10,
        avgEntranceFee: Math.round(stateStats[0].avgEntranceFee || 0)
      } : null,
      filters: { category, minRating, maxFee, sortBy, sortOrder }
    });
  } catch (error) {
    console.error(" Error searching places by state:", error.message);
    res.status(500).json({ 
      success: false,
      error: "Failed to search places by state",
      message: error.message 
    });
  }
};

// --- ENHANCED GET PLACES BY STATE AND CATEGORY ---
export const getPlacesByStateAndCategory = async (req, res) => {
  try {
    const { state, category } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      minRating,
      maxFee,
      sortBy = 'ReviewRating',
      sortOrder = 'desc'
    } = req.query;

    const query = {
      State: { $regex: state, $options: "i" },
      isActive: { $ne: false }
    };

    // Add category filter if specified and not 'all'
    if (category && category !== 'all') {
      query.Category = { $regex: category, $options: "i" };
    }
    
    // Add optional filters
    if (minRating) query.ReviewRating = { $gte: parseFloat(minRating) };
    if (maxFee) query.EntranceFee = { $lte: parseFloat(maxFee) };

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const places = await Place.find(query)
      .sort(sort)
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('-__v -userReviews -userPhotos -tips')
      .lean();

    const total = await Place.countDocuments(query);

    // Get category-specific stats
    const categoryStats = await Place.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$Category',
          count: { $sum: 1 },
          avgRating: { $avg: '$ReviewRating' },
          avgFee: { $avg: '$EntranceFee' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      state,
      category: category || 'all',
      places,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPlaces: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
        limit: parseInt(limit)
      },
      categoryStats,
      filters: { minRating, maxFee, sortBy, sortOrder }
    });
  } catch (error) {
    console.error(" Error fetching places by state & category:", error.message);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch places by state & category",
      message: error.message 
    });
  }
};

// --- ENHANCED GET PLACES BY CITY ---
export const getPlacesByCity = async (req, res) => {
  try {
    const { cityName } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      category, 
      minRating,
      maxFee,
      sortBy = 'ReviewRating',
      sortOrder = 'desc'
    } = req.query;

    const query = { 
      City: { $regex: cityName, $options: "i" },
      isActive: { $ne: false }
    };

    // Add filters
    if (category && category !== 'all') {
      query.Category = { $regex: category, $options: 'i' };
    }
    if (minRating) query.ReviewRating = { $gte: parseFloat(minRating) };
    if (maxFee) query.EntranceFee = { $lte: parseFloat(maxFee) };

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const places = await Place.find(query)
      .sort(sort)
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('-__v -userReviews -userPhotos -tips')
      .lean();

    const total = await Place.countDocuments(query);

    // Get comprehensive city statistics
    const cityStats = await Place.aggregate([
      { $match: { City: { $regex: cityName, $options: "i" }, isActive: { $ne: false } } },
      {
        $group: {
          _id: null,
          totalPlaces: { $sum: 1 },
          avgRating: { $avg: '$ReviewRating' },
          categories: { $addToSet: '$Category' },
          zones: { $addToSet: '$Zone' },
          states: { $addToSet: '$State' },
          freePlaces: { $sum: { $cond: [{ $eq: ['$EntranceFee', 0] }, 1, 0] } },
          avgEntranceFee: { $avg: '$EntranceFee' },
          topRated: { $max: '$ReviewRating' },
          totalReviews: { $sum: '$ReviewCountLakhs' }
        }
      }
    ]);

    // Get top categories in this city
    const topCategories = await Place.aggregate([
      { $match: { City: { $regex: cityName, $options: "i" }, isActive: { $ne: false } } },
      { $group: { _id: '$Category', count: { $sum: 1 }, avgRating: { $avg: '$ReviewRating' } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      city: cityName,
      places,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPlaces: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
        limit: parseInt(limit)
      },
      cityStats: cityStats.length > 0 ? {
        ...cityStats[0],
        categoryCount: cityStats[0].categories.length,
        avgRating: Math.round(cityStats[0].avgRating * 10) / 10,
        avgEntranceFee: Math.round(cityStats[0].avgEntranceFee || 0),
        freePercentage: Math.round((cityStats[0].freePlaces / cityStats[0].totalPlaces) * 100)
      } : null,
      topCategories,
      filters: { category, minRating, maxFee, sortBy, sortOrder }
    });
  } catch (err) {
    console.error("Error fetching places by city:", err.message);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch places by city",
      message: err.message 
    });
  }
};
// --- GET UNIQUE STATES WITH COUNTS AND IMAGES ---
export const getUniqueStates = async (req, res) => {
  try {
    const stateStats = await Place.aggregate([
      { $match: { isActive: { $ne: false }, State: { $ne: null, $ne: "" } } },
      {
        $group: {
          _id: "$State",
          count: { $sum: 1 },
          image: { $first: "$Image" } 
        }
      },
      { $sort: { count: -1 } }
    ]);

    const states = stateStats.map(stat => ({
      name: stat._id,
      count: stat.count,
      image: stat.image || "/images/default-travel.jpg"
    }));

    res.json({
      success: true,
      states,
      count: states.length
    });
  } catch (error) {
    console.error(" Error fetching unique states:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch states",
      message: error.message 
    });
  }
};