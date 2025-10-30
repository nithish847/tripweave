import React, { useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  Calculator, 
  TrendingDown, 
  PieChart, 
  Users, 
  X, 
  Wallet, 
  AlertTriangle,
  Loader,
  Plus,
  MapPin,
  Car,
  Home,
  Utensils,
  Ticket
} from "lucide-react";
import { removePlace } from "../redux/itinerarySlice";

// Enhanced Haversine formula with error handling
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  try {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  } catch (error) {
    console.error('Error calculating distance:', error);
    return 0;
  }
};

// Enhanced currency formatter with actual conversion rates
const formatCurrency = (amount, currency = 'INR') => {
  const symbols = {
    INR: '₹',
    JPY: '¥',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };

  const conversionRates = {
    INR: 1,
    JPY: 1.8,    // Approximate conversion
    USD: 0.012,  // Approximate conversion
    EUR: 0.011,  // Approximate conversion
    GBP: 0.009   // Approximate conversion
  };

  const convertedAmount = amount * conversionRates[currency];
  
  return `${symbols[currency] || '₹'}${convertedAmount.toLocaleString('en-IN', { 
    maximumFractionDigits: 0 
  })}`;
};

const BudgetCard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedPlaces = useSelector((state) => state.itinerary.selectedPlaces);
  const [groupSize, setGroupSize] = useState(2);
  const [budgetCategory, setBudgetCategory] = useState("moderate");
  const [calculationError, setCalculationError] = useState(null);
  const [currency, setCurrency] = useState("INR"); // Default to INR for Indian project

  // Enhanced budget categories with more realistic Indian pricing
  const budgetCategories = [
    { 
      id: "budget", 
      name: "Budget", 
      travelCostPerKm: 8, 
      accommodationPerNight: 800,
      foodPerDay: 500,
      color: "from-green-500 to-emerald-600"
    },
    { 
      id: "moderate", 
      name: "Moderate", 
      travelCostPerKm: 12, 
      accommodationPerNight: 1500,
      foodPerDay: 1200,
      color: "from-blue-500 to-cyan-600"
    },
    { 
      id: "luxury", 
      name: "Luxury", 
      travelCostPerKm: 20, 
      accommodationPerNight: 3000,
      foodPerDay: 2500,
      color: "from-purple-500 to-pink-600"
    },
  ];

  // Calculate total distance with proper waypoint routing
  const calculateTotalDistance = (places) => {
    if (places.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < places.length; i++) {
      const prev = places[i - 1];
      const current = places[i];
      
      // Handle different coordinate property names
      const prevLat = prev.Lat || prev.lat;
      const prevLon = prev.Lon || prev.lng;
      const currLat = current.Lat || current.lat;
      const currLon = current.Lon || current.lng;
      
      if (prevLat && prevLon && currLat && currLon) {
        totalDistance += getDistanceFromLatLonInKm(prevLat, prevLon, currLat, currLon);
      }
    }
    
    // Add 20% for road curvature and detours
    return totalDistance * 1.2;
  };

  const budgetData = useMemo(() => {
    try {
      setCalculationError(null);
      if (!selectedPlaces.length) return null;
      
      const category = budgetCategories.find((c) => c.id === budgetCategory);
      if (!category) return null;

      // Calculate costs
      const totalEntranceFee = selectedPlaces.reduce((sum, p) => sum + (p.EntranceFee || 0), 0);
      const totalDistance = calculateTotalDistance(selectedPlaces);
      
      // Transportation costs
      const travelCost = totalDistance * category.travelCostPerKm;
      
      // Accommodation (assuming 1 night per 2 places for multi-day trips)
      const nights = Math.max(1, Math.ceil(selectedPlaces.length / 2));
      const accommodationCost = nights * category.accommodationPerNight;
      
      // Food costs (per day)
      const foodCost = selectedPlaces.length * category.foodPerDay;
      
      // Miscellaneous (20% of other costs)
      const miscCost = (totalEntranceFee + travelCost + accommodationCost + foodCost) * 0.2;

      // Group calculations
      const groupEntranceFee = totalEntranceFee * groupSize;
      const groupTravelCost = travelCost; // Shared vehicle cost
      const groupAccommodation = accommodationCost * Math.ceil(groupSize / 2); // Shared rooms
      const groupFood = foodCost * groupSize;
      const groupMisc = miscCost * groupSize;

      const totalBudget = groupEntranceFee + groupTravelCost + groupAccommodation + groupFood + groupMisc;
      const perPersonBudget = Math.round(totalBudget / groupSize);

      // Calculate savings compared to luxury travel
      const luxuryCategory = budgetCategories.find(c => c.id === "luxury");
      const luxuryTravelCost = totalDistance * luxuryCategory.travelCostPerKm;
      const luxuryAccommodation = nights * luxuryCategory.accommodationPerNight * Math.ceil(groupSize / 2);
      const luxuryFood = selectedPlaces.length * luxuryCategory.foodPerDay * groupSize;
      const luxuryMisc = (totalEntranceFee * groupSize + luxuryTravelCost + luxuryAccommodation + luxuryFood) * 0.2;
      
      const luxuryTotal = (totalEntranceFee * groupSize) + luxuryTravelCost + luxuryAccommodation + luxuryFood + luxuryMisc;
      const savings = Math.max(0, luxuryTotal - totalBudget);

      return {
        totalDistance: parseFloat(totalDistance.toFixed(1)),
        travelCost: groupTravelCost,
        totalEntranceFee: groupEntranceFee,
        accommodationCost: groupAccommodation,
        foodCost: groupFood,
        miscCost: groupMisc,
        totalBudget,
        perPersonBudget,
        savings,
        nights,
        category: category.name
      };
    } catch (error) {
      console.error('Budget calculation error:', error);
      setCalculationError("Failed to calculate budget. Please check your places data.");
      return null;
    }
  }, [selectedPlaces, groupSize, budgetCategory]);

  if (!selectedPlaces.length) {
    return (
      <div className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-lg mx-auto my-10">
        <div className="w-28 h-28 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Calculator className="w-14 h-14 text-blue-500" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-3">No Budget to Calculate</h3>
        <p className="text-gray-600 text-lg mb-6">Add places to your itinerary to see a detailed budget breakdown!</p>
        <button 
          onClick={() => navigate('/explore')}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 mx-auto shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Browse Destinations
        </button>
      </div>
    );
  }

  const handleRemovePlace = (placeId) => dispatch(removePlace(placeId));

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-8 max-w-4xl mx-auto my-10">
      {/* Header */}
      <div className="flex items-center gap-5 pb-4 border-b border-gray-100">
        <div className="p-6 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl shadow-lg">
          <Calculator className="w-10 h-10 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900">Smart Budget Planner</h2>
          <p className="text-gray-600 text-lg">Optimized cost breakdown for your India trip</p>
        </div>
      </div>

      {/* Travel Style Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Select Travel Style</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {budgetCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setBudgetCategory(cat.id)}
              className={`p-5 rounded-2xl font-semibold text-lg transition-all duration-300 flex flex-col items-center gap-3 ${
                budgetCategory === cat.id 
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-lg scale-105` 
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200"
              }`}
            >
              <span>{cat.name}</span>
              <div className="text-sm font-normal opacity-90">
                {cat.id === "budget" && "Backpacker friendly"}
                {cat.id === "moderate" && "Comfort travel"}
                {cat.id === "luxury" && "Premium experience"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Currency and Group Size Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Currency Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Currency
          </label>
          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="INR">Indian Rupee (₹)</option>
            <option value="USD">US Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
            <option value="GBP">British Pound (£)</option>
            <option value="JPY">Japanese Yen (¥)</option>
          </select>
        </div>

        {/* Group Size */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Group Size: {groupSize} {groupSize === 1 ? 'person' : 'people'}
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={groupSize}
              onChange={(e) => setGroupSize(parseInt(e.target.value))}
              className="flex-1"
            />
            <div className="bg-blue-500 text-white px-4 py-2 rounded-full font-semibold text-lg min-w-[3rem] text-center">
              {groupSize}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Places */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-500" />
          Selected Places ({selectedPlaces.length})
        </h3>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {selectedPlaces.map((place, index) => (
            <div
              key={place._id}
              className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-sm flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="font-medium text-gray-800">{place.Name}</span>
                {place.EntranceFee > 0 && (
                  <span className="text-sm text-gray-500">
                    • Entry: {formatCurrency(place.EntranceFee, currency)}
                  </span>
                )}
              </div>
              <button 
                onClick={() => handleRemovePlace(place._id)} 
                className="text-red-500 p-2 rounded-full hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Summary */}
      {calculationError ? (
        <div className="bg-red-100 border border-red-300 p-6 rounded-3xl text-red-800 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="font-semibold">Calculation Error</p>
            <p className="text-sm">{calculationError}</p>
          </div>
        </div>
      ) : budgetData && (
        <>
          {/* Main Budget Card */}
          <div className="bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-8 rounded-3xl text-white shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center gap-3">
                <PieChart className="w-8 h-8" />
                <div>
                  <h3 className="text-2xl font-bold">Total Budget</h3>
                  <p className="text-emerald-100">{budgetData.category} Style • {budgetData.nights} {budgetData.nights === 1 ? 'Night' : 'Nights'}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{formatCurrency(budgetData.totalBudget, currency)}</div>
                <div className="text-lg opacity-90">{formatCurrency(budgetData.perPersonBudget, currency)} per person</div>
              </div>
            </div>

            {/* Savings Alert */}
            {budgetData.savings > 0 && (
              <div className="bg-green-500/20 p-4 rounded-2xl mb-6 border border-green-400/30">
                <div className="flex items-center gap-3 text-green-100">
                  <TrendingDown className="w-5 h-5" />
                  You're saving {formatCurrency(budgetData.savings, currency)} compared to luxury travel!
                </div>
              </div>
            )}

            {/* Cost Breakdown */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-white/20 rounded-xl text-center">
                <Ticket className="w-5 h-5 mx-auto mb-1" />
                <div>Entrance</div>
                <div className="font-bold">{formatCurrency(budgetData.totalEntranceFee, currency)}</div>
              </div>
              <div className="p-3 bg-white/20 rounded-xl text-center">
                <Car className="w-5 h-5 mx-auto mb-1" />
                <div>Transport</div>
                <div className="font-bold">{formatCurrency(budgetData.travelCost, currency)}</div>
                <div className="text-xs opacity-80">{budgetData.totalDistance} km</div>
              </div>
              <div className="p-3 bg-white/20 rounded-xl text-center">
                <Home className="w-5 h-5 mx-auto mb-1" />
                <div>Stay</div>
                <div className="font-bold">{formatCurrency(budgetData.accommodationCost, currency)}</div>
              </div>
              <div className="p-3 bg-white/20 rounded-xl text-center">
                <Utensils className="w-5 h-5 mx-auto mb-1" />
                <div>Food</div>
                <div className="font-bold">{formatCurrency(budgetData.foodCost, currency)}</div>
              </div>
            </div>
          </div>

          {/* Budget Warning */}
          {budgetData.totalBudget > 50000 && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-2xl p-4">
              <div className="flex items-center gap-3 text-yellow-800">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">High Budget Trip</p>
                  <p>Consider adjusting travel style or reducing places to optimize costs.</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Money-saving Tips for Indian Travel */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-100">
        <h4 className="font-bold text-purple-800 mb-4 flex items-center gap-3 text-lg">
          <Wallet className="w-6 h-6" /> 
          India Travel Money-Saving Tips
        </h4>
        <ul className="space-y-3 text-gray-700 grid md:grid-cols-2 gap-4">
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold mt-1">•</span>
            <span>Book IRCTC trains 120 days in advance for best fares</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold mt-1">•</span>
            <span>Use UPI payments for discounts and cashback offers</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold mt-1">•</span>
            <span>Travel offseason (Apr-Jun, Sep-Oct) for hotel discounts</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold mt-1">•</span>
            <span>Use local transport (auto, metro) instead of cabs</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold mt-1">•</span>
            <span>Eat at local dhabas for authentic & affordable food</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold mt-1">•</span>
            <span>Book combo tickets for multiple attractions</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default BudgetCard;