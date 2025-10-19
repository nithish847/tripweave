


//newone->1

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  Users, 
  TrendingUp, 
  Plus, 
  Star, 
  Camera, 
  Calendar, 
  MapPin, 
  Search,
  Filter,
  Award,
  BarChart3,
  ThumbsUp,
  MessageCircle
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import PostCard from "./PostCard";
import CreatePost from "./CreatePost";
import { setPosts, addPost, updatePost, deletePost } from "../redux/communitySlice";
import { toast } from "react-hot-toast";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

// Add request interceptor for authentication
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || useSelector((state) => state.auth.token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const Community = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const currentUser = useSelector((state) => state.auth.user);
  const posts = useSelector((state) => state.community.posts);

  const postRefs = useRef({});
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({});
  const [activeTab, setActiveTab] = useState("community");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    location: "",
    country: "",
    sortBy: "createdAt",
    order: "desc"
  });
  const [globalStats, setGlobalStats] = useState({});

  // Improved formatTimeAgo function
  const formatTimeAgo = useCallback((dateString) => {
    if (!dateString) return "Recently";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Recently";
      
      const diff = (Date.now() - date.getTime()) / 1000;
      
      if (diff < 60) return "Just now";
      if (diff < 120) return "1 minute ago";
      if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
      if (diff < 7200) return "1 hour ago";
      if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
      if (diff < 172800) return "1 day ago";
      
      const days = Math.floor(diff / 86400);
      if (days < 7) return `${days} days ago`;
      if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
      if (days < 365) return `${Math.floor(days / 30)} months ago`;
      return `${Math.floor(days / 365)} years ago`;
    } catch (error) {
      return "Recently";
    }
  }, []);

  // Calculate trending score with improved algorithm
  const calculateTrendingScore = useCallback((post) => {
    const likeScore = (post.likes?.length || 0) * 2;
    const commentScore = (post.comments?.length || 0) * 3;
    
    // Calculate average rating
    const ratings = post.ratings || [];
    const ratingSum = ratings.reduce((sum, r) => sum + (r.value || 0), 0);
    const avgRating = ratings.length > 0 ? ratingSum / ratings.length : 0;
    const ratingScore = avgRating * 10;
    
    // Time decay factor (newer posts get boost)
    const postDate = new Date(post.createdAt || Date.now());
    const timeDiff = Date.now() - postDate.getTime();
    const hoursSincePost = timeDiff / (1000 * 60 * 60);
    const timeDecay = Math.max(0, 1 - (hoursSincePost / 168)); // Decay over 1 week
    
    const score = (likeScore + commentScore + ratingScore) * (1 + timeDecay * 0.5);
    
    return parseFloat(score.toFixed(2));
  }, []);

  // Calculate user statistics from posts
  const calculateUserStats = useCallback((posts) => {
    const statsByUser = {};
    
    posts.forEach(post => {
      const userId = post.author?._id;
      if (!userId) return;
      
      if (!statsByUser[userId]) {
        statsByUser[userId] = {
          user: post.author,
          posts: 0,
          likes: 0,
          comments: 0,
          totalRatingSum: 0,
          totalRatingCount: 0,
          countries: new Set(),
          photos: 0,
          totalEngagement: 0
        };
      }
      
      const userStat = statsByUser[userId];
      userStat.posts += 1;
      userStat.likes += post.likes?.length || 0;
      userStat.comments += post.comments?.length || 0;
      userStat.totalEngagement += (post.likes?.length || 0) + (post.comments?.length || 0);
      
      // Calculate ratings
      if (post.ratings?.length > 0) {
        post.ratings.forEach(rating => {
          userStat.totalRatingSum += rating.value || 0;
          userStat.totalRatingCount += 1;
        });
      }
      
      if (post.country) {
        userStat.countries.add(post.country);
      }
      
      if (post.imageUrl) {
        userStat.photos += 1;
      }
    });
    
    // Calculate averages and final stats
    Object.keys(statsByUser).forEach(userId => {
      const stat = statsByUser[userId];
      stat.avgRating = stat.totalRatingCount > 0 
        ? parseFloat((stat.totalRatingSum / stat.totalRatingCount).toFixed(1))
        : 0;
      stat.countriesCount = stat.countries.size;
      stat.engagementRate = stat.posts > 0 
        ? parseFloat((stat.totalEngagement / stat.posts).toFixed(1))
        : 0;
    });
    
    setUserStats(statsByUser);
  }, []);

  // Fetch posts with filters
  const fetchPosts = useCallback(async (searchParams = {}) => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const params = {
        page: 1,
        limit: 50,
        ...searchParams
      };

      const res = await API.get("/posts", { params });
      
      if (res.data.success) {
        const postsWithScore = res.data.posts.map((post) => {
          const likesArray = Array.isArray(post.likes) ? post.likes : [];
          const commentsArray = Array.isArray(post.comments) ? post.comments : [];
          const ratingsArray = Array.isArray(post.ratings) ? post.ratings : [];

          return {
            ...post,
            timeAgo: formatTimeAgo(post.createdAt),
            isOwner: post.author?._id === currentUser?._id,
            likes: likesArray,
            comments: commentsArray,
            ratings: ratingsArray,
            trendingScore: calculateTrendingScore({
              ...post,
              likes: likesArray,
              comments: commentsArray,
              ratings: ratingsArray,
            }),
          };
        });
        
        dispatch(setPosts(postsWithScore));
        calculateUserStats(postsWithScore);
      }
    } catch (err) {
      console.error("Fetch posts error:", err.response?.data || err.message);
      toast.error("Failed to fetch posts.");
    } finally {
      setLoading(false);
    }
  }, [token, currentUser, dispatch, formatTimeAgo, calculateTrendingScore, calculateUserStats]);

  // Fetch global stats
  const fetchGlobalStats = useCallback(async () => {
    if (!token) return;
    
    try {
      const res = await API.get("/posts/stats/global");
      if (res.data.success) {
        setGlobalStats(res.data.stats);
      }
    } catch (err) {
      console.error("Fetch global stats error:", err);
    }
  }, [token]);

  // Search posts
  const handleSearch = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const params = {
        q: searchQuery,
        ...filters
      };

      const res = await API.get("/posts/search", { params });
      
      if (res.data.success) {
        const postsWithScore = res.data.posts.map((post) => ({
          ...post,
          timeAgo: formatTimeAgo(post.createdAt),
          isOwner: post.author?._id === currentUser?._id,
          likes: post.likes || [],
          comments: post.comments || [],
          ratings: post.ratings || [],
          trendingScore: calculateTrendingScore(post),
        }));
        
        dispatch(setPosts(postsWithScore));
        calculateUserStats(postsWithScore);
        toast.success(`Found ${res.data.totalResults} results`);
      }
    } catch (err) {
      console.error("Search posts error:", err);
      toast.error("Failed to search posts.");
    } finally {
      setLoading(false);
    }
  }, [token, searchQuery, filters, currentUser, dispatch, formatTimeAgo, calculateTrendingScore, calculateUserStats]);

  // Initial data loading
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetchPosts();
    fetchGlobalStats();
  }, [token, fetchPosts, fetchGlobalStats]);

  // Scroll to post
  const scrollToPost = useCallback((postId) => {
    const postEl = postRefs.current[postId];
    if (postEl) {
      postEl.scrollIntoView({ behavior: "smooth", block: "start" });
      postEl.classList.add("ring-2", "ring-blue-400", "rounded-lg");
      setTimeout(
        () => postEl.classList.remove("ring-2", "ring-blue-400", "rounded-lg"),
        2000
      );
    }
  }, []);

  // Update post in Redux + recalc trending score
  const handlePostUpdate = useCallback((postId, updatedFields) => {
    const updatedPosts = posts.map((p) => {
      if (p._id === postId) {
        const updatedPost = { ...p, ...updatedFields };
        updatedPost.trendingScore = calculateTrendingScore(updatedPost);
        return updatedPost;
      }
      return p;
    });
    dispatch(setPosts(updatedPosts));
    calculateUserStats(updatedPosts);
  }, [posts, dispatch, calculateTrendingScore, calculateUserStats]);

  // Handle post deletion
  const handlePostDelete = useCallback((postId) => {
    const updatedPosts = posts.filter(p => p._id !== postId);
    dispatch(setPosts(updatedPosts));
    calculateUserStats(updatedPosts);
    toast.success("Post deleted successfully");
  }, [posts, dispatch, calculateUserStats]);

  // Handle post creation
  const handlePostCreated = useCallback((newPost) => {
    const postWithScore = {
      ...newPost,
      timeAgo: formatTimeAgo(newPost.createdAt),
      isOwner: true,
      likes: [],
      comments: [],
      ratings: [],
      trendingScore: 0
    };
    
    dispatch(addPost(postWithScore));
    toast.success("Post created successfully!");
    setShowCreatePost(false);
    
    // Recalculate stats with the new post
    calculateUserStats([postWithScore, ...posts]);
  }, [dispatch, posts, formatTimeAgo, calculateUserStats]);

  // Reset filters and reload all posts
  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setFilters({
      location: "",
      country: "",
      sortBy: "createdAt",
      order: "desc"
    });
    fetchPosts();
  }, [fetchPosts]);

  // Derived community stats
  const { totalLikes, totalComments, avgRating } = useMemo(() => {
    const likes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
    const comments = posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);
    
    let totalRatingSum = 0;
    let totalRatingCount = 0;

    posts.forEach(post => {
      if (post.ratings?.length > 0) {
        post.ratings.forEach(rating => {
          totalRatingSum += rating.value || 0;
          totalRatingCount += 1;
        });
      }
    });
    
    const avg = totalRatingCount > 0 ? totalRatingSum / totalRatingCount : 0;
    
    return {
      totalLikes: likes,
      totalComments: comments,
      avgRating: parseFloat(avg.toFixed(1))
    };
  }, [posts]);

  const trendingPosts = useMemo(() => 
    posts
      .slice()
      .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
      .slice(0, 5)
  , [posts]);

  // Sort users by contribution level
  const topContributors = useMemo(() => 
    Object.values(userStats)
      .sort((a, b) => (b.posts + b.likes + b.comments) - (a.posts + a.likes + a.comments))
      .slice(0, 5)
  , [userStats]);

  // Filtered posts based on search and filters
