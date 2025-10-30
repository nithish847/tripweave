import React, { useEffect, useState, useCallback } from "react";
import {
  Heart,
  MessageCircle,
  Star,
  Trash2,
  Edit3,
  MapPin,
  Clock,
  X,
} from "lucide-react";
import { useSelector } from "react-redux";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

// Time formatting utility
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return "Just now";

  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
};

const PostCard = ({ post = {}, onPostUpdate, onPostDelete }) => {
  const token = useSelector((state) => state.auth.token);
  const userId = useSelector(
    (state) => state.auth.user?.id || state.auth.user?._id
  )?.toString();

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState({});
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");

  const [editDesc, setEditDesc] = useState(post.description || "");
  const [editLoc, setEditLoc] = useState(post.locationText || "");
  const [editCountry, setEditCountry] = useState(post.country || "");

  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [liked, setLiked] = useState(post.likes?.includes(userId) || false);

  const [comments, setComments] = useState(post.comments || []);
  const [avgRating, setAvgRating] = useState(0);
  const [userRating, setUserRating] = useState(0);

  // ✅ Proper ownership check
  const postAuthorId =
    post.author?._id?.toString() ||
    post.user?._id?.toString() ||
    post.userId?.toString();

  const isOwner = userId && postAuthorId && userId === postAuthorId;

  // Error display timeout
  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(""), 3000);
  };

  useEffect(() => {
    setEditDesc(post.description || "");
    setEditLoc(post.locationText || "");
    setEditCountry(post.country || "");
    setLikes(post.likes?.length || 0);
    setLiked(post.likes?.includes(userId) || false);
    setComments(post.comments || []);

    if (post.ratings?.length > 0) {
      const total = post.ratings.reduce((a, r) => a + (r?.value || 0), 0);
      setAvgRating(total / post.ratings.length);

      const existingRating = post.ratings.find(
        (r) => r?.user?.toString() === userId
      );
      setUserRating(existingRating?.value || 0);
    } else {
      setAvgRating(0);
      setUserRating(0);
    }
  }, [post, userId]);

  // ---------------- Like / Unlike ----------------
  const handleLike = useCallback(async () => {
    if (!token) return;

    const prevLiked = liked;
    const prevLikes = likes;
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
    setLoading((prev) => ({ ...prev, like: true }));

    try {
      const res = await API.post(
        `/posts/like/${post._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && onPostUpdate) {
        onPostUpdate(post._id, { likes: res.data.likes });
      }
    } catch {
      setLiked(prevLiked);
      setLikes(prevLikes);
      showError("Failed to update like");
    } finally {
      setLoading((prev) => ({ ...prev, like: false }));
    }
  }, [token, liked, likes, post._id, onPostUpdate]);

  // ---------------- Add Comment - FIXED ----------------
  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() || !token) return;
    setLoading((prev) => ({ ...prev, comment: true }));

    try {
      const res = await API.post(
        `/posts/comment/${post._id}`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Comment response:", res.data); // Debug log

      if (res.data.success) {
        // Backend returns { success: true, comments: updatedCommentsArray }
        const updatedComments = res.data.comments;

        if (updatedComments && Array.isArray(updatedComments)) {
          setComments(updatedComments);
          setNewComment("");
          onPostUpdate?.(post._id, { comments: updatedComments });
        } else {
          // Fallback optimistic update
          const optimisticComment = {
            _id: `temp-${Date.now()}`,
            text: newComment,
            user: {
              _id: userId,
              name: "You",
            },
            createdAt: new Date().toISOString(),
          };
          const newComments = [optimisticComment, ...comments];
          setComments(newComments);
          setNewComment("");
          onPostUpdate?.(post._id, { comments: newComments });
        }
      }
    } catch (err) {
      console.error("Add comment error:", err);
      showError("Failed to add comment");
    } finally {
      setLoading((prev) => ({ ...prev, comment: false }));
    }
  }, [newComment, token, post._id, onPostUpdate, comments, userId]);

  // ---------------- Rate Post ----------------
  const handleRate = useCallback(
    async (value) => {
      if (!token) return;

      const prevRating = userRating;
      setUserRating(value);

      try {
        const res = await API.post(
          `/posts/rate/${post._id}`,
          { value },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          setAvgRating(res.data.avgRating ?? 0);
          onPostUpdate?.(post._id, { ratings: res.data.ratings });
        }
      } catch (err) {
        console.error(err);
        setUserRating(prevRating);
        showError("Failed to submit rating");
      }
    },
    [token, userRating, post._id, onPostUpdate]
  );

  // ---------------- Delete Post ----------------
  const handleDelete = useCallback(async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    setLoading((prev) => ({ ...prev, delete: true }));

    try {
      const res = await API.delete(`/posts/${post._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        onPostDelete?.(post._id);
      } else {
        showError(res.data.message || "Failed to delete post");
      }
    } catch (err) {
      console.error(err);
      showError("Failed to delete post");
    } finally {
      setLoading((prev) => ({ ...prev, delete: false }));
    }
  }, [token, post._id, onPostDelete]);

  // ---------------- Update Post ----------------
  const handleUpdate = useCallback(async () => {
    if (!token) return;
    setLoading((prev) => ({ ...prev, update: true }));

    try {
      const res = await API.put(
        `/posts/${post._id}`,
        {
          description: editDesc,
          locationText: editLoc,
          country: editCountry,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        onPostUpdate?.(post._id, {
          description: editDesc,
          locationText: editLoc,
          country: editCountry,
        });
        setEditing(false);
      }
    } catch (err) {
      console.error(err);
      showError("Failed to update post");
    } finally {
      setLoading((prev) => ({ ...prev, update: false }));
    }
  }, [token, post._id, editDesc, editLoc, editCountry, onPostUpdate]);

  // Sort comments by date (newest first) with safety checks
  const sortedComments = [...comments]
    .filter((comment) => comment && typeof comment === "object") // Filter out invalid comments
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || a.createdAt || 0);
      const dateB = new Date(b.createdAt || b.createdAt || 0);
      return dateB - dateA;
    });

  if (!post._id) return null;

  return (
    <>
      {/* Comments Modal */}
      {showCommentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {(post.author?.name || post.user?.name || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Comments</h3>
                  <p className="text-sm text-gray-500">
                    {comments.length} comments
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCommentsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Post Preview in Modal */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4" />
                <span>
                  {post.locationText && post.country
                    ? `${post.locationText}, ${post.country}`
                    : "Unknown Location"}
                </span>
                <span className="text-gray-400">•</span>
                <Clock className="w-4 h-4" />
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
              <p className="text-gray-700 text-sm line-clamp-2">
                {post.description}
              </p>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4">
              {sortedComments.length > 0 ? (
                <div className="space-y-3">
                  {sortedComments.map((comment) => (
                    <div
                      key={
                        comment._id || comment.id || `comment-${Math.random()}`
                      }
                      className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs flex-shrink-0">
                        {(
                          (
                            comment.user?.name ||
                            comment.author?.name ||
                            "U"
                          )?.charAt(0) || "U"
                        ).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-blue-600 text-sm">
                            {comment.user?.name ||
                              comment.author?.name ||
                              "Traveler"}
                          </span>
                          <span className="text-gray-400 text-xs">•</span>
                          <span className="text-gray-500 text-xs">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed break-words">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">
                    No comments yet. Be the first to comment!
                  </p>
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleAddComment()
                  }
                  disabled={loading.comment}
                />
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  disabled={loading.comment || !newComment.trim()}
                >
                  {loading.comment ? "..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Card - More Compact */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4 hover:shadow-md transition-shadow duration-200">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 text-red-700 px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-medium">{error}</span>
            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Header - More Compact */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
             <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs overflow-hidden bg-gray-400">
  {(() => {
    const avatar = post.author?.avatarUrl || post.user?.avatarUrl;
    const name = post.author?.name || post.user?.name || "User";

    return avatar ? (
      <img
        src={avatar}
        alt={name}
        className="w-full h-full object-cover"
      />
    ) : (
      name.charAt(0).toUpperCase()
    );
  })()}
</div>


              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {post.author?.name || post.user?.name || "Traveler"}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(post.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">
                    {post.locationText && post.country
                      ? `${post.locationText}, ${post.country}`
                      : "Unknown Location"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Rating Badge - Smaller */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-full px-2 py-1 flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-yellow-800 font-semibold text-xs">
                  {avgRating.toFixed(1)}
                </span>
              </div>

              {/* Edit/Delete Buttons */}
              {isOwner && !editing && (
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    disabled={loading.update}
                    title="Edit Post"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    disabled={loading.delete}
                    title="Delete Post"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Edit Mode */}
          {editing ? (
            <div className="space-y-3 mb-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Share your travel experience..."
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={editLoc}
                  onChange={(e) => setEditLoc(e.target.value)}
                  placeholder="Location"
                  className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  placeholder="Country"
                  className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading.update}
                >
                  {loading.update ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg text-sm font-medium hover:bg-gray-500 transition-colors duration-200"
                  disabled={loading.update}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap line-clamp-3">
                {post.description}
              </p>
            </div>
          )}

          {/* Image */}
          {post.imageUrl && !editing && (
            <div className="mb-3 rounded-lg overflow-hidden border border-gray-200">
              <img
                src={post.imageUrl}
                alt="Travel destination"
                onError={(e) => {
                  e.target.src = "/fallback.jpg";
                  e.target.className = "w-full h-48 object-contain bg-gray-100";
                }}
                className="w-full h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity duration-200"
                onClick={() => window.open(post.imageUrl, "_blank")}
              />
            </div>
          )}
        </div>

        {/* Actions - Ultra Compact */}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Like Button */}
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 text-gray-600 hover:text-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!token || loading.like}
              >
                <Heart
                  className="w-4 h-4 transition-all duration-200"
                  fill={liked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={2}
                />
                <span className="text-xs font-medium">{likes}</span>
              </button>

              {/* Comment Button - Opens Modal */}
              <button
                onClick={() => setShowCommentsModal(true)}
                className="flex items-center gap-1.5 text-gray-600 hover:text-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!token}
              >
                <MessageCircle className="w-4 h-4" strokeWidth={2} />
                <span className="text-xs font-medium">{comments.length}</span>
              </button>
            </div>

            {/* Rating Stars - Compact */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 transition-all duration-150 ${
                    star <= (userRating || Math.round(avgRating))
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300 fill-gray-100"
                  } ${
                    !token
                      ? "cursor-not-allowed"
                      : "cursor-pointer hover:scale-125 hover:text-yellow-300"
                  }`}
                  onClick={() => token && handleRate(star)}
                  strokeWidth={1.5}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PostCard;
