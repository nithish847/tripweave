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
    else if (formData.description.trim().length < 10) newErrors.description = "At least 10 characters required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.country.trim()) newErrors.country = "Country is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🧠 Image compression before upload
  const compressImage = async (file) => {
    const maxWidth = 1080;
    const imageBitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const ratio = imageBitmap.width > maxWidth ? maxWidth / imageBitmap.width : 1;
    canvas.width = imageBitmap.width * ratio;
    canvas.height = imageBitmap.height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })),
        "image/jpeg",
        0.8 // quality 80%
      );
    });
  };

  const handleImageSelect = async (file) => {
    if (!file) return;
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type))
      return setErrors({ ...errors, image: "Only JPG, JPEG, and PNG images allowed" });

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize)
      return setErrors({ ...errors, image: "Image size must be < 10MB" });

    const compressed = await compressImage(file);
    setSelectedImage(compressed);
    setImagePreview(URL.createObjectURL(compressed));
    setErrors({ ...errors, image: "" });
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragOver(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleImageSelect(e.dataTransfer.files[0]);
  };

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
        timeout: 45000, // faster timeout (45s)
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(percent);
        },
      });

      toast.success("Post created successfully!");
      onPostCreated(res.data.post);
      resetForm();
      onClose();
    } catch (err) {
      console.error("Create post error:", err);
      let message = "Failed to create post.";
      if (err.code === "ECONNABORTED") message = "Upload timed out. Try a smaller image.";
      else if (err.response?.data?.message) message = err.response.data.message;
      toast.error(message);
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
      <div className="bg-white p-4 sm:p-6 rounded-xl w-full max-w-md sm:max-w-lg md:max-w-xl shadow-xl relative max-h-[90vh] overflow-y-auto transition-all">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          disabled={loading}
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        <h2 className="text-xl sm:text-2xl font-bold mb-5 text-gray-900 text-center">
          Create New Post
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Upload Image */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Upload Image (Optional)
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center relative cursor-pointer transition-colors ${
                dragOver
                  ? "border-blue-400 bg-blue-50"
                  : errors.image
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Camera className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Drag & drop or click to upload</p>
              <p className="text-xs text-gray-500">PNG, JPG, JPEG (Max. 10MB)</p>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileInputChange}
                disabled={loading}
              />
            </div>
            {errors.image && <p className="text-red-600 text-sm mt-2">{errors.image}</p>}
            {imagePreview && (
              <div className="mt-3 relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-44 sm:h-52 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    setErrors({ ...errors, image: "" });
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Description *</label>
            <textarea
              placeholder="Share your travel experience..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={`w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? "border-red-300" : "border-gray-300"
              }`}
              rows="4"
              maxLength="500"
              disabled={loading}
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
            <p className="text-xs text-gray-500 mt-1 text-right">
              {formData.description.length}/500
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Location *</label>
            <input
              type="text"
              placeholder="e.g., Taj Mahal, Eiffel Tower"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.location ? "border-red-300" : "border-gray-300"
              }`}
              disabled={loading}
            />
            {errors.location && (
              <p className="text-red-600 text-sm mt-1">{errors.location}</p>
            )}
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Country *</label>
            <input
              type="text"
              placeholder="e.g., India, France"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.country ? "border-red-300" : "border-gray-300"
              }`}
              disabled={loading}
            />
            {errors.country && (
              <p className="text-red-600 text-sm mt-1">{errors.country}</p>
            )}
          </div>

          {/* Upload Progress */}
          {loading && selectedImage && (
            <div className="w-full bg-gray-200 rounded-full h-3 mt-2 relative">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-white font-semibold">
                {uploadProgress}%
              </span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" /> Posting...
                </>
              ) : (
                "Create Post"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;

