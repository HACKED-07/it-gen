// app/components/ItineraryDisplay.tsx
"use client";

import { useState } from "react";
import {
  MapPin,
  Utensils,
  Clock,
  Hotel as HotelIcon,
  Info,
} from "lucide-react"; // Added Info icon

// --- Type Definitions (Should match the output structure of createItinerary) ---
type Activity = {
  title: string;
  type: "attraction" | "meal" | "rest" | "hotel";
  start_time: string;
  end_time: string;
  location?: string;
  cost: number;
};

type DailyItinerary = {
  day: number;
  activities: Activity[];
  total_cost: number; // Cost for this day
};

type PopularDestination = {
  name: string;
  google_rating: number;
  interest: string[];
  price_fare: number;
};

type Hotel = {
  name: string;
  rating: number;
  price: number; // Per night
  features: string[];
};

// Updated ItineraryCity to include cost details
type ItineraryCity = {
  city: string;
  state?: string;
  popular_destinations: PopularDestination[];
  hotels: Hotel[];
  rating: number;
  description: string;
  best_time_to_visit: string[];
  is_recommended_month: boolean;
  daily_itinerary: DailyItinerary[];
  city_total_cost: number; // Total cost for THIS city itinerary
  remaining_budget: number; // Remaining budget for THIS city itinerary
};

// Structure received from the action
export type ItineraryData = {
  [interest: string]: ItineraryCity[];
};

// Props for this component - only needs the itinerary data object
type ItineraryProps = {
  itinerary: ItineraryData;
  // Removed totalCost and remainingBudget props
};

