import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { MapPin, Calendar, Camera, Heart, Edit3, Trash2, Loader, Mail, Globe, User, LogOut, Phone } from "lucide-react";
import { updateUser, logout } from "../redux/authSlice";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

// Add request interceptor for authentication
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const Profile = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);

  const [unauthenticated, setUnauthenticated] = useState(false);
  const [itinerary, setItinerary] = useState({ places: [], totalPlaces: 0, totalBudget: 0 });
  const [budget, setBudget] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ 
    name: "", 
    username: "", 
    email: "", 
    bio: "", 
    location: "", 
    about: "",
    country: "",
    phone: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [loadingItinerary, setLoadingItinerary] = useState(true);
  const [loadingBudget, setLoadingBudget] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const selectedPlaces = useSelector((state) => state.itinerary.selectedPlaces || []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clear messages after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Sync Redux user with local state
  useEffect(() => {
    if (user && !editing) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        bio: user.bio || "",
        location: user.location || "",
        about: user.about || "",
        country: user.country || "",
        phone: user.phone || ""
      });
      setPreviewImage(user.avatarUrl || "");
    }
  }, [user, editing]);

  // Fetch itinerary data
  const fetchItinerary = useCallback(async () => {
    if (!token) {
      setUnauthenticated(true);
      return;
    }

    setLoadingItinerary(true);
    setError("");
    try {
      const res = await API.get("/itinerary");
      if (res.data.success) {
        if (Array.isArray(res.data.itinerary)) {
          setItinerary({ places: res.data.itinerary, totalPlaces: res.data.itinerary.length });
        } else {
          setItinerary(res.data.itinerary);
        }
      }
    } catch (err) {
      console.error("Failed to fetch itinerary:", err);
      if (err.response?.status === 401) {
        setUnauthenticated(true);
        dispatch(logout());
      } else if (err.response?.status === 404) {
        setItinerary({ places: [], totalPlaces: 0 });
      } else {
        setError("Failed to load itinerary");
      }
    } finally {
      setLoadingItinerary(false);
    }
  }, [token, dispatch]);

  // Fetch budget data
  const fetchBudget = useCallback(async () => {
    if (!token) return;

    setLoadingBudget(true);
    try {
      const res = await API.get("/itinerary/budget");
      if (res.data.success) {
        setBudget(res.data.budget);
      }
    } catch (err) {
      console.error("Failed to fetch budget:", err);
      if (err.response?.status === 401) {
        setUnauthenticated(true);
        dispatch(logout());
      } else if (err.response?.status === 404) {
        setBudget(null);
      }
    } finally {
      setLoadingBudget(false);
    }
  }, [token, dispatch]);

  // Initial data loading
  useEffect(() => {
    if (!token) {
      setUnauthenticated(true);
      return;
    }

    fetchItinerary();
    fetchBudget();
  }, [token, fetchItinerary, fetchBudget]);

  // ---------- Handlers ----------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPEG, PNG, WebP, etc.)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
      setError("");
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.username.trim()) {
      setError("Username is required");
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (!token) {
      setError("You must be logged in to update profile");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const data = new FormData();
    data.append("name", formData.name.trim());
    data.append("username", formData.username.trim());
    data.append("email", formData.email.trim());
    if (formData.bio !== undefined) data.append("bio", formData.bio.trim());
    if (formData.location !== undefined) data.append("location", formData.location.trim());
    if (formData.about !== undefined) data.append("about", formData.about.trim());
    if (formData.country !== undefined) data.append("country", formData.country.trim());
    if (formData.phone !== undefined) data.append("phone", formData.phone.trim());
    if (imageFile) data.append("avatar", imageFile);

    try {
      const res = await API.put("/users/profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        dispatch(updateUser(res.data.user));
        setSuccess("Profile updated successfully!");
        setEditing(false);
        setImageFile(null);
      }
    } catch (err) {
      console.error("Profile update failed:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
        dispatch(logout());
      } else if (err.response?.status === 409 || err.response?.status === 400) {
        setError(err.response.data.message);
      } else {
        setError(err.response?.data?.message || "Failed to update profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setImageFile(null);
    setPreviewImage(user?.avatarUrl || "");
    setFormData({
      name: user?.name || "",
      username: user?.username || "",
      email: user?.email || "",
      bio: user?.bio || "",
      location: user?.location || "",
      about: user?.about || "",
      country: user?.country || "",
      phone: user?.phone || ""
    });
    setError("");
  };

  const handleDeletePlace = async (placeId) => {
    if (!token || !placeId) return;
    
    if (!window.confirm("Are you sure you want to remove this place from your itinerary?")) {
      return;
    }

    try {
      const res = await API.delete(`/itinerary/${placeId}`);
      if (res.data.success) {
        setSuccess("Place removed from itinerary");
        await fetchItinerary();
        await fetchBudget();
      }
    } catch (err) {
      console.error("Failed to delete place:", err);
      setError("Failed to remove place from itinerary");
    }
  };

  const handleClearItinerary = async () => {
    if (!token) return;
    
    if (!window.confirm("Are you sure you want to clear your entire itinerary? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await API.delete("/itinerary/clear");
      if (res.data.success) {
        setItinerary({ places: [], totalPlaces: 0, totalBudget: 0 });
        setBudget(null);
        setSuccess("Itinerary cleared successfully!");
      }
    } catch (err) {
      console.error("Failed to clear itinerary:", err);
      setError("Failed to clear itinerary");
    }
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.")) {
      return;
    }

    if (!window.confirm("This will permanently delete all your data including trips, posts, preferences, and account information. This cannot be recovered. Continue?")) {
      return;
    }

    try {
      const res = await API.delete("/users/account");
      if (res.data.success) {
        setSuccess("Account deleted successfully");
        dispatch(logout());
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to delete account:", err);
      setError(err.response?.data?.message || "Failed to delete account");
    }
  };

  const handleLogout = async () => {
    try {
      await API.post("/users/logout");
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      dispatch(logout());
      localStorage.removeItem('token');
      window.location.href = "/";
    }
  };

  const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp";
  const travelPreferences = user?.preferences || { 
    budget: "Mid-range", 
    style: "Cultural", 
    groupSize: "2-4 people", 
    accommodation: "Hotels" 
  };

  if (unauthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4">
        <div className="text-center p-6 bg-white rounded-3xl shadow-xl border border-white/20 w-full max-w-md">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Logged In</h2>
          <p className="text-gray-600 mb-6">Please log in to view your profile</p>
          <button 
            onClick={() => window.location.href = "/login"}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-3 sm:px-4 py-4">
      <div className="max-w-6xl mx-auto">
        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 sm:p-4 bg-green-100 border border-green-400 text-green-700 rounded-2xl flex justify-between items-center">
            <span className="text-sm sm:text-base">{success}</span>
            <button onClick={() => setSuccess("")} className="text-green-700 hover:text-green-900 text-lg">
              ×
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded-2xl flex justify-between items-center">
            <span className="text-sm sm:text-base">{error}</span>
            <button onClick={() => setError("")} className="text-red-700 hover:text-red-900 text-lg">
              ×
            </button>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            {/* Profile Image */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32">
              <img 
                src={previewImage || user?.avatarUrl || defaultAvatar} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover shadow-2xl border-4 border-white" 
                onError={(e) => {
                  e.target.src = defaultAvatar;
                }}
              />
              {editing && (
                <label className="absolute bottom-0 right-0 p-1 sm:p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 cursor-pointer transition-colors">
                  <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="hidden" 
                  />
                </label>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 w-full text-center">
              <div className="flex items-center gap-2 sm:gap-3 justify-center mb-2">
                {editing ? (
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="Enter your name" 
                    className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent w-full max-w-md text-center sm:text-left" 
                    required
                  />
                ) : (
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{user?.name || "Traveler"}</h1>
                )}
                <div className="flex gap-1 sm:gap-2">
                  {!editing && (
                    <button 
                      onClick={() => setEditing(true)} 
                      className="p-1 sm:p-2 text-gray-600 hover:text-blue-500 transition-colors"
                      title="Edit Profile"
                    >
                      <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="p-1 sm:p-2 text-gray-600 hover:text-red-500 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {editing ? (
                <div className="space-y-3 sm:space-y-4 mt-4 sm:mt-6 max-w-2xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                      <input 
                        type="text" 
                        name="username" 
                        value={formData.username} 
                        onChange={handleInputChange} 
                        placeholder="Username" 
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm sm:text-base" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                        placeholder="Email" 
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm sm:text-base" 
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      placeholder="Phone number" 
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm sm:text-base" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <input 
                      type="text" 
                      name="bio" 
                      value={formData.bio} 
                      onChange={handleInputChange} 
                      placeholder="Your short bio..." 
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm sm:text-base" 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input 
                        type="text" 
                        name="location" 
                        value={formData.location} 
                        onChange={handleInputChange} 
                        placeholder="Your location..." 
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm sm:text-base" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input 
                        type="text" 
                        name="country" 
                        value={formData.country} 
                        onChange={handleInputChange} 
                        placeholder="Your country..." 
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm sm:text-base" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
                    <textarea 
                      name="about" 
                      value={formData.about} 
                      onChange={handleInputChange} 
                      placeholder="Tell us about yourself..." 
                      rows="3"
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-sm sm:text-base" 
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                    <button 
                      onClick={handleSaveProfile} 
                      disabled={loading}
                      className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      {loading && <Loader className="w-4 h-4 animate-spin" />}
                      Save Changes
                    </button>
                    <button 
                      onClick={handleCancelEdit} 
                      disabled={loading}
                      className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-500 text-white rounded-2xl hover:bg-gray-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mb-3 flex-wrap justify-center">
                    <div className="flex items-center gap-1 sm:gap-2 text-gray-600 text-sm sm:text-base">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="truncate max-w-[200px] sm:max-w-none">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 text-gray-600 text-sm sm:text-base">
                      <span className="text-gray-400 hidden sm:inline">•</span>
                      <span>@{user?.username}</span>
                    </div>
                    {user?.phone && (
                      <div className="flex items-center gap-1 sm:gap-2 text-gray-600 text-sm sm:text-base">
                        <span className="text-gray-400 hidden sm:inline">•</span>
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user?.country && (
                      <div className="flex items-center gap-1 sm:gap-2 text-gray-600 text-sm sm:text-base">
                        <span className="text-gray-400 hidden sm:inline">•</span>
                        <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{user.country}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-600 text-base sm:text-lg mb-3 text-center sm:text-left">
                    {user?.bio || "Passionate traveler & photographer"}
                  </p>
                  
                  {user?.location && (
                    <div className="flex items-center gap-1 sm:gap-2 text-gray-500 mb-3 sm:mb-4 justify-center sm:justify-start">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-sm sm:text-base">{user.location}</span>
                    </div>
                  )}
                  
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base text-center sm:text-left max-w-2xl mx-auto">
                    {user?.about || "Love exploring new cultures and creating unforgettable memories around the world."}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4 mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500">
                    {user?.createdAt && (
                      <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
                    )}
                    {user?.lastLoginAt && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span>Last login: {new Date(user.lastLoginAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Delete Account Button */}
          {!editing && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                Want to permanently delete your account and all data?
              </div>
              <button 
                onClick={handleDeleteAccount}
                className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors text-xs sm:text-sm flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                Delete Account
              </button>
            </div>
          )}
        </div>

        {/* Trips & Sidebar */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Recent Trips */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">My Travel Itinerary</h2>
                {itinerary.places.length > 0 && (
                  <button 
                    onClick={handleClearItinerary}
                    className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors text-xs sm:text-sm flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    Clear All
                  </button>
                )}
              </div>
              
              {loadingItinerary ? (
                <div className="flex justify-center items-center py-6 sm:py-8">
                  <Loader className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-600 text-sm sm:text-base">Loading trips...</span>
                </div>
              ) : itinerary.places.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-2 text-sm sm:text-base">No trips planned yet.</p>
                  <p className="text-xs sm:text-sm text-gray-400">Start exploring and add places to your itinerary!</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {itinerary.places.map((place) => (
                    <div key={place._id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl hover:shadow-md transition-all duration-200 relative group">
                      <img 
                        src={place.Image} 
                        alt={place.Name} 
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shadow-lg flex-shrink-0"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/80?text=No+Image";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base truncate">{place.Name}</h3>
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{place.Category || "Custom Trip"}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Entrance Fee: ₹{place.EntranceFee || 0}
                          {place.TimeNeededHrs && ` • ${place.TimeNeededHrs} hrs`}
                          {place.ReviewRating && ` • ⭐${place.ReviewRating}`}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeletePlace(place._id)} 
                        className="p-1 sm:p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-colors opacity-70 group-hover:opacity-100 flex-shrink-0 mt-1" 
                        title="Remove from itinerary"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Saved Destinations */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                <h2 className="text-lg font-bold text-gray-900">Saved Destinations</h2>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {selectedPlaces.length === 0 ? (
                  <div className="text-center py-3 sm:py-4">
                    <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 mx-auto mb-1 sm:mb-2" />
                    <p className="text-gray-500 text-xs sm:text-sm">No saved destinations yet.</p>
                  </div>
                ) : (
                  selectedPlaces.slice(0, isMobile ? 3 : 5).map((destination) => (
                    <div key={destination._id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                      <span className="font-medium text-gray-800 text-xs sm:text-sm truncate max-w-[70%]">{destination.Name}</span>
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Travel Preferences + Budget */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 sm:mb-5">
                Travel Preferences
              </h2>

              {/* Preferences List */}
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                {[
                  { label: "Budget Style", value: travelPreferences.budget, color: "text-blue-600" },
                  { label: "Travel Style", value: travelPreferences.style, color: "text-green-600" },
                  { label: "Group Size", value: travelPreferences.groupSize, color: "text-purple-600" },
                  { label: "Accommodation", value: travelPreferences.accommodation, color: "text-orange-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-600">{label}</span>
                    <span className={`font-semibold ${color}`}>
                      {value || "—"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Budget Section */}
              {loadingBudget ? (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-center">
                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-purple-500 mr-2" />
                    <span className="text-xs sm:text-sm text-gray-600">Loading budget...</span>
                  </div>
                </div>
              ) : budget ? (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg border border-purple-100">
                  <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Estimated Budget</h3>

                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                    {[
                      { label: "Entrance Fees", value: budget.totalEntranceFee || budget.breakdown?.entranceFees || 0 },
                      { label: "Travel", value: budget.estimatedTravelCost || budget.breakdown?.travel || 0 },
                      { label: "Accommodation", value: budget.estimatedAccommodation || budget.breakdown?.accommodation || 0 },
                      { label: "Food", value: budget.estimatedFood || budget.breakdown?.food || 0 },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-gray-600">{label}:</span>
                        <span className="font-semibold">₹{value}</span>
                      </div>
                    ))}

                    <div className="border-t border-purple-200 pt-1 sm:pt-2 mt-1 sm:mt-2">
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-800">Total:</span>
                        <span className="text-purple-600">₹{budget.totalBudget || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs sm:text-sm text-gray-500">No budget calculated yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;