const filteredPosts = useMemo(() => {
  let filtered = posts;

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(post => 
      post.description?.toLowerCase().includes(query) ||
      post.locationText?.toLowerCase().includes(query) ||
      post.country?.toLowerCase().includes(query) ||
      post.author?.name?.toLowerCase().includes(query)
    );
  }

  if (filters.location) {
    filtered = filtered.filter(post => 
      post.locationText?.toLowerCase().includes(filters.location.toLowerCase())
    );
  }

  if (filters.country) {
    filtered = filtered.filter(post => 
      post.country?.toLowerCase().includes(filters.country.toLowerCase())
    );
  }

  // Create a copy of the filtered array and sort
  const sortedPosts = [...filtered].sort((a, b) => {
    const orderMultiplier = filters.order === 'desc' ? -1 : 1;
    
    switch (filters.sortBy) {
      case 'trendingScore':
        return (b.trendingScore - a.trendingScore) * orderMultiplier;
      case 'likes':
        return ((b.likes?.length || 0) - (a.likes?.length || 0)) * orderMultiplier;
      case 'comments':
        return ((b.comments?.length || 0) - (a.comments?.length || 0)) * orderMultiplier;
      case 'createdAt':
      default:
        return (new Date(b.createdAt) - new Date(a.createdAt)) * orderMultiplier;
    }
  });

  return sortedPosts;
}, [posts, searchQuery, filters]);

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Travel Community</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-6">
            Connect with fellow travelers, share experiences, and discover insider tips from around the world.
          </p>
          {/* Warning if user is not logged in */}
{!token && (
  <marquee
    behavior="scroll"
    direction="left"
    scrollamount="6"
    className="text-red-600 font-semibold mt-4"
  >
    Please login to interact with posts and share your own experiences!
  </marquee>
)}

          {/* Tabs */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                className={`px-6 py-3 text-sm font-medium rounded-l-lg transition-colors ${
                  activeTab === "community" 
                    ? "bg-blue-600 text-white shadow-md" 
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
                onClick={() => setActiveTab("community")}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Community Feed
                </div>
              </button>
              <button
                type="button"
                className={`px-6 py-3 text-sm font-medium rounded-r-lg transition-colors ${
                  activeTab === "user-stats" 
                    ? "bg-blue-600 text-white shadow-md" 
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
                onClick={() => setActiveTab("user-stats")}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  User Statistics
                </div>
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="max-w-4xl mx-auto mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search posts, locations, or users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>

              {/* Create Post Button */}
              <button
                onClick={() => setShowCreatePost(true)}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Share Experience
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="Filter by location..."
                      value={filters.location}
                      onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      placeholder="Filter by country..."
                      value={filters.country}
                      onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="createdAt">Newest</option>
                      <option value="trendingScore">Trending</option>
                      <option value="likes">Most Likes</option>
                      <option value="comments">Most Comments</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                    <select
                      value={filters.order}
                      onChange={(e) => setFilters(prev => ({ ...prev, order: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Reset Filters
                  </button>
                  {/* <button
                    onClick={handleSearch}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Apply Filters
                  </button> */}
                </div>
              </div>
            )}
          </div>
        </div>

        {activeTab === "community" ? (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Posts */}
            <div className="lg:col-span-3 space-y-6">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {searchQuery || Object.values(filters).some(f => f) ? "No matching posts found" : "No posts yet"}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || Object.values(filters).some(f => f) 
                      ? "Try adjusting your search or filters" 
                      : "Be the first to share your travel experience!"}
                  </p>
                  {searchQuery || Object.values(filters).some(f => f) ? (
                    <button
                      onClick={handleResetFilters}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear Search & Filters
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create First Post
                    </button>
                  )}
                </div>
              ) : (
                filteredPosts.map((post) => {
                  if (!post?._id) return null;
                  const isTrendingTop3 = trendingPosts.some((t) => t._id === post._id);
                  return (
                    <div
                      key={post._id}
                      ref={(el) => (postRefs.current[post._id] = el)}
                      className={`relative transition-all duration-300 ${
                        isTrendingTop3 ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-lg shadow-md" : ""
                      }`}
                    >
                      {isTrendingTop3 && (
                        <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm">
                          <TrendingUp className="w-3 h-3" />
                          Trending
                        </span>
                      )}
                      <PostCard
                        post={post}
                        onPostUpdate={handlePostUpdate}
                        onPostDelete={handlePostDelete}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Global Stats */}
              <div className="bg-white p-6 rounded-xl shadow">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-6 h-6 text-blue-500" />
                  <h2 className="text-lg font-bold text-gray-900">Community Stats</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Posts</span>
                    <span className="font-bold text-blue-600">{posts.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" /> Likes
                    </span>
                    <span className="font-bold text-red-600">{totalLikes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" /> Comments
                    </span>
                    <span className="font-bold text-green-600">{totalComments}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Star className="w-4 h-4" /> Avg Rating
                    </span>
                    <span className="font-bold text-yellow-600">{avgRating}/5</span>
                  </div>
                  {globalStats.totalUsers && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Users</span>
                      <span className="font-bold text-purple-600">{globalStats.totalUsers}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Contributors */}
              {topContributors.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <h2 className="text-lg font-bold text-gray-900">Top Contributors</h2>
                  </div>
                  <div className="space-y-4">
                    {topContributors.map((user, index) => (
                      <div key={user.user._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <img
                          src={user.user.avatarUrl || "https://www.gravatar.com/avatar/?d=mp"}
                          alt={user.user.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                          onError={(e) => {
                            e.target.src = "https://www.gravatar.com/avatar/?d=mp";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-sm">{user.user.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{user.posts} posts</span>
                            <span>•</span>
                            <span>{user.likes} likes</span>
                          </div>
                        </div>
                        {user.avgRating > 0 && (
                          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs font-semibold text-yellow-700">{user.avgRating}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Posts */}
              {trendingPosts.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-red-500" />
                    <h2 className="text-lg font-bold text-gray-900">Trending Now</h2>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {trendingPosts.map((post, index) => (
                      <button
                        key={post._id}
                        onClick={() => scrollToPost(post._id)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group border-b border-gray-100 last:border-0"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {index + 1}
                        </div>
                        {post.imageUrl ? (
                          <img
                            src={post.imageUrl}
                            alt="thumbnail"
                            className="w-12 h-12 object-cover rounded-md flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/48x48?text=No+Image";
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center text-gray-400 text-xs shadow-sm">
                            <Camera className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-semibold text-gray-800 line-clamp-2 text-sm leading-tight mb-1">
                            {post.description?.length > 60
                              ? `${post.description.substring(0, 60)}...`
                              : post.description || "No description"}
                          </p>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span className="truncate">{post.author?.name || "Unknown"}</span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {post.trendingScore?.toFixed(1) || 0}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* User Statistics Tab */
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              Community Statistics
            </h2>
            
            {/* Current User Stats */}
            {currentUser && userStats[currentUser._id] && (
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-500" />
                  Your Contribution Stats
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg text-center shadow-sm border border-blue-100">
                    <div className="inline-flex p-2 bg-blue-100 rounded-full mb-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-xl font-bold text-blue-800">{userStats[currentUser._id].posts}</div>
                    <div className="text-sm text-blue-600">Posts</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg text-center shadow-sm border border-green-100">
                    <div className="inline-flex p-2 bg-green-100 rounded-full mb-2">
                      <ThumbsUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-xl font-bold text-green-800">{userStats[currentUser._id].likes}</div>
                    <div className="text-sm text-green-600">Likes Received</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg text-center shadow-sm border border-purple-100">
                    <div className="inline-flex p-2 bg-purple-100 rounded-full mb-2">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-xl font-bold text-purple-800">{userStats[currentUser._id].countriesCount}</div>
                    <div className="text-sm text-purple-600">Countries</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg text-center shadow-sm border border-yellow-100">
                    <div className="inline-flex p-2 bg-yellow-100 rounded-full mb-2">
                      <Star className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="text-xl font-bold text-yellow-800">{userStats[currentUser._id].avgRating}</div>
                    <div className="text-sm text-yellow-600">Avg Rating</div>
                  </div>
                </div>
                
                {/* Additional Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">{userStats[currentUser._id].comments}</div>
                    <div className="text-gray-600">Comments</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">{userStats[currentUser._id].photos}</div>
                    <div className="text-gray-600">Photos Shared</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">{userStats[currentUser._id].engagementRate}</div>
                    <div className="text-gray-600">Engagement Rate</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* All Users Stats Table */}
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              Community Members
            </h3>
            {Object.values(userStats).length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No user statistics available yet.</p>
                <p className="text-sm">Start posting to see statistics!</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posts
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Likes
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comments
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Rating
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Countries
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Engagement
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.values(userStats)
                      .sort((a, b) => b.posts - a.posts)
                      .map((userStat) => (
                      <tr 
                        key={userStat.user._id} 
                        className={userStat.user._id === currentUser?._id ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
                                src={userStat.user.avatarUrl || "https://www.gravatar.com/avatar/?d=mp"}
                                alt={userStat.user.name}
                                onError={(e) => {
                                  e.target.src = "https://www.gravatar.com/avatar/?d=mp";
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">{userStat.user.name}</div>
                              <div className="text-sm text-gray-500">{userStat.user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-semibold">{userStat.posts}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-semibold text-red-600">{userStat.likes}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-semibold text-green-600">{userStat.comments}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-semibold text-yellow-700">{userStat.avgRating}/5</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-semibold text-purple-600">{userStat.countriesCount}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-semibold text-blue-600">{userStat.engagementRate}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CreatePost Modal */}
        {showCreatePost && (
          <CreatePost
            onPostCreated={handlePostCreated}
            onClose={() => setShowCreatePost(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Community;