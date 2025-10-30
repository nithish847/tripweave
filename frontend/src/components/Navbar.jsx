import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { MapPin, Menu, X, User, LogOut, Settings } from "lucide-react";

const Navbar = () => {
  const [routeDropdownDesktop, setRouteDropdownDesktop] = useState(false);
  const [routeDropdownMobile, setRouteDropdownMobile] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Explore", path: "/explore" },
    { name: "Community", path: "/community" },
  ];

  const routeItems = [
    { name: "Budget Planner", path: "/budget", description: "Smart cost calculations" },
    { name: "Route Optimizer", path: "/route", description: "AI-powered routes" },
    { name: "Climate Guide", path: "/climate", description: "Weather insights" },
  ];

  const handleLogout = () => {
    dispatch(logout());
    setProfileDropdown(false);
    navigate("/login");
  };

  const closeAllDropdowns = () => {
    setRouteDropdownDesktop(false);
    setProfileDropdown(false);
    setMobileMenu(false);
    setRouteDropdownMobile(false);
  };

  return (
    <>
      <nav className="bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500 shadow-xl sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 text-2xl font-bold text-white hover:scale-105 transition-transform duration-300"
              onClick={closeAllDropdowns}
            >
              <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                <MapPin className="w-8 h-8" />
              </div>
              <span className="bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                TripWeave
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-2 relative">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={closeAllDropdowns}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-white text-purple-600 shadow-lg transform scale-105"
                        : "text-white hover:bg-white/20 hover:backdrop-blur-sm"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}

              {/* Desktop Route Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setRouteDropdownDesktop(!routeDropdownDesktop);
                    setProfileDropdown(false);
                  }}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
                >
                  <MapPin className="w-4 h-4" />
                  Plan Journey
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      routeDropdownDesktop ? "rotate-180" : ""
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {routeDropdownDesktop && (
                  <div className="absolute mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50">
                      <h3 className="font-bold text-gray-800 text-lg mb-1">Planning Tools</h3>
                      <p className="text-gray-600 text-sm">AI-powered travel assistance</p>
                    </div>
                    {routeItems.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={closeAllDropdowns}
                        className="block px-6 py-4 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200 border-b border-gray-50 last:border-b-0"
                      >
                        <div className="font-semibold text-gray-800">{item.name}</div>
                        <div className="text-sm text-gray-600">{item.description}</div>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Auth Section (Desktop) */}
            <div className="hidden md:flex items-center space-x-3">
              {isLoggedIn ? (
                <div className="relative">
                  <button
                    onClick={() => {
                      setProfileDropdown(!profileDropdown);
                      setRouteDropdownDesktop(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/30 hover:bg-white/30 transition-all duration-300"
                  >
                    <User className="w-5 h-5" />
                    <span className="max-w-24 truncate">{user?.name || "User"}</span>
                  </button>

                  {profileDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{user?.name || "User"}</div>
                            <div className="text-sm text-gray-600">{user?.email || "user@example.com"}</div>
                          </div>
                        </div>
                      </div>
                      <NavLink
                        to="/profile"
                        onClick={closeAllDropdowns}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </NavLink>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  to="/login"
                  className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Get Started
                </NavLink>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                setMobileMenu(!mobileMenu);
                setRouteDropdownMobile(false);
              }}
              className="md:hidden p-2 text-white hover:bg-white/20 rounded-xl transition-colors"
            >
              {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="md:hidden bg-white/95 backdrop-blur-sm border-t border-white/20">
            <div className="px-4 py-3 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={closeAllDropdowns}
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-purple-600 text-white shadow-lg"
                        : "text-gray-700 hover:bg-purple-50"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}

              {/* Planning Tools Accordion (Mobile Only) */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <button
                  onClick={() => setRouteDropdownMobile(!routeDropdownMobile)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 rounded-xl font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <span>Planning Tools</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      routeDropdownMobile ? "rotate-180" : ""
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {routeDropdownMobile && (
                  <div className="mt-2 space-y-1 px-2">
                    {routeItems.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={closeAllDropdowns}
                        className="block px-4 py-2 text-gray-700 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              {/* Auth Section (Mobile) */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                {isLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                ) : (
                  <NavLink
                    to="/login"
                    onClick={closeAllDropdowns}
                    className="block px-4 py-3 bg-purple-600 text-white rounded-xl font-medium text-center"
                  >
                    Get Started
                  </NavLink>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Backdrop */}
      {(routeDropdownDesktop || profileDropdown) && (
        <div
          className="fixed inset-0 z-40 bg-black/10"
          onClick={closeAllDropdowns}
        />
      )}
    </>
  );
};

export default Navbar;
