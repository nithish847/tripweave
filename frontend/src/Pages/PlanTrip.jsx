import React from 'react';
import BudgetCard from '../components/BudgetCard';
import RouteCard from '../components/RouteCard';
import ClimateCard from '../components/ClimateCard';

const PlanTrip = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">

        {/* Page Header */}
        <div className="text-center mb-12 py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Plan Your Perfect Trip
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Use our intelligent planning tools to create the perfect itinerary, budget, and timeline for your next adventure.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add IDs here for navbar scrolling */}
          <div id="budget" className="space-y-6">
            <BudgetCard />
          </div>

          <div id="route" className="space-y-6">
            <RouteCard />
          </div>

          <div id="climate" className="space-y-6">
            <ClimateCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanTrip;
