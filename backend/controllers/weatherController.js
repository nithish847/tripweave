

//new->1

import axios from "axios";
import dotenv from "dotenv";
import { bestSeasons } from "../data/bestSeasons.js";

dotenv.config();

const API_KEY = process.env.OPENWEATHER_API_KEY;
if (!API_KEY) {
  console.error(" OPENWEATHER_API_KEY is missing in .env!");
  process.exit(1);
}

const OPENWEATHER_API = "https://api.openweathermap.org/data/2.5";

// Enhanced location mapping with more cities and states
const stateCityMap = {
  // States with multiple major cities
  "andhra pradesh": ["Vijayawada", "Visakhapatnam", "Tirupati"],
  "telangana": ["Hyderabad", "Warangal", "Karimnagar"],
  "tamil nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
  "kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"],
  "rajasthan": ["Jaipur", "Udaipur", "Jodhpur", "Jaisalmer"],
  "himachal pradesh": ["Shimla", "Manali", "Dharamshala", "Kullu"],
  "maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik"],
  "karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"],
  "uttar pradesh": ["Lucknow", "Varanasi", "Agra", "Prayagraj"],
  "west bengal": ["Kolkata", "Darjeeling", "Howrah", "Durgapur"],
  "gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "punjab": ["Chandigarh", "Amritsar", "Ludhiana", "Jalandhar"],
  "madhya pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
  "odisha": ["Bhubaneswar", "Puri", "Cuttack", "Rourkela"],
  "assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat"]
};

// Popular tourist destinations mapping
const touristDestinations = {
  "taj mahal": "Agra",
  "goa": "Goa",
  "varanasi": "Varanasi", 
  "darjeeling": "Darjeeling",
  "shimla": "Shimla",
  "manali": "Manali",
  "munnar": "Munnar",
  "alleppey": "Alappuzha",
  "pondicherry": "Puducherry",
  "ladakh": "Leh",
  "kashmir": "Srinagar",
  "udaipur": "Udaipur",
  "jaisalmer": "Jaisalmer",
  "khajuraho": "Khajuraho",
  "hampi": "Hospet",
  "mysore": "Mysuru",
  "ooty": "Udhagamandalam",
  "kodaikanal": "Kodaikanal"
};

