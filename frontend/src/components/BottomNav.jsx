import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Users, User } from "lucide-react";

const BottomNav = () => {
  const location = useLocation();
  
  const links = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/explore", icon: Compass, label: "Explore" },
    { path: "/community", icon: Users, label: "Community" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white shadow-2xl border-t border-gray-200 z-40 safe-area-bottom">
      <div className="flex justify-around items-center px-2 py-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${
                isActive
                  ? "text-purple-600 bg-purple-50 scale-105"
                  : "text-gray-500 hover:text-purple-600 hover:bg-purple-50/50"
              }`}
            >
              <Icon 
                size={22} 
                className={`transition-transform duration-300 ${
                  isActive ? "scale-110" : ""
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-xs font-medium ${
                isActive ? "font-semibold" : ""
              }`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;