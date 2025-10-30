import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader, MapPin, DollarSign, Navigation, Wallet, Star, Filter } from "lucide-react";
import DestinationCard from "../components/DestinationCard";
import { useDispatch, useSelector } from "react-redux";
import { addPlace, removePlace } from "../redux/itinerarySlice";
import axios from "axios";
import { selectIsAuthenticated } from "../redux/authSlice"; // ✅ Import auth selector
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const categories = ["All", "Nature", "Heritage", "Adventure", "Beach", "Cultural", "Modern"];

const getTimingForCategory = (category) => {
  const timings = {
    Nature: { duration: "2-3 hrs", period: "Morning" },
    Heritage: { duration: "2-4 hrs", period: "Afternoon" },
    Adventure: { duration: "3-5 hrs", period: "Full Day" },
    Beach: { duration: "2-4 hrs", period: "Evening" },
    Cultural: { duration: "2-3 hrs", period: "Anytime" },
    Modern: { duration: "3-5 hrs", period: "Evening" },
    All: { duration: "2-4 hrs", period: "Anytime" },
  };
  return timings[category] || timings.All;
};

// Haversine formula to calculate distance
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function calculateRouteDistance(places) {
  if (places.length <= 1) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < places.length; i++) {
    const prev = places[i - 1];
    const current = places[i];
    if (prev.Lat && prev.Lon && current.Lat && current.Lon) {
      totalDistance += getDistanceFromLatLonInKm(prev.Lat, prev.Lon, current.Lat, current.Lon);
    }
  }
  return totalDistance;
}

