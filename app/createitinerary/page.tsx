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
  name: string;
  address: string;
  rating: number;
  price_per_night: number;
};

type ItineraryCity = {
  city: string;
  state?: string;
  popular_destinations: Destination[];
  hotels: Hotel[];
  rating: number;
  description: string;
  best_time_to_visit: string[];
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
      ? hotels.sort((a, b) => b.rating - a.rating)[0]
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
              ? `Check-in at ${selectedHotel.name}`
              : `Check-in at your hotel`,
            description: selectedHotel
              ? `Get settled at ${selectedHotel.name} (${selectedHotel.rating}★) located at ${selectedHotel.address}.`
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
              ? `Check-out from ${selectedHotel.name}`
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
      console.log("Submitting form with:", { selectedInterests, travelMonth });
      const result = await createItinerary({
        interests: selectedInterests,
        travelMonth,
      });

      console.log("Received result:", result);

      if (result.success) {
        setResult(result);

        // Select the first interest and city by default
        if (result.itinerary && Object.keys(result.itinerary).length > 0) {
          const firstInterest = Object.keys(result.itinerary)[0];
          setSelectedInterestKey(firstInterest);
          setSelectedCityIndex(0);
        }
      } else {
        setError(result.message || "Failed to create itinerary");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
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
        <div>
          <h2 className="text-lg font-semibold mb-3">Select Your Interests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {INTEREST_CATEGORIES.map((interest) => (
              <div key={interest} className="flex items-center">
                <input
                  type="checkbox"
                  id={interest}
                  checked={selectedInterests.includes(interest)}
                  onChange={() => handleInterestToggle(interest)}
                  className="mr-2 h-4 w-4"
                />
                <label htmlFor={interest}>{interest}</label>
              </div>
            ))}
          </div>
          {selectedInterests.length === 0 && (
            <p className="text-red-500 text-sm mt-1">
              Please select at least one interest
            </p>
          )}
        </div>

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
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setTripDuration(""); // Keep it as an empty string if the input is cleared
                } else {
                  const parsedValue = parseInt(value);
                  if (!isNaN(parsedValue)) {
                    setTripDuration(parsedValue.toString());
                  }
                }
              }}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || selectedInterests.length === 0 || !travelMonth}
          className="bg-blue-600 text-white py-2 px-4 rounded disabled:bg-gray-400"
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
              interests or travel month.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left sidebar - Interest categories and cities */}
              <div className="md:col-span-1 border rounded p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Suggested Destinations</h3>

                {Object.entries(result.itinerary).map(([interest, cities]) => (
                  <div key={interest} className="mb-4">
                    <h4 className="text-sm font-medium bg-blue-50 p-1 rounded">
                      {interest}
                    </h4>

                    <ul className="mt-2 space-y-1">
                      {cities.map((city, index) => (
                        <li key={index}>
                          <button
                            className={`text-left w-full p-1 text-sm rounded hover:bg-blue-100 ${
                              selectedInterestKey === interest &&
                              selectedCityIndex === index
                                ? "bg-blue-100 font-medium"
                                : ""
                            }`}
                            onClick={() => {
                              setSelectedInterestKey(interest);
                              setSelectedCityIndex(index);
                            }}
                          >
                            {city.city}
                            {city.state ? `, ${city.state}` : ""}
                            <span className="text-yellow-600 ml-1 text-xs">
                              ({city.rating}★)
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Right content - Selected city itinerary */}
              <div className="md:col-span-2">
                {selectedCity ? (
                  <div>
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
                      </div>
                    </div>

                    {/* Hotel information */}
                    {selectedCity.hotels && selectedCity.hotels.length > 0 && (
                      <div className="mb-6 p-4 bg-gray-50 rounded">
                        <h4 className="font-semibold mb-2">
                          Recommended Accommodation
                        </h4>
                        <div className="space-y-2">
                          {selectedCity.hotels
                            .slice(0, 3)
                            .map((hotel, index) => (
                              <div
                                key={index}
                                className="flex justify-between border-b last:border-b-0 pb-2"
                              >
                                <div>
                                  <div className="font-medium">
                                    {hotel.name}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {hotel.address}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-yellow-600">
                                    {hotel.rating}★
                                  </div>
                                  <div className="text-sm font-medium">
                                    ₹{hotel.price_per_night}/night
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Day-by-day itinerary */}
                    <h4 className="font-semibold mb-3">Day-by-Day Itinerary</h4>
                    <div className="space-y-6">
                      {dailyPlans.map((day) => (
                        <div key={day.day} className="border rounded shadow-sm">
                          <div className="bg-blue-600 text-white p-2 rounded-t">
                            <h5 className="font-medium">Day {day.day}</h5>
                          </div>
                          <div className="p-4">
                            <ul className="space-y-4">
                              {day.activities.map((activity, index) => (
                                <li
                                  key={index}
                                  className="border-b last:border-b-0 pb-3"
                                >
                                  <div className="flex items-start">
                                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs w-20 text-center">
                                      {activity.time}
                                    </div>
                                    <div className="ml-3">
                                      <div className="font-medium">
                                        {activity.activity}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {activity.description}
                                      </div>
                                      {activity.price && (
                                        <div className="text-sm text-green-600 mt-1">
                                          {activity.price}
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

                    {/* Print button */}
                    <div className="mt-6 text-right">
                      <button
                        onClick={() => window.print()}
                        className="bg-gray-600 text-white py-1 px-4 rounded text-sm"
                      >
                        Print Itinerary
                      </button>
                    </div>
                  </div>
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
