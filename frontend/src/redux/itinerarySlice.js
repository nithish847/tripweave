
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  trips: [],            // ✅ will store itinerary places
  budget: null,         // ✅ will store budget object
  selectedPlaces: [],
  source: null,
  destination: null,
};

const itinerarySlice = createSlice({
  name: "itinerary",
  initialState,
  reducers: {
    setTrips: (state, action) => { state.trips = action.payload },
    addTrip: (state, action) => { state.trips.push(action.payload) },
    removeTrip: (state, action) => {
      state.trips = state.trips.filter((t) => t._id !== action.payload);
    },

    setBudget: (state, action) => { state.budget = action.payload },

    addPlace: (state, action) => { state.selectedPlaces.push(action.payload) },
    removePlace: (state, action) => {
      state.selectedPlaces = state.selectedPlaces.filter((p) => p._id !== action.payload);
    },
    clearItinerary: (state) => {
      state.trips = [];
      state.budget = null;
      state.selectedPlaces = [];
      state.source = null;
      state.destination = null;
    },
    setSource: (state, action) => { state.source = action.payload },
    setDestination: (state, action) => { state.destination = action.payload },
  },
});

export const {
  setTrips, addTrip, removeTrip,
  setBudget,
  addPlace, removePlace, clearItinerary,
  setSource, setDestination,
} = itinerarySlice.actions;

export default itinerarySlice.reducer;