const StateDetail = () => {
  const { stateName } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedPlaces = useSelector((state) => state.itinerary.selectedPlaces);
  const isAuthenticated = useSelector(selectIsAuthenticated); // ✅ Check authentication state

  const [activeCategory, setActiveCategory] = useState("All");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stateStats, setStateStats] = useState(null);
  const [filters, setFilters] = useState({
    minRating: "",
    maxFee: "",
    sortBy: "ReviewRating",
    sortOrder: "desc"
  });

  const formattedStateName = stateName ? decodeURIComponent(stateName) : "";

  // Fetch places by state and category
  const fetchPlaces = async (category = "All") => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_URL}/places/state/${encodeURIComponent(formattedStateName)}`;
      if (category !== "All") url += `/${encodeURIComponent(category)}`;

      const params = new URLSearchParams();
      if (filters.minRating) params.append("minRating", filters.minRating);
      if (filters.maxFee) params.append("maxFee", filters.maxFee);
      params.append("sortBy", filters.sortBy);
      params.append("sortOrder", filters.sortOrder);

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch places: ${res.statusText}`);

      const data = await res.json();
      if (data.success) {
        setPlaces(data.places || []);
        setStateStats(data.stateStats || data.categoryStats || null);
      } else {
        throw new Error(data.message || "Failed to fetch places");
      }
    } catch (err) {
      console.error("Failed to fetch places:", err);
      setError(err.message);
      setPlaces([]);
      setStateStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formattedStateName) {
      fetchPlaces(activeCategory);
    }
  }, [formattedStateName, activeCategory, filters]);

  // ✅ Toggle place in itinerary or redirect to login
  const togglePlace = async (place) => {
    const id = place._id;
    if (!id) return;

    // ✅ Redirect to login if not authenticated
    if (!isAuthenticated) {
      alert("Please log in to manage your itinerary.");
      navigate("/login");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      if (selectedPlaces.find((p) => p._id === id)) {
        // Remove place
        await axios.post(
          `${API_URL}/itinerary/remove`,
          { placeId: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        dispatch(removePlace(id));
      } else {
        // Add place
        await axios.post(
          `${API_URL}/itinerary/add`,
          { placeIds: [id] },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        dispatch(addPlace({
          _id: id,
          Name: place.Name,
          EntranceFee: place.EntranceFee || 0,
          category: activeCategory,
          Lat: place.Lat,
          Lon: place.Lon,
          Image: place.Image,
          State: place.State,
          City: place.City,
          ReviewRating: place.ReviewRating
        }));
      }
    } catch (err) {
      console.error("Failed to update itinerary:", err);
      setError("Failed to update itinerary. Please try again.");
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Calculate totals
  const travelCostPerKm = 10;
  const totals = useMemo(() => {
    const totalEntranceFee = selectedPlaces.reduce((sum, p) => sum + (p.EntranceFee || 0), 0);
    const totalDistance = calculateRouteDistance(selectedPlaces);
    const totalTravelCost = totalDistance * travelCostPerKm;
    const totalBudget = totalEntranceFee + totalTravelCost;
    return { totalEntranceFee, totalDistance, totalTravelCost, totalBudget };
  }, [selectedPlaces]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Explore {formattedStateName}</h1>
            <p className="text-white/80 mt-1">
              {stateStats ? `${stateStats.totalPlaces || places.length} amazing places to discover` : "Discover amazing places and experiences"}
            </p>
          </div>
        </div>

        {/* State Stats */}
        {stateStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-white">
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span className="text-sm">Total Places</span>
              </div>
              <div className="font-bold mt-1">{stateStats.totalPlaces || places.length}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-white">
              <div className="flex items-center gap-2">
                <Star size={16} />
                <span className="text-sm">Avg Rating</span>
              </div>
              <div className="font-bold mt-1">{stateStats.avgRating || "N/A"}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-white">
              <div className="flex items-center gap-2">
                <DollarSign size={16} />
                <span className="text-sm">Avg Fee</span>
              </div>
              <div className="font-bold mt-1">₹{stateStats.avgEntranceFee || 0}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-white">
              <div className="flex items-center gap-2">
                <Wallet size={16} />
                <span className="text-sm">Free Places</span>
              </div>
              <div className="font-bold mt-1">{stateStats.freePlaces || 0}</div>
            </div>
          </div>
        )}

        {/* Itinerary Totals */}
        {selectedPlaces.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-500/20 rounded-xl p-3 text-white border border-green-400/30">
              <div className="flex items-center gap-2"><DollarSign size={16} /><span className="text-sm">Entrance Fee</span></div>
              <div className="font-bold mt-1">₹{totals.totalEntranceFee}</div>
            </div>
            <div className="bg-blue-500/20 rounded-xl p-3 text-white border border-blue-400/30">
              <div className="flex items-center gap-2"><Navigation size={16} /><span className="text-sm">Distance</span></div>
              <div className="font-bold mt-1">{totals.totalDistance.toFixed(1)} km</div>
            </div>
            <div className="bg-purple-500/20 rounded-xl p-3 text-white border border-purple-400/30">
              <div className="flex items-center gap-2"><MapPin size={16} /><span className="text-sm">Travel Cost</span></div>
              <div className="font-bold mt-1">₹{totals.totalTravelCost.toFixed(0)}</div>
            </div>
            <div className="bg-amber-500/20 rounded-xl p-3 text-white border border-amber-400/30">
              <div className="flex items-center gap-2"><Wallet size={16} /><span className="text-sm">Total Budget</span></div>
              <div className="font-bold mt-1">₹{totals.totalBudget.toFixed(0)}</div>
            </div>
          </div>
        )}

        {/* Category Buttons */}
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`relative px-6 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                activeCategory === cat ? "bg-white text-indigo-600 shadow-lg" : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <select value={filters.minRating} onChange={(e) => handleFilterChange("minRating", e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Min Rating</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
          </select>

          <select value={filters.maxFee} onChange={(e) => handleFilterChange("maxFee", e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Max Fee</option>
            <option value="100">Under ₹100</option>
            <option value="500">Under ₹500</option>
            <option value="1000">Under ₹1000</option>
          </select>

          <select value={filters.sortBy} onChange={(e) => handleFilterChange("sortBy", e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="ReviewRating">Sort by Rating</option>
            <option value="EntranceFee">Sort by Price</option>
            <option value="Name">Sort by Name</option>
          </select>

          <select value={filters.sortOrder} onChange={(e) => handleFilterChange("sortOrder", e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>
        </div>
      )}

      {/* Places */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader size={32} className="animate-spin text-indigo-500" />
            <span className="ml-3 text-gray-600">Loading places...</span>
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-400 text-5xl">📍</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No {activeCategory.toLowerCase() !== "all" ? activeCategory.toLowerCase() : ""} places found
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {activeCategory !== "All" 
                ? `We're working on adding more ${activeCategory.toLowerCase()} places for ${formattedStateName}.`
                : `No places found for ${formattedStateName}. Try adjusting your filters.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {places.map((place) => (
              <DestinationCard
                key={place._id}
                image={place.Image || "/images/default-travel.jpg"}
                name={place.Name}
                tagline={place.Significance || place.Type || place.Category}
                location={place.City || place.State}
                recommended={place.ReviewRating && place.ReviewRating > 4}
                rating={place.ReviewRating || 4.0}
                startingPrice={place.EntranceFee || 0}
                category={place.Category || activeCategory}
                timing={getTimingForCategory(place.Category || activeCategory)}
                reviewCount={place.ReviewCountLakhs ? Math.round(place.ReviewCountLakhs * 100000) : Math.floor(Math.random() * 5000)}
                isAdded={!!selectedPlaces.find((p) => p._id === place._id)}
                onAddToItinerary={() => togglePlace(place)}
                onLike={() => togglePlace(place)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StateDetail;
