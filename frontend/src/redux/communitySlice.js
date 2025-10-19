

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  posts: [],
};

// Calculate post score for trending: likes + comments + ratings sum
const calculateScore = (post) => {
  const likesCount = post.likes?.length || 0;
  const commentsCount = post.comments?.length || 0;
  const ratingsSum = post.ratings?.reduce((sum, r) => sum + (r.value || 0), 0) || 0;
  return likesCount + commentsCount + ratingsSum;
};

const communitySlice = createSlice({
  name: "community",
  initialState,
  reducers: {
    setPosts: (state, action) => {
      state.posts = action.payload.map(p => ({ ...p, score: calculateScore(p) }));
    },
    addPost: (state, action) => {
      const postWithScore = { ...action.payload, score: calculateScore(action.payload) };
      state.posts.unshift(postWithScore);
    },
    updatePost: (state, action) => {
      const { postId, updatedFields } = action.payload;
      state.posts = state.posts.map(post =>
        post._id === postId
          ? { ...post, ...updatedFields, score: calculateScore({ ...post, ...updatedFields }) }
          : post
      );
    },
    deletePost: (state, action) => {
      state.posts = state.posts.filter(post => post._id !== action.payload);
    },
  },
});

export const { setPosts, addPost, updatePost, deletePost } = communitySlice.actions;
export default communitySlice.reducer;


