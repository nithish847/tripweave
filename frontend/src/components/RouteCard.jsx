

//new-one->!
import React, { useState, useRef, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectToken } from "../redux/authSlice";
import {
  Navigation,
  Save,
  Download,
  Clock,
  Sparkles,
  MapPin,
  Route,
  Star,
  Car,
  Locate,
} from "lucide-react";
import ItineraryMap from "../components/ItineraryMap";
import html2canvas from "html2canvas";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000";
const API = axios.create({ baseURL: API_BASE_URL });

// Enhanced coordinate validation helper
const validateCoordinates = (place) => {
  if (!place) return false;
  
  // Handle different coordinate property names
  const lat = place.lat || place.Lat || place.latitude;
  const lng = place.lng || place.Lon || place.longitude || place.Lng;
  
  if (lat === undefined || lng === undefined) {
    console.error('Missing coordinates for place:', place);
    return false;
  }
  
  // Convert to numbers if they're strings
  const numLat = typeof lat === 'string' ? parseFloat(lat) : lat;
  const numLng = typeof lng === 'string' ? parseFloat(lng) : lng;
  
  if (isNaN(numLat) || isNaN(numLng)) {
    console.error('Invalid coordinate types for place:', place);
    return false;
  }
  
  if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
    console.error('Coordinate out of bounds for place:', place);
    return false;
  }
  
  return true;
};

// Get normalized coordinates
const getNormalizedCoordinates = (place) => {
  if (!validateCoordinates(place)) return null;
  
  const lat = place.lat || place.Lat || place.latitude;
  const lng = place.lng || place.Lon || place.longitude || place.Lng;
  
  return {
    lat: typeof lat === 'string' ? parseFloat(lat) : lat,
    lng: typeof lng === 'string' ? parseFloat(lng) : lng,
    name: place.name || place.Name,
    ...place
  };
};

