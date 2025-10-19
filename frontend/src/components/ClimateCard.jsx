//new one->!
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Cloud,
  Loader2,
  MapPin,
  Search,
  Navigation,
  Calendar,
  Sun,
  Wind,
  Shield,
  AlertTriangle,
  Umbrella,
  Droplets,
  Thermometer,
  Heart,
  Car,
  Backpack,
  Locate,
  Star,
  Compass
} from "lucide-react";

// Gradient map for weather conditions
const getConditionGradient = (condition) => {
  const map = {
    Clear: "from-yellow-400 to-orange-500",
    Clouds: "from-gray-400 to-slate-500",
    Rain: "from-blue-500 to-indigo-600",
    Snow: "from-blue-300 to-white",
    Thunderstorm: "from-purple-600 to-gray-700",
    Drizzle: "from-blue-400 to-cyan-500",
    Mist: "from-gray-300 to-gray-400",
    Fog: "from-gray-400 to-gray-500",
    Dust: "from-yellow-300 to-orange-400"
  };
  return map[condition] || "from-blue-400 to-gray-500";
};

// Safety Recommendations Component
const SafetyRecommendations = ({ weather }) => {
  const generateSafetyTips = () => {
    const tips = [];

    if (weather.current.temperature > 35) {
      tips.push({ icon: Sun, title: 'Extreme Heat Warning', message: 'Avoid outdoor activities 11 AM - 4 PM. Stay hydrated.', priority: 'high', color: 'from-red-500 to-orange-600' });
    } else if (weather.current.temperature > 30) {
      tips.push({ icon: Thermometer, title: 'Hot Weather Advisory', message: 'Carry water, use sunscreen, and take breaks in shade.', priority: 'medium', color: 'from-orange-500 to-yellow-500' });
    } else if (weather.current.temperature < 10) {
      tips.push({ icon: Thermometer, title: 'Cold Weather Alert', message: 'Layer clothing, wear warm accessories, and stay dry.', priority: 'high', color: 'from-blue-500 to-indigo-600' });
    }

    if (weather.current.humidity > 80) {
      tips.push({ icon: Droplets, title: 'High Humidity Alert', message: 'Wear breathable fabrics and stay in air-conditioned areas.', priority: 'medium', color: 'from-blue-400 to-cyan-500' });
    }

    if (weather.current.windSpeed > 10) {
      tips.push({ icon: Wind, title: 'Strong Wind Advisory', message: 'Secure loose items and drive carefully.', priority: 'medium', color: 'from-green-500 to-teal-600' });
    }

    if (weather.current.condition === 'Rain' || weather.current.description.includes('rain')) {
      tips.push({ icon: Umbrella, title: 'Rain Safety', message: 'Carry waterproof gear and avoid flood-prone areas.', priority: 'high', color: 'from-slate-500 to-gray-600' });
    }

    if (weather.current.visibility < 5) {
      tips.push({ icon: AlertTriangle, title: 'Low Visibility Warning', message: 'Reduce speed, use headlights, and maintain safe distance.', priority: 'high', color: 'from-yellow-600 to-orange-600' });
    }

    tips.push({ icon: Backpack, title: 'Travel Essentials', message: 'Pack emergency kit, first aid, water, and appropriate clothing.', priority: 'medium', color: 'from-purple-500 to-indigo-600' });
    tips.push({ icon: Car, title: 'Transportation Safety', message: 'Check vehicle condition, plan route, and inform someone.', priority: 'medium', color: 'from-indigo-500 to-purple-600' });

    return tips;
  };

  const healthTips = [
    { icon: Heart, title: 'Health Precautions', tips: ['Stay hydrated', 'Avoid prolonged sun exposure', 'Take breaks', 'Carry basic medications'] }
  ];

  const safetyTips = generateSafetyTips();

  return (
    <div className="space-y-6">
      {/* Safety Alerts */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Safety Recommendations</h2>
            <p className="text-gray-600">Essential tips for your safety and comfort</p>
          </div>
        </div>

        <div className="space-y-4">
          {safetyTips.map((tip, i) => {
            const Icon = tip.icon;
            return (
              <div key={i} className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-102">
                <div className={`bg-gradient-to-r ${tip.color} p-5 text-white`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-xl p-3">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold">{tip.title}</h3>
                        {tip.priority === 'high' && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">URGENT</span>
                        )}
                      </div>
                      <p className="text-white/90 leading-relaxed">{tip.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Health Tips */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Health & Wellness</h2>
            <p className="text-gray-600">Stay healthy during your trip</p>
          </div>
        </div>

        {healthTips.map((category, i) => (
          <div key={i} className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-100">
            <h3 className="text-lg font-semibold text-pink-800 mb-4 flex items-center gap-2">
              <category.icon className="w-5 h-5" /> {category.title}
            </h3>
            <ul className="space-y-2">
              {category.tips.map((tip, idx) => (
                <li key={idx} className="flex items-center gap-3 text-pink-700">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div> {tip}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

// Location Permission Component
const LocationPermission = ({ onLocationGranted, onClose }) => {
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleGetLocation = async () => {
    setGettingLocation(true);
    try {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      onLocationGranted(latitude, longitude);
      
    } catch (error) {
      console.error("Error getting location:", error);
      alert("Unable to get your location. Please allow location access or search manually.");
    } finally {
      setGettingLocation(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-full">
            <Compass className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Use Your Current Location</h3>
        </div>
        
        <p className="text-gray-600 mb-6">
          Get accurate weather information for your exact location. We'll use this only to show you relevant weather data.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleGetLocation}
            disabled={gettingLocation}
            className="flex-1 bg-blue-500 text-white py-3 rounded-2xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {gettingLocation ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Locate className="w-5 h-5" />
            )}
            {gettingLocation ? "Getting Location..." : "Use My Location"}
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-500 text-white rounded-2xl hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Main ClimateCard Component
const ClimateCard = () => {
  const [query, setQuery] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('weatherSearchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save to search history
  const saveToHistory = (location) => {
    const newHistory = [location, ...searchHistory.filter(item => item !== location)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('weatherSearchHistory', JSON.stringify(newHistory));
  };

  const popularDestinations = [
    "Mumbai, Maharashtra",
    "Delhi, India",
    "Bangalore, Karnataka",
    "Chennai, Tamil Nadu",
    "Kolkata, West Bengal",
    "Hyderabad, Telangana",
    "Goa, India",
    "Jaipur, Rajasthan",
    "Kochi, Kerala",
    "Shimla, Himachal Pradesh"
  ];

  const fetchWeather = async (params) => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/weather", { params });
      
      if (res.data.success) {
        setWeatherData(res.data);
        // Save to search history if it's a place search
        if (params.place) {
          saveToHistory(params.place);
        }
      } else {
        alert(res.data.message || "Failed to fetch weather");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fetch weather. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => { 
    e.preventDefault(); 
    if (query.trim()) {
      fetchWeather({ place: query.trim() });
      setFocused(false);
    }
  };

  const handleSuggestionClick = (dest) => { 
    setQuery(dest); 
    fetchWeather({ place: dest }); 
    setFocused(false); 
  };

  const handleCurrentLocation = (lat, lon) => {
    setShowLocationPermission(false);
    fetchWeather({ lat, lon });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return { 
      day: date.toLocaleDateString("en-US", { weekday: "short" }), 
      date: date.getDate(), 
      month: date.toLocaleDateString("en-US", { month: "short" }) 
    };
  };

  const getLocationAccuracy = (weather) => {
    if (weather.locationType === 'current') {
      return { text: "Your Exact Location", color: "text-green-600", icon: Locate };
    } else if (weather.exactLocation) {
      return { text: "Exact Location Match", color: "text-blue-600", icon: MapPin };
    } else {
      return { text: "Approximate Location", color: "text-orange-600", icon: Navigation };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-10 px-4">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8 flex items-center justify-center gap-3">
        <Cloud className="w-10 h-10 text-blue-400 animate-bounce" /> Climate Explorer
      </h1>

      {/* Search Bar */}
      <div className="relative w-full max-w-2xl mx-auto mb-10">
        <form onSubmit={handleSearch}>
          <div className={`relative bg-white/80 backdrop-blur-xl rounded-full shadow-2xl border transition-all duration-300 ${focused ? 'border-blue-300 shadow-blue-200/50' : 'border-white/30 hover:border-blue-200'}`}>
            <div className="flex items-center gap-4 p-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full">
                <Search className="w-6 h-6 text-white" />
              </div>
              
              <input 
                type="text" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)} 
                placeholder="Enter city, state, or landmark..." 
                className="flex-1 text-lg font-medium text-gray-700 bg-transparent outline-none placeholder-gray-400"
              />
              
              {/* Current Location Button */}
              <button 
                type="button"
                onClick={() => setShowLocationPermission(true)}
                className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full hover:from-green-600 hover:to-emerald-700 transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                title="Use current location"
              >
                <Locate className="w-5 h-5" />
              </button>

              <button 
                type="submit" 
                disabled={loading || !query.trim()} 
                className={`px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-full transition-all duration-200 flex items-center gap-2 ${loading || !query.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg transform hover:scale-105'}`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
        </form>

        {focused && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 overflow-hidden animate-in slide-in-from-top-2 duration-200">
            {/* Search History */}
            {searchHistory.length > 0 && (
              <>
                <div className="p-4 border-b border-gray-100 flex items-center gap-2 text-sm font-semibold text-gray-600">
                  <Star className="w-4 h-4 text-yellow-500" /> Recent Searches
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {searchHistory.map((dest, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleSuggestionClick(dest)} 
                      className="w-full text-left p-4 hover:bg-blue-50 transition-colors duration-150 flex items-center gap-3 group"
                    >
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Star className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="text-gray-700 font-medium">{dest}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Popular Destinations */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-2 text-sm font-semibold text-gray-600">
              <MapPin className="w-4 h-4" /> Popular Destinations
            </div>
            <div className="max-h-60 overflow-y-auto">
              {popularDestinations.map((dest, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSuggestionClick(dest)} 
                  className="w-full text-left p-4 hover:bg-blue-50 transition-colors duration-150 flex items-center gap-3 group"
                >
                  <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <MapPin className="w-4 h-4 text-gray-500 group-hover:text-blue-500" />
                  </div>
                  <span className="text-gray-700 font-medium">{dest}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center items-center mt-6 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2"/>
          Loading weather data...
        </div>
      )}

      {weatherData && !loading && (
        <div className="space-y-10 max-w-6xl mx-auto">
          {/* Location Accuracy Indicator */}
          {weatherData.locationType && (
            <div className="flex justify-center">
              <div className="bg-white/80 backdrop-blur-xl rounded-full px-6 py-3 shadow-lg border border-white/30 flex items-center gap-2">
                {(() => {
                  const accuracy = getLocationAccuracy(weatherData);
                  const Icon = accuracy.icon;
                  return (
                    <>
                      <Icon className={`w-4 h-4 ${accuracy.color}`} />
                      <span className={`text-sm font-medium ${accuracy.color}`}>
                        {accuracy.text}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Current Weather */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800">
                    {weatherData.current.place}
                    {weatherData.current.state && `, ${weatherData.current.state}`}
                  </h2>
                  {weatherData.exactLocation && (
                    <div className="flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      <MapPin className="w-3 h-3" />
                      <span>Exact Match</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-600 capitalize text-lg mb-4">{weatherData.current.description}</p>
                <p className="text-5xl md:text-6xl font-extrabold text-gray-800 mb-4">
                  {Math.round(weatherData.current.temperature)}°C
                </p>
                
                {/* Weather Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <Sun className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                    <div className="text-sm text-gray-600">Feels Like</div>
                    <div className="font-semibold text-gray-800">{Math.round(weatherData.current.feelsLike)}°</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-xl">
                    <Wind className="w-6 h-6 text-green-500 mx-auto mb-1" />
                    <div className="text-sm text-gray-600">Wind</div>
                    <div className="font-semibold text-gray-800">{weatherData.current.windSpeed} m/s</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-xl">
                    <Droplets className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                    <div className="text-sm text-gray-600">Humidity</div>
                    <div className="font-semibold text-gray-800">{weatherData.current.humidity}%</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-xl">
                    <Thermometer className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                    <div className="text-sm text-gray-600">Visibility</div>
                    <div className="font-semibold text-gray-800">{weatherData.current.visibility} km</div>
                  </div>
                </div>
              </div>
              
              {/* Weather Icon */}
              <div className="text-center">
                <img 
                  src={`https://openweathermap.org/img/wn/${weatherData.current.icon}@4x.png`} 
                  alt={weatherData.current.description}
                  className="w-32 h-32"
                />
                <div className="text-gray-600 mt-2">
                  H: {Math.round(weatherData.current.maxTemp)}° • L: {Math.round(weatherData.current.minTemp)}°
                </div>
              </div>
            </div>
          </div>

          {/* Forecast */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <Calendar className="w-6 h-6 text-white"/>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">5-Day Forecast</h2>
                <p className="text-gray-600">Weather outlook for your trip</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {weatherData.forecast.map((day, i) => {
                const dateInfo = formatDate(day.date);
                const gradient = getConditionGradient(day.condition);
                return (
                  <div key={i} className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden hover:shadow-2xl hover:scale-105 transform transition-all duration-300`}>
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10 text-center">
                      <div className="text-sm font-semibold opacity-90">{dateInfo.day}</div>
                      <div className="text-2xl font-bold">{dateInfo.date}</div>
                      <div className="text-xs opacity-80">{dateInfo.month}</div>
                      <img 
                        src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`} 
                        alt={day.description}
                        className="w-12 h-12 mx-auto my-2"
                      />
                      <div className="text-3xl font-bold my-2">{Math.round(day.temperature)}°</div>
                      <div className="text-xs opacity-90 capitalize mb-3">{day.description}</div>
                      <div className="space-y-2">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-xs flex justify-between">
                          <span>Humidity</span>
                          <span className="font-semibold">{day.humidity}%</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-xs flex justify-between">
                          <span>Wind</span>
                          <span className="font-semibold">{day.windSpeed} m/s</span>
                        </div>
                      </div>
                      {i === 0 && (
                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                          Today
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Best Season */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Best Season(s) to Visit</h3>
            <p className="text-gray-600 mb-2">
              <strong>Recommended months:</strong> {weatherData.bestSeason.seasons.join(", ")}
            </p>
            <p className="text-gray-500">{weatherData.bestSeason.note}</p>
          </div>

          {/* Safety & Health */}
          <SafetyRecommendations weather={weatherData} />

          {/* Coordinates Info */}
          {weatherData.current.latitude && weatherData.current.longitude && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Location Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Latitude:</strong> {weatherData.current.latitude.toFixed(4)}
                </div>
                <div>
                  <strong>Longitude:</strong> {weatherData.current.longitude.toFixed(4)}
                </div>
                {weatherData.current.country && (
                  <div>
                    <strong>Country:</strong> {weatherData.current.country}
                  </div>
                )}
                <div>
                  <strong>Location Type:</strong> {weatherData.locationType || 'place'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Location Permission Modal */}
      {showLocationPermission && (
        <LocationPermission 
          onLocationGranted={handleCurrentLocation}
          onClose={() => setShowLocationPermission(false)}
        />
      )}
    </div>
  );
};

export default ClimateCard;