export default function ItineraryDisplay({ itinerary }: ItineraryProps) {
  // Initial state: Select the first interest and the first city within that interest
  const initialInterest = Object.keys(itinerary)[0];
  const [selectedInterest, setSelectedInterest] =
    useState<string>(initialInterest);
  const [selectedCityIndex, setSelectedCityIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"overview" | "detailed">(
    "overview"
  );

  const interests = Object.keys(itinerary);
  // Get the array of city options for the currently selected interest
  const citiesForSelectedInterest = itinerary[selectedInterest] || [];
  // Get the specific city object based on the selected index
  const currentCity = citiesForSelectedInterest[selectedCityIndex] || null;

  // Handler to change the selected interest
  const handleInterestChange = (interest: string) => {
    setSelectedInterest(interest);
    setSelectedCityIndex(0); // Reset to the first city when interest changes
    setActiveTab("overview"); // Optionally reset tab
  };

  // Handler to change the selected city within the current interest
  const handleCityChange = (index: number) => {
    setSelectedCityIndex(index);
    setActiveTab("overview"); // Optionally reset tab
  };

  // Render loading or error state if data is missing
  if (!initialInterest || !currentCity) {
    return (
      <div className="p-6 text-center text-gray-600">
        <Info size={48} className="mx-auto mb-4 text-blue-500" />
        <p>Loading itinerary details or no data available...</p>
      </div>
    );
  }

  // Extract costs from the currently selected city object
  const cityTotalCost = currentCity.city_total_cost;
  const cityRemainingBudget = currentCity.remaining_budget;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Your Curated Trip Itinerary
      </h2>

      {/* --- Top Summary Bar --- */}
      <div className="mb-8 p-4 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
          <div className="md:col-span-1">
            <p className="text-sm text-gray-600">Selected Destination</p>
            <p className="text-xl font-semibold text-blue-800">
              {currentCity.city}
              {currentCity.state ? `, ${currentCity.state}` : ""}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Best Months: {currentCity.best_time_to_visit.join(", ") || "N/A"}
            </p>
            {currentCity.is_recommended_month && (
              <span className="inline-block bg-green-200 text-green-800 px-2 py-0.5 rounded text-xs font-medium mt-1">
                Recommended Month!
              </span>
            )}
          </div>
          <div className="md:col-span-1">
            <p className="text-sm text-gray-600">Est. Trip Cost</p>
            <p className="text-xl font-semibold text-green-800">
              ₹{cityTotalCost.toLocaleString()}
            </p>
          </div>
          <div className="md:col-span-1">
            <p className="text-sm text-gray-600">Est. Remaining Budget</p>
            <p className="text-xl font-semibold text-orange-700">
              ₹{cityRemainingBudget.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* --- Interest Selector --- */}
      {interests.length > 1 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3 text-gray-700">
            Explore by Interest:
          </h3>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <button
                key={interest}
                onClick={() => handleInterestChange(interest)}
                className={`px-4 py-2 rounded-full text-sm transition-colors duration-200 ${
                  selectedInterest === interest
                    ? "bg-blue-600 text-white shadow"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- City Selector (within selected interest) --- */}
      {citiesForSelectedInterest.length > 1 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3 text-gray-700">
            Destination Options for {selectedInterest}:
          </h3>
          <div className="flex flex-wrap gap-2">
            {citiesForSelectedInterest.map((cityOption, index) => (
              <button
                key={`${selectedInterest}-${index}`}
                onClick={() => handleCityChange(index)}
                className={`px-4 py-2 rounded-full text-sm transition-colors duration-200 ${
                  selectedCityIndex === index
                    ? "bg-green-600 text-white shadow"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {cityOption.city}
                {!cityOption.is_recommended_month && " (Off-Peak)"}
                {` - Est. ₹${cityOption.city_total_cost.toLocaleString()}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- Current City Description --- */}
      <div className="mb-8 p-5 bg-white rounded-lg shadow">
        <h3 className="text-2xl font-semibold mb-2 text-gray-800">
          {currentCity.city}
        </h3>
        <p className="text-gray-600 leading-relaxed mb-3">
          {currentCity.description || "No description available."}
        </p>
        <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-medium">
          City Rating: {currentCity.rating}/5
        </span>
      </div>

      {/* --- Tab Selector --- */}
      <div className="border-b border-gray-300 mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-base font-medium transition-colors duration-200 ${
              activeTab === "overview"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("detailed")}
            className={`px-4 py-2 text-base font-medium transition-colors duration-200 ${
              activeTab === "detailed"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Detailed Itinerary
          </button>
        </div>
      </div>

      {/* --- Tab Content --- */}
      {activeTab === "overview" ? (
        /* --- Overview Tab Content --- */
        <div className="space-y-8">
          {/* Popular Destinations in this City */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Popular Spots
            </h3>
            {currentCity.popular_destinations &&
            currentCity.popular_destinations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCity.popular_destinations.map((dest, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {dest.name}
                      </h4>
                      <span className="text-sm font-semibold text-green-600">
                        Est. Cost: ₹{dest.price_fare.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                      <span>
                        <MapPin size={14} className="inline mr-1" />
                        {currentCity.city}
                      </span>
                      <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-medium">
                        Rating: {dest.google_rating}/5
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {dest.interest.map((int, i) => (
                        <span
                          key={i}
                          className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs"
                        >
                          {int}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">
                No specific popular destinations listed for this interest.
              </p>
            )}
          </div>

          {/* Recommended Hotels */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Accommodation
            </h3>
            {currentCity.hotels && currentCity.hotels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentCity.hotels.map((hotel, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {hotel.name}
                      </h4>
                      <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-medium">
                        Rating: {hotel.rating}/5
                      </span>
                    </div>
                    <p className="text-base font-semibold text-green-700 mb-3">
                      ₹{hotel.price.toLocaleString()}{" "}
                      <span className="text-sm font-normal text-gray-500">
                        per night (est.)
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {hotel.features.slice(0, 4).map((feature, i) => (
                        <span
                          key={i}
                          className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs"
                        >
                          {feature}
                        </span>
                      ))}
                      {hotel.features.length > 4 && (
                        <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                          +{hotel.features.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Hotel information not available.</p>
            )}
          </div>
        </div>
      ) : (
        /* --- Detailed Itinerary Tab Content --- */
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            Daily Schedule
          </h3>
          {currentCity.daily_itinerary &&
          currentCity.daily_itinerary.length > 0 ? (
            <div className="space-y-6">
              {currentCity.daily_itinerary.map((day) => (
                <div
                  key={day.day}
                  className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                >
                  <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-3">
                    <h4 className="text-lg font-semibold">Day {day.day}</h4>
                    <p className="text-sm text-gray-300">
                      Est. Cost: ₹{day.total_cost.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 space-y-4">
                    {day.activities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                      >
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {activity.type === "attraction" && (
                            <MapPin size={18} className="text-blue-500" />
                          )}
                          {activity.type === "meal" && (
                            <Utensils size={18} className="text-orange-500" />
                          )}
                          {activity.type === "hotel" && (
                            <HotelIcon size={18} className="text-purple-500" />
                          )}
                          {activity.type === "rest" && (
                            <Clock size={18} className="text-gray-400" />
                          )}
                        </div>
                        {/* Details */}
                        <div className="flex-grow">
                          <p className="font-medium text-gray-800">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {activity.start_time} - {activity.end_time}
                            {activity.location && ` @ ${activity.location}`}
                          </p>
                        </div>
                        {/* Cost */}
                        <div className="flex-shrink-0 text-right">
                          {activity.cost > 0 && (
                            <span className="text-sm font-medium text-green-700">
                              ₹{activity.cost.toLocaleString()}
                            </span>
                          )}
                          {activity.cost === 0 && activity.type !== "rest" && (
                            <span className="text-sm text-gray-400">
                              Included
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 rounded-lg text-center text-yellow-800">
              Detailed daily plan is not available for this selection.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
