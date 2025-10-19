//new ->1
import React, { useState, useEffect } from 'react';
import { Star, MapPin, IndianRupee, Heart, Users, Clock, Plus, Info, Calendar, CloudSnow } from 'lucide-react';

const DestinationCard = ({
  image,
  name,
  tagline,
  recommended = false,
  rating = 4.5,
  places = 1,
  startingPrice = 0,
  category = 'Nature',
  timing = { duration: '2-3 hrs', period: 'Morning' },
  location = '',
  state = '',
  reviewCount = 1000,
  onAddToItinerary,
  onLike,
  isAdded = false,
  isLikedProp = false
}) => {
  const [isLiked, setIsLiked] = useState(isLikedProp);
  const [isAddedToItinerary, setIsAddedToItinerary] = useState(isAdded);
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setIsAddedToItinerary(isAdded);
  }, [isAdded]);

  useEffect(() => {
    setIsLiked(isLikedProp);
  }, [isLikedProp]);

  const categoryColors = {
    Nature: 'from-green-500 to-emerald-600',
    Temple: 'from-orange-500 to-red-600',
    Heritage: 'from-amber-500 to-orange-600',
    Modern: 'from-blue-500 to-indigo-600',
    Beach: 'from-cyan-500 to-blue-600',
    Hill: 'from-green-600 to-teal-600',
    Cave: 'from-slate-600 to-gray-700',
    'Bird Sanctuary': 'from-lime-500 to-green-600',
    'Hidden Gem': 'from-purple-500 to-pink-600',
    Adventure: 'from-red-500 to-rose-600',
    Cultural: 'from-indigo-500 to-purple-600',
    Budget: 'from-green-500 to-emerald-600',
    Luxury: 'from-purple-500 to-pink-600',
    Other: 'from-gray-500 to-slate-600'
  };

  const formatReviewCount = (count) => {
    if (count >= 1000000) {
      return `(${(count / 1000000).toFixed(1)}M reviews)`;
    } else if (count >= 1000) {
      return `(${(count / 1000).toFixed(1)}k reviews)`;
    }
    return `(${count} reviews)`;
  };

  const handleAddToItinerary = async () => {
    if (isAdding) return;
    
    setIsAdding(true);
    try {
      if (onAddToItinerary) {
        const success = await onAddToItinerary();
        if (success !== false) {
          setIsAddedToItinerary(!isAddedToItinerary);
        }
      } else {
        setIsAddedToItinerary(!isAddedToItinerary);
      }
    } catch (error) {
      console.error('Error adding to itinerary:', error);
      // Revert on error
      setIsAddedToItinerary(isAdded);
    } finally {
      setIsAdding(false);
    }
  };

  const handleLike = async () => {
    try {
      if (onLike) {
        const success = await onLike();
        if (success !== false) {
          setIsLiked(!isLiked);
        }
      } else {
        setIsLiked(!isLiked);
      }
    } catch (error) {
      console.error('Error liking:', error);
      // Revert on error
      setIsLiked(isLiked);
    }
  };

  const defaultImage = '/images/default-travel.jpg';

  // Determine display location
  const displayLocation = location || state || '';

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transform transition-all duration-500 hover:scale-[1.02] border border-gray-100 w-full max-w-sm mx-auto">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={imageError ? defaultImage : (image || defaultImage)} 
          alt={name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={() => setImageError(true)}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

        {/* Top Right Buttons */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {/* Heart Button */}
          <button
            onClick={handleLike}
            className="p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-300 transform hover:scale-110 shadow-lg"
            aria-label={isLiked ? `Unlike ${name}` : `Like ${name}`}
          >
            <Heart 
              size={18} 
              className={`transition-all duration-300 ${
                isLiked 
                  ? 'text-red-500 fill-red-500 scale-110' 
                  : 'text-gray-600 hover:text-red-500'
              }`} 
            />
          </button>

          {/* Add to Itinerary Button (Mobile) */}
          <button
            onClick={handleAddToItinerary}
            disabled={isAdding}
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-300 transform hover:scale-110 shadow-lg ${
              isAddedToItinerary
                ? 'bg-green-500 text-white'
                : 'bg-white/90 hover:bg-white text-gray-600'
            } ${isAdding ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isAddedToItinerary ? `Remove ${name} from itinerary` : `Add ${name} to itinerary`}
          >
            {isAdding ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : isAddedToItinerary ? (
              <Calendar size={16} className="text-white" />
            ) : (
              <Plus size={16} />
            )}
          </button>
        </div>

        {/* Top Left Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {/* Recommended Badge */}
          {recommended && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              ⭐ Recommended
            </div>
          )}

          {/* Category Badge */}
          <div className={`bg-gradient-to-r ${categoryColors[category] || categoryColors.Other} text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm`}>
            {category}
          </div>
        </div>

        {/* Bottom Left Rating */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-2xl px-3 py-1.5 flex items-center gap-2 shadow-lg">
          <Star size={16} className="text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-bold text-gray-800">{typeof rating === 'number' ? rating.toFixed(1) : rating}</span>
        </div>

        {/* Review Count */}
        {reviewCount > 0 && (
          <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm rounded-2xl px-3 py-1.5">
            <span className="text-xs font-medium text-white">
              {formatReviewCount(reviewCount)}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-4">
        {/* Title and Location */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-700 transition-colors duration-300 line-clamp-2 leading-tight">
            {name}
          </h3>
          {displayLocation && (
            <div className="flex items-center gap-1 text-gray-600 mb-2">
              <MapPin size={14} className="flex-shrink-0" />
              <span className="text-sm line-clamp-1">{displayLocation}</span>
            </div>
          )}
          {tagline && (
            <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{tagline}</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3">
            <Clock size={16} className="text-blue-500 flex-shrink-0" />
            <div>
              <div className="text-gray-700 font-medium">{timing.period}</div>
              <div className="text-gray-500 text-xs">{timing.duration}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3">
            <IndianRupee size={16} className="text-green-500 flex-shrink-0" />
            <div>
              <div className="text-gray-700 font-medium">
                {startingPrice === 0 ? 'Free' : `₹${startingPrice.toLocaleString()}`}
              </div>
              <div className="text-gray-500 text-xs">Entry Fee</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleAddToItinerary}
            disabled={isAdding}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              isAddedToItinerary
                ? 'bg-green-500 text-white shadow-lg hover:bg-green-600'
                : 'bg-indigo-500 text-white shadow-lg hover:bg-indigo-600 hover:shadow-xl'
            } ${isAdding ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}`}
            aria-label={isAddedToItinerary ? `Remove ${name} from itinerary` : `Add ${name} to itinerary`}
          >
            {isAdding ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Adding...</span>
              </>
            ) : isAddedToItinerary ? (
              <>
                <Calendar size={16} />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Add to Plan</span>
              </>
            )}
          </button>

          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all duration-300 transform hover:scale-105">
            <Info size={16} />
            <span>Details</span>
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isAdding && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <div className="bg-white rounded-xl p-4 shadow-2xl flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-gray-700">Adding to itinerary...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DestinationCard;