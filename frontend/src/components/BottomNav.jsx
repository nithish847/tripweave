import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Users, User } from "lucide-react";

const BottomNav = () => {
  const location = useLocation();

  const links = [
    { path: "/", icon: <Home size={22} />, label: "Home" },
    { path: "/explore", icon: <Compass size={22} />, label: "Trips" },
    { path: "/community", icon: <Users size={22} />, label: "Community" },
    { path: "/profile", icon: <User size={22} />, label: "Profile" },
  ];

  return (
    <nav className="flex justify-around items-center py-3 bg-white shadow-inner border-t">
      {links.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={`flex flex-col items-center text-sm ${
            location.pathname === link.path ? "text-blue-500" : "text-gray-500"
          }`}
        >
          {link.icon}
          <span>{link.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;