const RouteCard = () => {
  const token = useSelector(selectToken);
  const selectedPlaces = useSelector(
    (state) => state.itinerary?.selectedPlaces || []
  );

  const destination =
    selectedPlaces.length > 0
      ? selectedPlaces[selectedPlaces.length - 1]
      : null;

  const mapContainerRef = useRef(null);
  const [savedItinerary, setSavedItinerary] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [highlightDay, setHighlightDay] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  const [sourceInput, setSourceInput] = useState("");
  const [source, setSource] = useState(null);

  // 🌍 Get current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                "User-Agent": "travel-planner/1.0",
                "Accept-Language": "en",
              },
            }
          );

          const data = await response.json();
          const locationName = data.display_name || "Current Location";

          const location = { 
            name: locationName, 
            lat: latitude, 
            lng: longitude 
          };
          
          setSource(location);
          setSourceInput(locationName);
        } catch {
          const location = { 
            name: "Current Location", 
            lat: latitude, 
            lng: longitude 
          };
          setSource(location);
          setSourceInput("Current Location");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        const defaultLocation = { 
          name: "Default Location (Delhi)", 
          lat: 28.7041, 
          lng: 77.1025 
        };
        setSource(defaultLocation);
        setSourceInput("Default Location (Delhi)");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const fetchCoordinates = async (address) => {
    if (!address.trim()) return;

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.length > 0) {
        const location = {
          name: address,
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        
        if (validateCoordinates(location)) {
          setSource(location);
        } else {
          alert("Invalid coordinates found for location.");
        }
      } else {
        alert("Location not found. Please try a more specific address.");
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error);
      alert("Failed to fetch coordinates. Please check your internet connection.");
    }
  };

  // Filter and normalize places with valid coordinates
  const validSelectedPlaces = useMemo(() => {
    return selectedPlaces
      .map(place => getNormalizedCoordinates(place))
      .filter(Boolean);
  }, [selectedPlaces]);

  // Normalize source coordinates
  const normalizedSource = useMemo(() => {
    return source ? getNormalizedCoordinates(source) : null;
  }, [source]);

  const handleSaveItinerary = async () => {
    if (!token) {
      alert("Please log in to save your itinerary.");
      return;
    }

    try {
      const placeIds = validSelectedPlaces.map((place) => place._id);
      const response = await API.post(
        "/api/itinerary/add",
        { placeIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSavedItinerary(true);
        setTimeout(() => setSavedItinerary(false), 3000);
      }
    } catch (error) {
      console.error('Error saving itinerary:', error);
      alert("Failed to save itinerary. Please try again.");
    }
  };

const handleDownloadMap = async () => {
  if (!mapContainerRef.current) return;

  setIsDownloading(true);
  try {
    const canvas = await html2canvas(mapContainerRef.current, {
      useCORS: true,
      allowTaint: false,
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (clonedDoc) => {
        // Fix unsupported oklch colors
        const allElements = clonedDoc.querySelectorAll("*");
        allElements.forEach((el) => {
          const computed = getComputedStyle(el);

          // Background color
          if (computed.backgroundColor && computed.backgroundColor.includes("oklch")) {
            el.style.backgroundColor = "#ffffff";
          }

          // Color (text)
          if (computed.color && computed.color.includes("oklch")) {
            el.style.color = "#000000";
          }

          // Border color
          if (computed.borderColor && computed.borderColor.includes("oklch")) {
            el.style.borderColor = "#cccccc";
          }
        });

        // Ensure map elements are visible
        const mapElement = clonedDoc.querySelector('.leaflet-container');
        if (mapElement) {
          mapElement.style.visibility = 'visible';
        }
      },
    });

    const link = document.createElement("a");
    link.download = `travel-itinerary-${new Date().toISOString().split("T")[0]}.png`;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading map:', error);
    alert("Failed to download map. Please try again.");
  } finally {
    setIsDownloading(false);
  }
};


  const routeData = useMemo(() => {
    if (!normalizedSource) {
      return { suggestedItinerary: [], totalStops: 0 };
    }
    
    const routeList = [normalizedSource, ...validSelectedPlaces].filter(Boolean);
    const suggestedItinerary = routeList
      .map((place, index, array) => {
        const nextPlace = array[index + 1];
        if (!nextPlace) return null;
        
        return {
          day: index + 1,
          current: place,
          next: nextPlace,
          route: `${place.name || place.Name} → ${
            nextPlace.name || nextPlace.Name
          }`,
          highlights: place.highlights || [],
          estimatedTime: place.TimeNeededHrs
            ? `${place.TimeNeededHrs}h`
            : "1-2h",
          entranceFee: place.EntranceFee || 0,
          rating: place.ReviewRating || "Not rated",
        };
      })
      .filter(Boolean);

    return { 
      suggestedItinerary, 
      totalStops: suggestedItinerary.length,
      totalDistance: routeInfo?.distance || 0,
      totalDuration: routeInfo?.duration || 0
    };
  }, [validSelectedPlaces, normalizedSource, routeInfo]);

  const handleSourceKeyDown = (e) => {
    if (e.key === "Enter") fetchCoordinates(sourceInput);
  };

  // Handle route info update from map
  const handleRouteUpdate = (info) => {
    setRouteInfo(info);
  };

  // Check if we have valid source and at least one valid destination
  const hasValidRoute = normalizedSource && destination && validateCoordinates(destination);

  if (!destination) {
    return (
      <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-10 h-10 text-purple-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Plan Your Journey
        </h3>
        <p className="text-gray-600 mb-4">
          Add places to your itinerary to start planning your route.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-4 bg-gradient-to-br from-purple-500 via-blue-500 to-teal-500 rounded-2xl shadow-lg">
          <Navigation className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Smart Route Planner</h2>
          <p className="text-gray-600 flex items-center gap-2 mt-1">
            <Route className="w-4 h-4" />
            {routeData.totalStops} stops • Optimized route
            {routeInfo && (
              <span className="text-green-600 font-medium">
                • {routeInfo.distance} km • {routeInfo.duration} min
              </span>
            )}
            {validSelectedPlaces.length !== selectedPlaces.length && (
              <span className="text-orange-500 text-xs">
                ({selectedPlaces.length - validSelectedPlaces.length} invalid locations filtered)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Source Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Car className="w-4 h-4" />
          Starting Point
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter your starting location..."
            value={sourceInput}
            onChange={(e) => setSourceInput(e.target.value)}
            onKeyDown={handleSourceKeyDown}
            onBlur={() => sourceInput && fetchCoordinates(sourceInput)}
            className="flex-1 p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
          <button
            onClick={getCurrentLocation}
            disabled={isLocating}
            className="px-4 py-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 disabled:bg-green-400 flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            <Locate className="w-4 h-4" />
            {isLocating ? "Locating..." : "Current"}
          </button>
        </div>
        {normalizedSource && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <span>Current:</span>
            <span className="font-medium">{normalizedSource.name}</span>
            <span className="text-green-500">✓</span>
          </p>
        )}
      </div>

      {/* Route Summary */}
      {routeInfo && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-4 border border-blue-200">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            Route Summary
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{routeInfo.distance} km</p>
              <p className="text-xs text-gray-600">Total Distance</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{routeInfo.duration} min</p>
              <p className="text-xs text-gray-600">Estimated Time</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{routeData.totalStops}</p>
              <p className="text-xs text-gray-600">Total Stops</p>
            </div>
          </div>
        </div>
      )}

      {/* Map Section */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Route Overview</label>
        <div
          ref={mapContainerRef}
          className="rounded-3xl overflow-hidden shadow-2xl h-96 border-2 border-gray-100 relative"
        >
          {hasValidRoute ? (
            <ItineraryMap
              source={normalizedSource}
              destination={getNormalizedCoordinates(destination)}
              itineraryPlaces={validSelectedPlaces}
              highlightDay={highlightDay}
              onRouteUpdate={handleRouteUpdate}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading map...</p>
                <p className="text-sm text-red-500 mt-2">
                  {!normalizedSource ? "Waiting for starting location..." : "Validating route data..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Itinerary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Your Journey Plan
          {validSelectedPlaces.length !== selectedPlaces.length && (
            <span className="text-xs text-orange-500 font-normal">
              ({selectedPlaces.length - validSelectedPlaces.length} invalid locations hidden)
            </span>
          )}
        </h3>
        {routeData.suggestedItinerary.length > 0 ? (
          routeData.suggestedItinerary.map((day) => (
            <div
              key={day.day}
              onClick={() => setHighlightDay(day.day)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                highlightDay === day.day
                  ? "border-purple-500 bg-purple-50 shadow-md"
                  : "border-gray-200 bg-gray-50 hover:border-purple-300"
              }`}
            >
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-500" />
                Day {day.day}: {day.route}
              </h4>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Estimated time:{" "}
                  <span className="font-medium">{day.estimatedTime}</span>
                </p>
                {day.entranceFee > 0 && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" /> Entrance fee:{" "}
                    <span className="font-medium">₹{day.entranceFee}</span>
                  </p>
                )}
                {day.rating && day.rating !== "Not rated" && (
                  <p className="text-sm text-gray-600">Rating: ⭐{day.rating}/5</p>
                )}
              </div>
              {day.highlights && day.highlights.length > 0 && (
                <div className="mt-3 p-3 bg-white rounded-lg border">
                  <p className="text-sm font-medium text-gray-700 mb-1">Highlights:</p>
                  <p className="text-sm text-gray-600">{day.highlights.join(", ")}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>
              {validSelectedPlaces.length === 0 && selectedPlaces.length > 0
                ? "No valid locations found. Please check your place coordinates."
                : "Add more places to your itinerary to see the full route plan."}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          onClick={handleSaveItinerary}
          disabled={savedItinerary || !hasValidRoute}
          className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl shadow-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center font-semibold transition-all"
        >
          <Save className="w-5 h-5 mr-2" />
          {savedItinerary ? "Itinerary Saved!" : "Save Journey"}
        </button>

        <button
          onClick={handleDownloadMap}
          disabled={isDownloading || !hasValidRoute}
          className="flex-1 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl shadow-lg hover:from-gray-700 hover:to-gray-800 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center font-semibold transition-all"
        >
          <Download className="w-5 h-5 mr-2" />
          {isDownloading ? "Preparing Download..." : "Download Map"}
        </button>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {hasValidRoute 
            ? "Your route is optimized for the shortest travel distance and best experience."
            : "Please ensure all locations have valid coordinates to view the route."
          }
        </p>
      </div>
    </div>
  );
};

export default RouteCard;