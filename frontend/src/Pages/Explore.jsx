import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, Sparkles, Loader, Compass, Mountain, Castle, Waves, Tent, Crown, Palette } from "lucide-react";
import DestinationCard from "../components/DestinationCard";

const tripTypes = [
  { name: "Nature", icon: Mountain, color: "from-emerald-500 to-teal-600" },
  { name: "Heritage", icon: Castle, color: "from-amber-500 to-orange-600" },
  { name: "Adventure", icon: Compass, color: "from-red-500 to-rose-600" },
  { name: "Beach", icon: Waves, color: "from-blue-500 to-cyan-600" },
  { name: "Budget", icon: Tent, color: "from-green-500 to-emerald-600" },
  { name: "Luxury", icon: Crown, color: "from-purple-500 to-pink-600" },
  { name: "Cultural", icon: Palette, color: "from-indigo-500 to-purple-600" }
];

const Explore = () => {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [allStatesData, setAllStatesData] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeType, setActiveType] = useState("");

  const navigate = useNavigate();

 
  const fetchStates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/api/places/states");
      if (!res.ok) {
        throw new Error(`Failed to fetch states: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      
      if (data.success) {
        setAllStatesData(data.states || []);
        setFilteredStates(data.states || []);
      } else {
        throw new Error(data.message || "Failed to load states");
      }
    } catch (err) {
      console.error("Failed to fetch states:", err);
      setError("Failed to load destinations. Please try again later.");
      // Fallback: try the old endpoint
      try {
        const res = await fetch("http://localhost:5000/api/places?limit=1000");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            const stateMap = new Map();
            data.places.forEach((place) => {
              if (!stateMap.has(place.State)) {
                stateMap.set(place.State, {
                  name: place.State,
                  image: place.Image || "/images/default-travel.jpg",
                  count: 1
                });
              } else {
                stateMap.get(place.State).count++;
              }
            });
            const statesArray = [...stateMap.values()];
            setAllStatesData(statesArray);
            setFilteredStates(statesArray);
          }
        }
      } catch (fallbackErr) {
        console.error("Fallback also failed:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch places for search/filter using enhanced backend
  const fetchPlaces = async (searchQuery = "", type = "") => {
    setLoading(true);
    setError(null);
    try {
      let url = "http://localhost:5000/api/places";
      const params = new URLSearchParams();
      
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      if (type) {
        params.append("category", type);
      }
      
      // Add pagination and other parameters
      params.append("limit", "20");
      params.append("sortBy", "ReviewRating");
      params.append("sortOrder", "desc");
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      
      if (data.success) {
        setPlaces(data.places || []);
      } else {
        throw new Error(data.message || "Failed to search destinations");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to search destinations. Please try again.");
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
    fetchPlaces();
  }, []);

  // Handle type filter changes
  useEffect(() => {
    fetchPlaces(query, activeType);
  }, [activeType]);

  // Live search for both states and places
  useEffect(() => {
    const timer = setTimeout(() => {
      const searchQuery = query.trim().toLowerCase();

      // Filter states
      const filtered = allStatesData.filter(state =>
        state.name.toLowerCase().includes(searchQuery)
      );
      setFilteredStates(filtered);

      // Fetch places from backend with both search query and active type
      fetchPlaces(searchQuery, activeType);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, allStatesData, activeType]);

  const handleStateClick = (stateName) => {
    navigate(`/state/${encodeURIComponent(stateName)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 px-6 py-20 md:py-28 rounded-b-3xl">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Main Heading */}
          <div className="flex flex-col items-center justify-center gap-4 mb-8">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <Compass className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">
              Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">Incredible India</span>
            </h1>
          </div>
          
          <p className="text-white/80 text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed">
            Uncover hidden gems, ancient wonders, and breathtaking landscapes across India's diverse states
          </p>

          {/* Enhanced Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg"></div>
            <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30">
              <div className="flex items-center px-4">
                <Search className="text-gray-400 flex-shrink-0" size={24} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search states, cities, or destinations..."
                  className="w-full px-4 py-5 bg-transparent border-0 text-gray-700 placeholder-gray-500 text-lg focus:outline-none focus:ring-0"
                />
                <div className="w-px h-8 bg-gray-300 mx-2"></div>
                <button
                  onClick={() => fetchPlaces(query.trim(), activeType)}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 mr-2"
                >
                  <Search size={18} />
                  <span className="font-semibold">Search</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-6xl mx-auto px-6 pt-8">
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-red-500 rounded-full animate-pulse"></div>
              </div>
              <div className="ml-3">
                <p className="font-medium">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* Trip Categories */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Find Your Perfect Trip
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose from carefully curated travel experiences tailored to your interests
            </p>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar px-2">
            <button
              onClick={() => setActiveType("")}
              className={`flex-shrink-0 relative px-8 py-4 rounded-2xl text-base font-semibold whitespace-nowrap transition-all duration-300 transform hover:scale-105 group ${
                activeType === ""
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl"
                  : "bg-white text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 shadow-lg border border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className={`w-5 h-5 ${activeType === "" ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'}`} />
                <span>All Experiences</span>
              </div>
              {activeType === "" && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping"></div>
              )}
            </button>
            
            {tripTypes.map(({ name, icon: Icon, color }) => (
              <button
                key={name}
                onClick={() => setActiveType(name)}
                className={`flex-shrink-0 relative px-8 py-4 rounded-2xl text-base font-semibold whitespace-nowrap transition-all duration-300 transform hover:scale-105 group ${
                  activeType === name
                    ? `bg-gradient-to-r ${color} text-white shadow-xl`
                    : "bg-white text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 hover:text-gray-900 shadow-lg border border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${activeType === name ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <span>{name}</span>
                </div>
                {activeType === name && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* States Grid */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <MapPin className="text-blue-600" size={24} />
                </div>
                Explore by State
              </h2>
              <p className="text-gray-600 mt-2">
                Discover unique destinations across India's diverse states
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {filteredStates.length} states found
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <Loader className="animate-spin text-blue-500 mx-auto mb-4" size={32} />
                <p className="text-gray-600">Discovering amazing destinations...</p>
              </div>
            </div>
          ) : filteredStates.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No states found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Try adjusting your search terms or browse all states to discover amazing destinations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStates.map((state) => (
                <div
                  key={state.name}
                  onClick={() => handleStateClick(state.name)}
                  className="group cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 bg-white border border-gray-200 transform hover:scale-105"
                >
                  <div className="relative overflow-hidden h-48">
                    <img
                      src={state.image}
                      alt={state.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        e.target.src = "/images/default-travel.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-sm font-bold text-gray-700 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-500" />
                        {state.count || 1}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-xl font-bold text-white drop-shadow-lg">{state.name}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Destinations Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <Sparkles className="text-amber-600" size={24} />
                </div>
                Featured Destinations
                {activeType && (
                  <span className="text-lg font-normal text-amber-600 ml-2">
                    • {activeType}
                  </span>
                )}
              </h2>
              <p className="text-gray-600 mt-2">
                Handpicked places that travelers love
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {places.length} places found
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <Loader className="animate-spin text-amber-500 mx-auto mb-4" size={32} />
                <p className="text-gray-600">Loading amazing destinations...</p>
              </div>
            </div>
          ) : places.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
              <Compass className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No destinations found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                {query || activeType 
                  ? `No results for "${query}"${activeType ? ` in ${activeType}` : ''}. Try different search terms.`
                  : "No destinations available at the moment."}
              </p>
              <button
                onClick={() => {
                  setQuery("");
                  setActiveType("");
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-300"
              >
                Show All Destinations
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {places.map((place) => (
                <Link 
                  key={place._id} 
                  to={`/state/${encodeURIComponent(place.State)}`}
                  className="group transform hover:scale-105 transition-all duration-300"
                >
                  <DestinationCard
                    name={place.Name}
                    image={place.Image || "/images/default-travel.jpg"}
                    tagline={place.Significance || place.Type || place.Category}
                    rating={place.ReviewRating || 4.0}
                    startingPrice={place.EntranceFee || 0}
                    state={place.State}
                    location={place.City || place.State}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;