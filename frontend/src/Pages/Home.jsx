import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MapPin,
  Calculator,
  Route,
  Thermometer,
  Star,
  ArrowRight,
  Compass,
  Plane,
  Globe,
} from "lucide-react";
import places from "../assets/place.json";

const HomePage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const placesPerPage = 4;
  const totalPages = Math.ceil(places.length / placesPerPage);
  const indexOfLastPlace = currentPage * placesPerPage;
  const indexOfFirstPlace = indexOfLastPlace - placesPerPage;
  const currentPlaces = places.slice(indexOfFirstPlace, indexOfLastPlace);

  const slideInterval = useRef(null);
  const debounceTimeout = useRef(null);
  const observerRef = useRef(null);

  // Hero auto-slide + fade-in animation observer
  useEffect(() => {
    startSlide();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-8");
          }
        });
      },
      { threshold: 0.1 }
    );

    const fadeElements = document.querySelectorAll(".fade-in");
    fadeElements.forEach((el) => {
      el.classList.add(
        "opacity-0",
        "translate-y-8",
        "transition-all",
        "duration-700"
      );
      observerRef.current.observe(el);
    });

    return () => {
      clearInterval(slideInterval.current);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  const startSlide = () => {
    slideInterval.current = setInterval(() => {
      setCurrentPage((prev) => (prev === totalPages ? 1 : prev + 1));
    }, 5000);
  };

  const handlePageChange = (page) => {
    if (debounceTimeout.current) return;
    setCurrentPage(page);
    debounceTimeout.current = setTimeout(() => {
      debounceTimeout.current = null;
    }, 300);
  };

  const features = [
    {
      icon: Route,
      title: "Smart Itinerary Builder",
      description:
        "Create optimized travel routes with personalized recommendations.",
      path: "/route",
      color: "bg-emerald-500",
      hoverColor: "hover:bg-emerald-600",
    },
    {
      icon: Calculator,
      title: "Budget Planner",
      description:
        "Plan your expenses and track your travel budget in real-time.",
      path: "/budget",
      color: "bg-amber-500",
      hoverColor: "hover:bg-amber-600",
    },
    {
      icon: Thermometer,
      title: "Weather Guide",
      description:
        "Get climate insights and packing recommendations for your destination.",
      path: "/climate",
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
    },
  ];

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  return (
    <div className="min-h-screen font-sans bg-slate-50 pb-20 lg:pb-0">
      {/* 🌍 Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-12 sm:py-20 lg:py-28 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-72 sm:w-80 h-72 sm:h-80 bg-gradient-to-r from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -right-40 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 text-center">
          {/* Logo and Title */}
          <div className="flex flex-col items-center gap-4 sm:gap-6 mb-8 sm:mb-10 fade-in">
            <div className="p-3 sm:p-5 bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl">
              <Globe className="w-10 h-10 sm:w-14 md:w-16 sm:h-14 md:h-16 text-white" />
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-tight bg-gradient-to-r from-white via-amber-100 to-cyan-100 bg-clip-text text-transparent px-4">
              TravelCompanion
            </h1>
          </div>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed fade-in px-4">
            Where{" "}
            <span className="font-bold text-amber-300">dream destinations</span>{" "}
            meet{" "}
            <span className="font-bold text-cyan-300">effortless planning</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center fade-in px-4 max-w-2xl mx-auto">
            <button
              onClick={() => navigate("/route")}
              className="w-full sm:flex-1 group relative overflow-hidden flex items-center justify-center gap-3 px-6 sm:px-8 lg:px-12 py-4 sm:py-5 lg:py-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl sm:rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-500"
            >
              <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-sm sm:text-base">Start Your Journey</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate("/explore")}
              className="w-full sm:flex-1 group relative overflow-hidden flex items-center justify-center gap-3 px-6 sm:px-8 lg:px-12 py-4 sm:py-5 lg:py-6 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl sm:rounded-2xl border-2 border-white/30 hover:border-white/50 backdrop-blur-lg shadow-2xl transform hover:scale-105 transition-all duration-500"
            >
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-sm sm:text-base">Explore Destinations</span>
            </button>
          </div>
        </div>
      </section>

      {/* 🏝️ Featured Destinations */}
      <section
        className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-slate-50/50"
        onMouseEnter={() => clearInterval(slideInterval.current)}
        onMouseLeave={startSlide}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 fade-in">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
              Popular Destinations
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Discover handpicked locations loved by travelers
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {currentPlaces.map((place, i) => (
              <div
                key={place.id}
                className="group rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 bg-white border border-gray-100 fade-in"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={place.Image}
                    alt={place.Name}
                    className="w-full h-40 sm:h-44 lg:h-52 object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold text-amber-600 flex items-center">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current mr-1" />
                    {place.Rating || "4.5"}
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-2">
                    {place.Name}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-500 flex items-center mb-3 sm:mb-4">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> {place.State}
                  </p>
                  <Link
                    to={`/destination/${place.id}`}
                    className="inline-flex items-center gap-2 text-sm sm:text-base text-teal-600 hover:text-teal-700 font-semibold"
                  >
                    Explore Now
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-8 sm:mt-10 space-x-3 sm:space-x-4 fade-in">
            <button
              onClick={() =>
                handlePageChange(currentPage === 1 ? totalPages : currentPage - 1)
              }
              className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg transform hover:scale-110 transition-all flex items-center justify-center"
            >
              ‹
            </button>
            <div className="flex space-x-2 sm:space-x-3 items-center">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`h-2 sm:h-3 rounded-full ${
                    currentPage === i + 1
                      ? "bg-teal-500 w-6 sm:w-8"
                      : "bg-gray-300 hover:bg-gray-400 w-2 sm:w-3"
                  } transition-all`}
                ></button>
              ))}
            </div>
            <button
              onClick={() =>
                handlePageChange(currentPage === totalPages ? 1 : currentPage + 1)
              }
              className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg transform hover:scale-110 transition-all flex items-center justify-center"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* ⚙️ Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-100/80">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 fade-in">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
              Smart Travel Tools
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Everything you need to plan the perfect trip
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  onClick={() => navigate(feature.path)}
                  className={`group bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500 cursor-pointer border border-gray-100 fade-in`}
                >
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 ${feature.color} ${feature.hoverColor} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{feature.description}</p>
                  <div className="text-sm sm:text-base text-teal-600 font-semibold flex items-center">
                    Try Now
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 🗣 Testimonials Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 fade-in">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
              What Travelers Say
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600">
              Real stories from adventurers
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Sarah M.",
                text: "This platform made our family vacation effortless!",
              },
              {
                name: "James K.",
                text: "The budget planner kept our trip on track — amazing tool!",
              },
              {
                name: "Lisa T.",
                text: "I discovered hidden gems thanks to TravelCompanion!",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-slate-50 p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transform hover:-translate-y-1 transition-all fade-in"
              >
                <div className="flex justify-center mb-4 sm:mb-5 text-amber-400">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 sm:w-5 sm:h-5 fill-current mx-0.5 sm:mx-1" />
                  ))}
                </div>
                <p
                  className="text-gray-600 text-base sm:text-lg mb-4 sm:mb-6 text-center leading-relaxed"
                  style={{ fontFamily: "'Indie Flower', cursive" }}
                >
                  "{item.text}"
                </p>
                <p className="font-bold text-gray-800 text-center text-sm sm:text-base">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ✈️ CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-center text-white relative">
        <div className="relative container mx-auto px-4 sm:px-6 fade-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Ready for Your Next Adventure?
          </h2>
          <p className="text-sm sm:text-base md:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join thousands exploring the world with ease
          </p>
          <button
            onClick={() => navigate("/route")}
            className="group inline-flex items-center gap-3 sm:gap-4 px-8 sm:px-10 lg:px-12 py-4 sm:py-5 bg-white hover:bg-gray-50 text-blue-700 font-bold rounded-xl sm:rounded-2xl shadow-2xl transform hover:scale-105 transition-all text-sm sm:text-base"
          >
            <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
            Start Planning
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* 🌐 Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="sm:col-span-2 fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-600 rounded-xl">
                <Plane className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-bold text-xl sm:text-2xl">TravelCompanion</h3>
            </div>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base lg:text-lg">
              Your ultimate travel planning partner helping you discover and
              explore the world.
            </p>
          </div>

          <div className="fade-in">
            <h3 className="font-bold text-lg sm:text-xl mb-4">Quick Links</h3>
            <ul className="text-gray-300 space-y-3 text-sm sm:text-base">
              <li>
                <Link to="/" className="hover:text-white flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" /> Home
                </Link>
              </li>
              <li>
                <Link
                  to="/explore"
                  className="hover:text-white flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" /> Destinations
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="hover:text-white flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" /> Travel Blog
                </Link>
              </li>
            </ul>
          </div>

          <div className="fade-in">
            <h3 className="font-bold text-lg sm:text-xl mb-4">Stay Updated</h3>
            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 sm:py-3 rounded-xl bg-slate-800 text-white placeholder-gray-400 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
              <button className="px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-white transition-all text-sm sm:text-base">
                Subscribe
              </button>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm mt-3">
              Get the latest travel updates and destination guides!
            </p>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 sm:mt-10 py-4 sm:py-6 text-center text-gray-400 text-xs sm:text-sm">
          © {new Date().getFullYear()} TravelCompanion. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;