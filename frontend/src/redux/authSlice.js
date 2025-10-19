

import { createSlice } from "@reduxjs/toolkit";

// Get token from localStorage
const token = localStorage.getItem("token") || null;

// Safely parse user from localStorage
let user = null;
try {
  const storedUser = localStorage.getItem("user");
  if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
    user = JSON.parse(storedUser);
  }
} catch (err) {
  console.warn("Failed to parse user from localStorage:", err);
  localStorage.removeItem("user");
}

// ✅ Always ensure user has safe fallback
if (!user || typeof user !== "object") {
  user = { _id: "", name: "Guest" }; // prevent null crashes
}


// Initial state
const initialState = {
  token,
  isAuthenticated: !!token,
  user,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;

      // Save in localStorage
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
  state.token = null;
  state.isAuthenticated = false;
  state.user = { _id: "", name: "Guest" }; // ✅ safe fallback

  // Remove from localStorage
  localStorage.removeItem("token");
  localStorage.removeItem("user");
},

    updateUser: (state, action) => {
  state.user = action.payload; // replace with backend response
  localStorage.setItem("user", JSON.stringify(state.user));
}

  },
});

export const { loginStart, loginSuccess, loginFailure, logout,updateUser } =
  authSlice.actions;

// ✅ Selectors
export const selectToken = (state) => state.auth.token;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
