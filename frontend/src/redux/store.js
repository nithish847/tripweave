import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import itineraryReducer from "./itinerarySlice";
import communityReducer from "./communitySlice";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    itinerary: itineraryReducer,
    community: communityReducer,
  },
});

export default store;
