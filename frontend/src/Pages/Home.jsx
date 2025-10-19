
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, Calculator, Route, Thermometer, Star, ArrowRight, Compass, Plane, Globe } from "lucide-react";
import places from "../assets/place.json";

const HomePage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const placesPerPage = 4;
  const totalPages = Math.ceil(places.length / placesPerPage);
  const indexOfLastPlace = currentPage * placesPerPage;
  const indexOfFirstPlace = indexOfLastPlace - placesPerPage;
  const currentPlaces = places.slice(indexOfFirstPlace, indexOfLastPlace);

  const slideInterval = useRef(null);
  const debounceTimeout = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    startSlide();
    
    // Intersection Observer for fade-in animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      { threshold: 0.1 }
    );

    return () => {
      clearInterval(slideInterval.current);
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [totalPages]);

  useEffect(() => {
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach(el => {
      el.classList.add('opacity-0', 'translate-y-8', 'transition-all', 'duration-700');
      observerRef.current.observe(el);
    });
  }, []);

  const startSlide = () => {
    slideInterval.current = setInterval(() => {
      setCurrentPage(prev => (prev === totalPages ? 1 : prev + 1));
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
      description: "Create optimized travel routes with personalized recommendations",
      path: "/route",
      color: "bg-emerald-500",
      hoverColor: "hover:bg-emerald-600"
    },
    {
      icon: Calculator,
      title: "Budget Planner",
      description: "Plan your expenses and track your travel budget in real-time",
      path: "/budget",
      color: "bg-amber-500",
      hoverColor: "hover:bg-amber-600"
    },
    {
      icon: Thermometer,
      title: "Weather Guide",
      description: "Get climate insights and packing recommendations for your destination",
      path: "/climate",
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600"
    },
  ];

  // Add handwritten font for testimonials
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  return (
    <div className="min-h-screen font-sans bg-slate-50">
      {/* Enhanced Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-28 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-r from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${15 + Math.random() * 10}s`
              }}
            ></div>
          ))}
        </div>

        <div className="relative container mx-auto px-6 text-center">
          {/* Main Logo and Title */}
          <div className="flex flex-col items-center justify-center gap-6 mb-12 fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl blur-lg opacity-75 animate-pulse"></div>
              <div className="relative p-5 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl">
                <Globe className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight bg-gradient-to-r from-white via-amber-100 to-cyan-100 bg-clip-text text-transparent">
              TravelCompanion
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-2xl md:text-3xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed font-light fade-in">
            Where <span className="font-bold text-amber-300">dream destinations</span> meet{' '}
            <span className="font-bold text-cyan-300">effortless planning</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center fade-in">
            <button
              onClick={() => navigate("/route")}
              className="group relative overflow-hidden flex items-center justify-center gap-4 px-12 py-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 focus:ring-4 focus:ring-amber-400/50 transition-all duration-500 focus:outline-none focus:ring-offset-2"
              aria-label="Start planning your journey"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <Compass className="w-6 h-6 relative z-10" />
              <span className="relative z-10">Start Your Journey</span>
              <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
            </button>

            <button
              onClick={() => navigate("/explore")}
              className="group relative overflow-hidden flex items-center justify-center gap-4 px-12 py-6 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl border-2 border-white/30 hover:border-white/50 backdrop-blur-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 focus:ring-4 focus:ring-blue-200/50 transition-all duration-500 focus:outline-none focus:ring-offset-2"
              aria-label="Explore destinations"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <MapPin className="w-6 h-6 relative z-10" />
              <span className="relative z-10">Explore Destinations</span>
            </button>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section
        className="py-20 bg-gradient-to-b from-white to-slate-50/50"
        onMouseEnter={() => clearInterval(slideInterval.current)}
        onMouseLeave={startSlide}
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-14 fade-in">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Popular Destinations
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover handpicked locations loved by our community of travelers
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {currentPlaces.map((place, index) => (
              <div
                key={place.id}
                className={`group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 cursor-pointer bg-white border border-gray-100 fade-in`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="relative overflow-hidden">
                  <img 
                    src={place.Image} 
                    alt={place.Name} 
                    loading="lazy" 
                    className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-amber-600 font-bold text-sm flex items-center">
                      <Star className="w-4 h-4 fill-current mr-1" />
                      {place.Rating || "4.5"}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-xl text-gray-800 mb-2">{place.Name}</h3>
                  <p className="text-gray-500 mb-4 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {place.State}
                  </p>
                  <Link 
                    to={`/destination/${place.id}`} 
                    className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold transition-colors duration-300 group/link"
                  >
                    Explore Now
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {/* Enhanced Pagination */}
          <div className="flex justify-center items-center mt-12 space-x-4 fade-in">
            <button
              onClick={() => handlePageChange(currentPage === 1 ? totalPages : currentPage - 1)}
              className="flex items-center justify-center w-12 h-12 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-300"
              aria-label="Previous page"
            >
              &lt;
            </button>
            <div className="flex space-x-3">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-3 h-3 rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-teal-300 ${
                    currentPage === i + 1 
                      ? 'bg-teal-500 w-8 shadow-lg' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => handlePageChange(currentPage === totalPages ? 1 : currentPage + 1)}
              className="flex items-center justify-center w-12 h-12 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-300"
              aria-label="Next page"
            >
              &gt;
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-100/80">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14 fade-in">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Smart Travel Tools
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to plan the perfect trip, all in one place
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <article 
                  key={idx} 
                  onClick={() => navigate(feature.path)} 
                  className={`group cursor-pointer bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500 border border-gray-100 fade-in focus:outline-none focus:ring-2 focus:ring-gray-200`}
                  style={{ transitionDelay: `${idx * 150}ms` }}
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && navigate(feature.path)}
                >
                  <div className={`w-16 h-16 ${feature.color} ${feature.hoverColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-md`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                  <div className="flex items-center text-teal-600 font-semibold group-hover:text-teal-700 transition-colors duration-300">
                    <span>Try Now</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14 fade-in">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Travelers Say
            </h2>
            <p className="text-lg text-gray-600">
              Real stories from our community of adventurers
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Sarah M.",
                text: "This platform made planning our family vacation so effortless. The itinerary builder saved us hours of research!",
                delay: "0"
              },
              {
                name: "James K.",
                text: "The budget planner helped me stick to my spending limits while still enjoying an amazing experience abroad.",
                delay: "200"
              },
              {
                name: "Lisa T.",
                text: "I discovered hidden gems I would've never found on my own. The local recommendations were spot on!",
                delay: "400"
              }
            ].map((testimonial, index) => (
              <div 
                key={index}
                className="bg-slate-50 p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-500 transform hover:-translate-y-1 fade-in"
                style={{ transitionDelay: testimonial.delay + 'ms' }}
              >
                <div className="flex text-amber-400 mb-6 justify-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-current mx-1" />
                  ))}
                </div>
                <p 
                  className="text-gray-600 text-lg mb-6 leading-relaxed text-center"
                  style={{ 
                    fontFamily: "'Indie Flower', cursive",
                    lineHeight: '1.6'
                  }}
                >
                  "{testimonial.text}"
                </p>
                <p className="text-gray-800 font-bold text-center text-lg">{testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="relative container mx-auto px-6 fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready for Your Next Adventure?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of travelers exploring the world with confidence and ease
          </p>
          <button
            onClick={() => navigate('/route')}
            className="group inline-flex items-center gap-4 px-12 py-5 bg-white hover:bg-gray-50 text-blue-700 font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 focus:ring-4 focus:ring-blue-200/50 transition-all duration-500 focus:outline-none focus:ring-offset-2"
            aria-label="Start planning your trip today"
          >
            <Compass className="w-6 h-6" />
            Start Planning Today
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
          </button>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-600 rounded-xl">
                <Plane className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-2xl">TravelCompanion</h3>
            </div>
            <p className="text-gray-300 text-lg leading-relaxed max-w-md">
              Your ultimate travel planning partner helping you discover, plan, and experience the world's most amazing destinations.
            </p>
          </div>
          
          <div className="fade-in" style={{ transitionDelay: '100ms' }}>
            <h3 className="font-bold text-xl mb-4">Quick Links</h3>
            <ul className="text-gray-300 space-y-3 text-lg">
              <li>
                <Link to="/" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Home
                </Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Destinations
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Travel Blog
                </Link>
              </li>
              <li>
                <Link to="/plan-trip" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Plan Trip
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="fade-in" style={{ transitionDelay: '200ms' }}>
            <h3 className="font-bold text-xl mb-4">Stay Updated</h3>
            <div className="flex mb-3">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="p-4 rounded-l-2xl flex-1 text-gray-800 text-lg border-0 focus:ring-4 focus:ring-blue-200/50 transition-all duration-300 focus:outline-none"
                aria-label="Email for newsletter subscription"
              />
              <button className="bg-amber-500 hover:bg-amber-600 p-4 rounded-r-2xl text-white font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-300">
                Subscribe
              </button>
            </div>
            <p className="text-gray-300 text-sm">
              Get weekly travel tips, exclusive offers, and destination inspiration
            </p>
          </div>
        </div>
        
        <div className="border-t border-slate-700 mt-8">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-300 text-lg">
                &copy; 2025 TravelCompanion. All rights reserved.
              </p>
              <div className="flex gap-6 text-gray-300 text-lg">
                <a href="#" className="hover:text-white transition-colors duration-300">Privacy</a>
                <a href="#" className="hover:text-white transition-colors duration-300">Terms</a>
                <a href="#" className="hover:text-white transition-colors duration-300">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;