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

type ItineraryCity = {
  city: string;
  state?: string;
  popular_destinations: Destination[];
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

export default function ItineraryGenerator() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [travelMonth, setTravelMonth] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ItineraryResult | null>(null);
  const [error, setError] = useState("");

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

    try {
      console.log("Submitting form with:", { selectedInterests, travelMonth });
      const result = await createItinerary({
        interests: selectedInterests,
        travelMonth,
      });

      console.log("Received result:", result);

      if (result.success) {
        setResult(result);
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
            Object.entries(result.itinerary).map(([interest, cities]) => (
              <div key={interest} className="mb-8">
                <h3 className="text-lg font-semibold mb-3 bg-blue-50 p-2 rounded">
                  {interest}
                </h3>

                <div className="space-y-4">
                  {cities.map((city, index) => (
                    <div key={index} className="border rounded p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <h4 className="text-md font-semibold">
                          {city.city}
                          {city.state ? `, ${city.state}` : ""}
                        </h4>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                          Rating: {city.rating}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mt-2">
                        {city.description}
                      </p>

                      <div className="mt-2 mb-3 text-xs text-gray-500">
                        <span className="font-medium">Best time to visit:</span>{" "}
                        {city.best_time_to_visit.join(", ")}
                      </div>

                      <h5 className="font-medium mt-4 mb-2">
                        Top Places to Visit:
                      </h5>
                      <ul className="text-sm space-y-2">
                        {city.popular_destinations.map((dest, i) => (
                          <li
                            key={i}
                            className="flex justify-between p-1 hover:bg-gray-50"
                          >
                            <span>{dest.name}</span>
                            <div>
                              <span className="text-yellow-600 mr-2">
                                ★ {dest.google_rating.toFixed(1)}
                              </span>
                              {dest.price_fare > 0 && (
                                <span className="text-green-600">
                                  ₹{dest.price_fare.toFixed(0)}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Debug info - remove in production */}
      {result && (
        <div className="mt-4 p-2 border-t text-xs text-gray-400">
          Found {result.itinerary ? Object.keys(result.itinerary).length : 0}{" "}
          interest categories with matching destinations
        </div>
      )}
    </div>
  );
}
