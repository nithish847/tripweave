
import React, { useState } from "react";
import { X, Camera, Loader } from "lucide-react";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

const CreatePost = ({ onPostCreated, onClose }) => {
  const token = useSelector((state) => state.auth.token);
  const [formData, setFormData] = useState({ description: "", location: "", country: "" });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const [dragOver, setDragOver] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.description.trim()) newErrors.description = "Description is required";
    else if (formData.description.trim().length < 10) newErrors.description = "Description should be at least 10 characters";

    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.country.trim()) newErrors.country = "Country is required";

    if (selectedImage) {
      const maxSize = 10 * 1024 * 1024;
      if (selectedImage.size > maxSize) newErrors.image = "Image size must be less than 10MB";

      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(selectedImage.type)) newErrors.image = "Only JPG, JPEG, and PNG images are allowed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) return setErrors({ ...errors, image: "Only JPG, JPEG, and PNG images are allowed" });

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) return setErrors({ ...errors, image: "Image size must be less than 10MB" });

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors({ ...errors, image: "" });
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragOver(false); };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length > 0) handleImageSelect(e.dataTransfer.files[0]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = new FormData();
      data.append("description", formData.description.trim());
      data.append("locationText", formData.location.trim());
      data.append("country", formData.country.trim());
      if (selectedImage) data.append("image", selectedImage);

      const res = await API.post("/posts", data, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
        timeout: 120000, // 2 min
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });

      if (res.data.success) {
        toast.success("Post created successfully!");
        onPostCreated(res.data.post);
        resetForm();
        onClose();
      }
    } catch (err) {
      console.error("Create post error:", err);
      let errorMessage = "Failed to create post. Please try again.";
      if (err.code === "ECONNABORTED") errorMessage = "Request timed out. Your internet may be slow or the image is too large.";
      else if (err.response?.data?.message) errorMessage = err.response.data.message;
      else if (err.message) errorMessage = err.message;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setFormData({ description: "", location: "", country: "" });
    setSelectedImage(null);
    setImagePreview(null);
    setErrors({});
    setUploadProgress(0);
  };

  const handleClose = () => { if (!loading) { resetForm(); onClose(); } };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={handleClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors" disabled={loading}>
          <X className="w-6 h-6 text-gray-600" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-900">Create New Post</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Upload Image (Optional)</label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center relative cursor-pointer transition-colors ${
                dragOver ? "border-blue-400 bg-blue-50" : errors.image ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
              }`}
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center">
                <Camera className="w-10 h-10 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-1">Drag and drop or click to upload</p>
                <p className="text-xs text-gray-500">PNG, JPG, JPEG (Max. 10MB)</p>
              </div>
              <input type="file" accept="image/png, image/jpeg, image/jpg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileInputChange} disabled={loading} />
            </div>
            {errors.image && <p className="text-red-600 text-sm mt-2">{errors.image}</p>}
            {imagePreview && (
              <div className="mt-4 relative">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border" />
                <button type="button" onClick={() => { setSelectedImage(null); setImagePreview(null); setErrors({ ...errors, image: "" }); }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600" disabled={loading}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2 text-gray-700">Description *</label>
            <textarea id="description" placeholder="Share your travel experience..." value={formData.description} onChange={(e) => { setFormData({ ...formData, description: e.target.value }); if (errors.description) setErrors({ ...errors, description: "" }); }} className={`w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.description ? "border-red-300" : "border-gray-300"}`} rows="4" disabled={loading} />
            {errors.description && <p className="text-red-600 text-sm mt-2">{errors.description}</p>}
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 characters</p>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-2 text-gray-700">Location *</label>
            <input id="location" type="text" placeholder="e.g., Taj Mahal, Eiffel Tower" value={formData.location} onChange={(e) => { setFormData({ ...formData, location: e.target.value }); if (errors.location) setErrors({ ...errors, location: "" }); }} className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.location ? "border-red-300" : "border-gray-300"}`} disabled={loading} />
            {errors.location && <p className="text-red-600 text-sm mt-2">{errors.location}</p>}
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium mb-2 text-gray-700">Country *</label>
            <input id="country" type="text" placeholder="e.g., India, France" value={formData.country} onChange={(e) => { setFormData({ ...formData, country: e.target.value }); if (errors.country) setErrors({ ...errors, country: "" }); }} className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.country ? "border-red-300" : "border-gray-300"}`} disabled={loading} />
            {errors.country && <p className="text-red-600 text-sm mt-2">{errors.country}</p>}
          </div>

          {/* Upload Progress */}
          {loading && selectedImage && (
            <div className="w-full bg-gray-200 rounded-full h-4 mt-2 relative">
              <div className="bg-blue-600 h-4 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
              <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-white">{uploadProgress}%</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={handleClose} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50" disabled={loading}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <>
                <Loader className="w-4 h-4 animate-spin" /> Posting...
              </> : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
