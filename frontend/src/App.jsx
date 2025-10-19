// import { Routes, Route } from "react-router-dom";

// // Pages
// import Home from "./Pages/Home";
// import Explore from "./Pages/Explore";
// import StateDetail from "./Pages/StateDetail";
// import PlanTrip from "./Pages/PlanTrip";
// import Community from "./Pages/CommunityPage";
// import Profile from "./Pages/ProfilePage";
// import Login from "./Pages/Login";
// import Signup from "./Pages/Signup";

// // Components
// import Navbar from "./components/Navbar";
// import BottomNav from "./components/BottomNav";

// function App() {
//   return (
//     <div className="min-h-screen flex flex-col bg-gray-50">
//       {/* Navbar only on medium+ screens */}
//       <div className="hidden md:block">
//         <Navbar />
//       </div>

//       {/* Main content */}
//       <div className="flex-1">
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/signup" element={<Signup />} />
//           <Route path="/explore" element={<Explore />} />
//           <Route path="/state/:stateName" element={<StateDetail />} />
//           <Route path="/plan-trip" element={<PlanTrip />} />
//           <Route path="/community" element={<Community />} />
//           <Route path="/profile" element={<Profile />} />
//         </Routes>
//       </div>

//       {/* Bottom navigation only on mobile */}
//       <div className="block md:hidden">
//         <BottomNav />
//       </div>
//     </div>
//   );
// }

// export default App;


import { Routes, Route } from "react-router-dom";

// Pages
import Home from "./Pages/Home";
import Explore from "./Pages/Explore";
import StateDetail from "./Pages/StateDetail";
import PlanTrip from "./Pages/PlanTrip";
import Community from "./Pages/CommunityPage";
import Profile from "./Pages/ProfilePage";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import BudgetPage from "./components/BudgetCard";
import RoutePage from "./components/RouteCard";
import ClimatePage from "./components/ClimateCard";
import './App.css';

// Components
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="hidden md:block">
        <Navbar />
      </div>

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/state/:stateName" element={<StateDetail />} />
          <Route path="/plan-trip" element={<PlanTrip />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/route" element={<RoutePage />} />
          <Route path="/climate" element={<ClimatePage />} />
          <Route path="/community" element={<Community />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>

      <div className="block md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

export default App;
