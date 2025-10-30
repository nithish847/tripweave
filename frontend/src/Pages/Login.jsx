import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { loginStart, loginSuccess, loginFailure } from "../redux/authSlice";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Eye, EyeOff, Loader } from "lucide-react";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      return toast.error("Please fill in all fields", { position: "top-right" });
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return toast.error("Please enter a valid email address", { position: "top-right" });
    }

    setIsLoading(true);
    dispatch(loginStart());

    try {
      const { data } = await axios.post("http://localhost:5000/api/users/login", {
        email,
        password,
      });

      // Check if login is successful and has token & user
      if (!data.success || !data.token || !data.user) {
        const message = data.message || "Login failed";
        dispatch(loginFailure(message));
        setIsLoading(false);
        return toast.error(message, { position: "top-right" });
      }

      // Save in Redux
      dispatch(loginSuccess(data));

      // Safely store in localStorage
      try {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch (err) {
        console.warn("Failed to save login data to localStorage:", err);
        // Continue even if localStorage fails - the user is still logged in for this session
      }

      toast.success("Login successful!", {
        position: "top-right",
        autoClose: 1500,
        onClose: () => navigate("/"),
      });
    } catch (err) {
      setIsLoading(false);
      const errorMsg = err.response?.data?.message || err.message || "Login failed. Please try again.";
      dispatch(loginFailure(errorMsg));
      toast.error(errorMsg, { position: "top-right" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Login</h2>
        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              disabled={isLoading}
            />
          </div>
          
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all pr-10"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute right-3 top-3.5 text-gray-500 hover:text-purple-500"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          <button
            type="submit"
            className="w-full py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all flex items-center justify-center disabled:opacity-70"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader size={20} className="animate-spin mr-2" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
       
        
        <p className="text-sm text-gray-500 text-center mt-4">
          Don't have an account?{" "}
          <Link to="/signup" className="text-purple-600 hover:text-purple-800 transition-colors font-medium">
            Sign up
          </Link>
        </p>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Login;



//new one_->1
