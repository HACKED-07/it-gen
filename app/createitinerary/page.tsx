"use client";

import { useState } from "react";
import { createItinerary } from "@/actions/createItinerary";

// Define interest categories based on the data
const INTEREST_CATEGORIES = [
  "Cultural & Heritage Sites",
  "Religious & Spiritual Pilgrimages",
  "Adventure & Outdoor Activities",
  "Arts, Science & Literature Attractions",
  "Shopping & Markets",
  "Natural Landscapes & Wildlife",
  "Sightseeing & Exploration",
  "Sports & Recreation",
  "Culinary & Food Experiences",
  "Beach",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Define better types for the itinerary result that match the server action
type Destination = {
  name: string;
  google_rating: number;
  interest: string[];
  price_fare: number;
};

type Hotel = {
  Hotel_name: string;
  City: string;
  Hotel_Rating: number;
  Hotel_price: number;
};

type ItineraryCity = {
  city: string;
  state?: string;
  popular_destinations: Destination[];
  hotels: Hotel[];
  rating: number;
  description: string;
  best_time_to_visit: string[];
  estimated_daily_cost: number;
};

type ItineraryResult = {
  success: boolean;
  message?: string;
  itinerary?: {
    [interest: string]: ItineraryCity[];
  };
};

// Helper function to create daily plans
const generateDailyPlans = (cityData: ItineraryCity) => {
  const { popular_destinations, hotels } = cityData;

  // Try to get the best hotel
  const selectedHotel =
    hotels && hotels.length > 0
      ? hotels.sort((a, b) => b.Hotel_Rating - a.Hotel_Rating)[0]
      : null;

  // Split destinations into days (max 3 per day)
  const destinationsPerDay = 3;
  const days: Array<{ day: number; activities: any[] }> = [];

  for (let i = 0; i < popular_destinations.length; i += destinationsPerDay) {
    const dayNumber = days.length + 1;
    const dailyDestinations = popular_destinations.slice(
      i,
      i + destinationsPerDay
    );

    // First day should include arrival and hotel check-in
    if (dayNumber === 1) {
      days.push({
        day: dayNumber,
        activities: [
          {
            time: "Morning",
            activity: "Arrive in " + cityData.city,
            description: "Welcome to " + cityData.city + "!",
          },
          {
            time: "Afternoon",
            activity: selectedHotel
              ? `Check-in at ${selectedHotel.Hotel_name}`
              : `Check-in at your hotel`,
            description: selectedHotel
              ? `Get settled at ${selectedHotel.Hotel_name} (${selectedHotel.Hotel_Rating}★) located at ${selectedHotel.City}.`
              : "Get settled at your hotel and prepare for your adventure.",
          },
          ...dailyDestinations.map((dest, index) => ({
            time: index === 0 ? "Evening" : "Night",
            activity: dest.name,
            description: `Visit this ${dest.interest.join(
              ", "
            )} attraction (${dest.google_rating.toFixed(1)}★)`,
            price:
              dest.price_fare > 0
                ? `₹${dest.price_fare.toFixed(0)}`
                : "Free entry",
          })),
        ],
      });
    }
    // Last day should include hotel check-out and departure
    else if (i + destinationsPerDay >= popular_destinations.length) {
      days.push({
        day: dayNumber,
        activities: [
          {
            time: "Morning",
            activity: selectedHotel
              ? `Check-out from ${selectedHotel.Hotel_name}`
              : "Check-out from your hotel",
            description: "Pack your belongings and prepare for your final day.",
          },
          ...dailyDestinations.map((dest, index) => ({
            time:
              index === 0 ? "Morning" : index === 1 ? "Afternoon" : "Evening",
            activity: dest.name,
            description: `Visit this ${dest.interest.join(
              ", "
            )} attraction (${dest.google_rating.toFixed(1)}★)`,
            price:
              dest.price_fare > 0
                ? `₹${dest.price_fare.toFixed(0)}`
                : "Free entry",
          })),
          {
            time: "Night",
            activity: "Departure from " + cityData.city,
            description: "Farewell to " + cityData.city + "!",
          },
        ],
      });
    }
    // Regular days
    else {
      days.push({
        day: dayNumber,
        activities: dailyDestinations.map((dest, index) => ({
          time: index === 0 ? "Morning" : index === 1 ? "Afternoon" : "Evening",
          activity: dest.name,
          description: `Visit this ${dest.interest.join(
            ", "
          )} attraction (${dest.google_rating.toFixed(1)}★)`,
          price:
            dest.price_fare > 0
              ? `₹${dest.price_fare.toFixed(0)}`
              : "Free entry",
        })),
      });
    }
  }

  return days;
};

export default function ItineraryGenerator() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [travelMonth, setTravelMonth] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ItineraryResult | null>(null);
  const [error, setError] = useState("");
  const [tripDuration, setTripDuration] = useState("3"); // Default trip duration in days
  const [selectedCityIndex, setSelectedCityIndex] = useState<number | null>(
    null
  );
  const [selectedInterestKey, setSelectedInterestKey] = useState<string | null>(
    null
  );
  const [showCustomBudget, setShowCustomBudget] = useState(false);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setResult(null);
    setSelectedCityIndex(null);
    setSelectedInterestKey(null);

    try {
      const parsedBudget = budget ? parseInt(budget) : undefined;
      const response = await createItinerary({
        interests: selectedInterests,
        travelMonth,
        budget: parsedBudget,
      });

      if (response.success) {
        setResult(response);
        // Select first interest & city by default
        if (response.itinerary && Object.keys(response.itinerary).length > 0) {
          const firstInterest = Object.keys(response.itinerary)[0];
          setSelectedInterestKey(firstInterest);
          setSelectedCityIndex(0);
        }
      } else {
        setError(response.message || "Failed to create itinerary");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Get the currently selected city data
  const selectedCity =
    selectedInterestKey &&
    selectedCityIndex !== null &&
    result?.itinerary?.[selectedInterestKey]
      ? result.itinerary[selectedInterestKey][selectedCityIndex]
      : null;

  // Generate daily plans for the selected city
  const dailyPlans = selectedCity ? generateDailyPlans(selectedCity) : [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create Your Travel Itinerary</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Interests */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Select Your Interests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {INTEREST_CATEGORIES.map((interest) => (
              <label key={interest} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedInterests.includes(interest)}
                  onChange={() => handleInterestToggle(interest)}
                  className="mr-2 h-4 w-4"
                />
                {interest}
              </label>
            ))}
          </div>
          {selectedInterests.length === 0 && (
            <p className="text-red-500 text-sm mt-1">
              Please select at least one interest
            </p>
          )}
        </div>

        {/* Month, Duration & Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-3">
              When Are You Traveling?
            </h2>
            <select
              value={travelMonth}
              onChange={(e) => setTravelMonth(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select a month</option>
              {MONTHS.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Trip Duration (Days)</h2>
            <input
              type="number"
              min="1"
              max="14"
              value={tripDuration}
              onChange={(e) => setTripDuration(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-3">Daily Budget</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                setBudget("");
                setShowCustomBudget(false);
              }}
              className={`p-3 border rounded text-center hover:bg-gray-50 ${
                budget === "" && !showCustomBudget
                  ? "bg-blue-50 border-blue-500"
                  : ""
              }`}
            >
              No limit
            </button>
            <button
              type="button"
              onClick={() => {
                setBudget("3000");
                setShowCustomBudget(false);
              }}
              className={`p-3 border rounded text-center hover:bg-gray-50 ${
                budget === "3000" && !showCustomBudget
                  ? "bg-blue-50 border-blue-500"
                  : ""
              }`}
            >
              Budget
              <br />
              ₹3,000/day
            </button>
            <button
              type="button"
              onClick={() => {
                setBudget("5000");
                setShowCustomBudget(false);
              }}
              className={`p-3 border rounded text-center hover:bg-gray-50 ${
                budget === "5000" && !showCustomBudget
                  ? "bg-blue-50 border-blue-500"
                  : ""
              }`}
            >
              Mid-range
              <br />
              ₹5,000/day
            </button>
            <button
              type="button"
              onClick={() => {
                setBudget("10000");
                setShowCustomBudget(false);
              }}
              className={`p-3 border rounded text-center hover:bg-gray-50 ${
                budget === "10000" && !showCustomBudget
                  ? "bg-blue-50 border-blue-500"
                  : ""
              }`}
            >
              Luxury
              <br />
              ₹10,000/day
            </button>
            <button
              type="button"
              onClick={() => {
                setBudget("20000");
                setShowCustomBudget(false);
              }}
              className={`p-3 border rounded text-center hover:bg-gray-50 ${
                budget === "20000" && !showCustomBudget
                  ? "bg-blue-50 border-blue-500"
                  : ""
              }`}
            >
              Ultra Luxury
              <br />
              ₹20,000/day
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowCustomBudget(!showCustomBudget);
              if (!showCustomBudget) setBudget("");
            }}
            className={`p-3 border rounded w-full md:w-auto hover:bg-gray-50 ${
              showCustomBudget ? "bg-blue-50 border-blue-500" : ""
            }`}
          >
            Custom
          </button>
          {showCustomBudget && (
            <div className="mt-3 flex items-center">
              <span className="text-xl mr-2">₹</span>
              <input
                type="number"
                min="0"
                placeholder="Enter your daily budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="flex-grow p-2 border rounded"
              />
              <span className="ml-2 text-gray-500">per day</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || selectedInterests.length === 0 || !travelMonth}
          className="bg-blue-600 text-white py-2 px-4 rounded disabled:bg-gray-400 hover:cursor-pointer hover:bg-blue-700"
        >
          {isLoading ? "Creating Itinerary..." : "Create Itinerary"}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {result && result.success && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">
            Your Personalized Itinerary
          </h2>

          {!result.itinerary || Object.keys(result.itinerary).length === 0 ? (
            <p className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              No destinations found for your selected criteria. Try different
              interests, travel month, or budget.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left sidebar */}
              <div className="md:col-span-1 border rounded p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Suggested Destinations</h3>
                {Object.entries(result.itinerary).map(([interest, cities]) => (
                  <div key={interest} className="mb-4">
                    <h4 className="text-sm font-medium bg-blue-50 p-1 rounded">
                      {interest}
                    </h4>
                    <ul className="mt-2 space-y-1">
                      {cities.map((city, idx) => (
                        <li key={idx}>
                          <button
                            className={`text-left w-full p-1 text-sm rounded hover:bg-blue-100 ${
                              selectedInterestKey === interest &&
                              selectedCityIndex === idx
                                ? "bg-blue-100 font-medium"
                                : ""
                            }`}
                            onClick={() => {
                              setSelectedInterestKey(interest);
                              setSelectedCityIndex(idx);
                            }}
                          >
                            {city.city}
                            {city.state ? `, ${city.state}` : ""}
                            <span className="text-yellow-600 ml-1 text-xs">
                              ({city.rating}★)
                            </span>
                            <span className="text-green-600 block text-xs">
                              ₹{city.estimated_daily_cost}/day
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Right content */}
              <div className="md:col-span-2">
                {selectedCity ? (
                  <>
                    <div className="border-b pb-3 mb-4">
                      <h3 className="text-xl font-semibold">
                        {selectedCity.city}
                        {selectedCity.state ? `, ${selectedCity.state}` : ""}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedCity.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                          Rating: {selectedCity.rating}★
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          Best time:{" "}
                          {selectedCity.best_time_to_visit.join(", ")}
                        </span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          Est. Daily Cost: ₹{selectedCity.estimated_daily_cost}
                        </span>
                      </div>
                    </div>

                    {/* Hotels */}
                    {selectedCity.hotels.length > 0 && (
                      <div className="mb-6 p-4 bg-gray-50 rounded">
                        <h4 className="font-semibold mb-2">
                          Recommended Accommodation
                        </h4>
                        {selectedCity.hotels.slice(0, 3).map((hotel, i) => (
                          <div
                            key={i}
                            className="flex justify-between border-b last:border-b-0 pb-2"
                          >
                            <div>
                              <div className="font-medium">
                                {hotel.Hotel_name}
                              </div>
                              <div className="text-xs text-gray-600">
                                {hotel.City}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-yellow-600">
                                {hotel.Hotel_Rating}★
                              </div>
                              <div className="text-sm font-medium">
                                ₹{hotel.Hotel_price}/night
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Day-by-day */}
                    <h4 className="font-semibold mb-3">Day-by-Day Itinerary</h4>
                    <div className="space-y-6">
                      {dailyPlans.map((day) => (
                        <div key={day.day} className="border rounded shadow-sm">
                          <div className="bg-blue-600 text-white p-2 rounded-t">
                            <h5 className="font-medium">Day {day.day}</h5>
                          </div>
                          <div className="p-4">
                            <ul className="space-y-4">
                              {day.activities.map((act, idx) => (
                                <li
                                  key={idx}
                                  className="border-b last:border-b-0 pb-3"
                                >
                                  <div className="flex items-start">
                                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs w-20 text-center">
                                      {act.time}
                                    </div>
                                    <div className="ml-3">
                                      <div className="font-medium">
                                        {act.activity}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {act.description}
                                      </div>
                                      {act.price && (
                                        <div className="text-sm text-green-600 mt-1">
                                          {act.price}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Budget summary */}
                    <div className="mt-6 p-4 bg-green-50 rounded border border-green-200">
                      <h4 className="font-semibold mb-2">Budget Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Accommodation (per night):</span>
                          <span className="font-medium">
                            ₹
                            {selectedCity.hotels.length > 0
                              ? Math.min(
                                  ...selectedCity.hotels.map(
                                    (h) => h.Hotel_price
                                  )
                                )
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average attraction cost:</span>
                          <span className="font-medium">
                            ₹
                            {(
                              selectedCity.popular_destinations.reduce(
                                (sum, d) => sum + d.price_fare,
                                0
                              ) /
                              (selectedCity.popular_destinations.length || 1)
                            ).toFixed(0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated daily food:</span>
                          <span className="font-medium">₹1,500</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-semibold">
                            Total daily cost:
                          </span>
                          <span className="font-semibold">
                            ₹{selectedCity.estimated_daily_cost}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-semibold">
                            Total trip cost ({tripDuration} days):
                          </span>
                          <span className="font-semibold">
                            ₹
                            {selectedCity.estimated_daily_cost *
                              parseInt(tripDuration, 10)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Print */}
                    <div className="mt-6 text-right">
                      <button
                        onClick={() => window.print()}
                        className="bg-gray-600 text-white py-1 px-4 rounded text-sm"
                      >
                        Print Itinerary
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500 p-8 border rounded">
                    Select a destination to view your personalized itinerary
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