const formatTime = (ts, timezone) => {
  const date = new Date((ts + timezone) * 1000);
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

// Get exact coordinates for a place
const getExactCoordinates = async (place) => {
  try {
    const geoRes = await axios.get("https://api.openweathermap.org/geo/1.0/direct", {
      params: {
        q: encodeURIComponent(place),
        limit: 5, // Get multiple results for better matching
        appid: API_KEY
      }
    });

    if (!geoRes.data || geoRes.data.length === 0) {
      throw new Error("Place not found in Geo API");
    }

    // Return the first result (most relevant)
    return geoRes.data[0];
  } catch (error) {
    console.error("Geocoding error:", error);
    throw error;
  }
};

// Get weather by coordinates
const getWeatherByCoordinates = async (lat, lon) => {
  try {
    // Get location name from coordinates (reverse geocoding)
    const reverseGeoRes = await axios.get("https://api.openweathermap.org/geo/1.0/reverse", {
      params: { lat, lon, limit: 1, appid: API_KEY }
    });

    const locationInfo = reverseGeoRes.data[0];
    
    // Get current weather
    const weatherRes = await axios.get(`${OPENWEATHER_API}/weather`, {
      params: { lat, lon, units: "metric", appid: API_KEY }
    });

    const w = weatherRes.data;
    const current = {
      place: locationInfo?.name || "Unknown Location",
      state: locationInfo?.state || null,
      country: locationInfo?.country,
      latitude: lat,
      longitude: lon,
      temperature: w.main.temp,
      feelsLike: w.main.feels_like,
      minTemp: w.main.temp_min,
      maxTemp: w.main.temp_max,
      condition: w.weather[0].main,
      description: w.weather[0].description,
      humidity: w.main.humidity,
      pressure: w.main.pressure,
      windSpeed: w.wind.speed,
      cloudCoverage: w.clouds.all,
      visibility: w.visibility / 1000,
      sunrise: formatTime(w.sys.sunrise, w.timezone),
      sunset: formatTime(w.sys.sunset, w.timezone),
      icon: w.weather[0].icon
    };

    // Get 5-day forecast
    const forecastRes = await axios.get(`${OPENWEATHER_API}/forecast`, {
      params: { lat, lon, units: "metric", appid: API_KEY }
    });

    const forecast = forecastRes.data.list
      .filter(item => item.dt_txt.includes("12:00:00"))
      .slice(0, 5)
      .map(item => ({
        date: item.dt_txt.split(" ")[0],
        temperature: item.main.temp,
        condition: item.weather[0].main,
        description: item.weather[0].description,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        icon: item.weather[0].icon
      }));

    return { current, forecast };
  } catch (error) {
    console.error("Weather by coordinates error:", error);
    throw error;
  }
};

export const getWeatherForPlace = async (req, res) => {
  try {
    let { place, lat, lon } = req.query;

    // If coordinates are provided, use them directly
    if (lat && lon) {
      const weatherData = await getWeatherByCoordinates(parseFloat(lat), parseFloat(lon));
      
      // Get best season based on coordinates (simplified)
      const bestSeason = {
        seasons: ["October - March"],
        note: "Pleasant season for most parts of India."
      };

      return res.json({ 
        success: true, 
        ...weatherData, 
        bestSeason,
        locationType: "coordinates"
      });
    }

    // Handle place-based search
    if (!place) {
      return res.status(400).json({ success: false, message: "Place or coordinates are required" });
    }

    place = place.trim().toLowerCase();

    // Check if it's a popular tourist destination
    if (touristDestinations[place]) {
      place = touristDestinations[place];
    }
    // Check if it's a state name
    else if (stateCityMap[place]) {
      // Use the first city in the state as default
      place = stateCityMap[place][0];
    }

    console.log("Fetching weather for:", place);

    // Get exact coordinates for the place
    const geoData = await getExactCoordinates(place);
    const { lat: exactLat, lon: exactLon, state, country, name } = geoData;

    // Get weather data using exact coordinates
    const weatherData = await getWeatherByCoordinates(exactLat, exactLon);
    
    // Update place name with exact match from geocoding
    weatherData.current.place = name;
    weatherData.current.state = state;

    // Best season matching
    const stateName = state || Object.keys(stateCityMap).find(k => 
      stateCityMap[k].some(city => city.toLowerCase() === place.toLowerCase())
    );
    const bestSeasonKey = stateName?.toLowerCase().replace(/\s/g, "");
    const bestSeason = bestSeasons[bestSeasonKey] || {
      seasons: ["October - March"],
      note: "Pleasant season for most parts of India."
    };

    res.json({ 
      success: true, 
      ...weatherData, 
      bestSeason,
      locationType: "place",
      exactLocation: {
        name,
        state,
        country,
        latitude: exactLat,
        longitude: exactLon
      }
    });

  } catch (error) {
    console.error("Weather API Error:", error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch weather", 
      error: error.response?.data || error.message 
    });
  }
};

// New endpoint for getting user's current location weather
export const getCurrentLocationWeather = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ 
        success: false, 
        message: "Latitude and longitude are required" 
      });
    }

    const weatherData = await getWeatherByCoordinates(parseFloat(lat), parseFloat(lon));
    
    const bestSeason = {
      seasons: ["October - March"],
      note: "Pleasant season for most parts of India."
    };

    res.json({
      success: true,
      ...weatherData,
      bestSeason,
      locationType: "current"
    });

  } catch (error) {
    console.error("Current location weather error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch current location weather",
      error: error.message
    });
  }
};