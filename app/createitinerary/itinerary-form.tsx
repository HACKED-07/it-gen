// app/components/ItineraryForm.tsx
"use client";

import { useState, FormEvent } from "react";
import { Slider } from "@/components/ui/slider"; // Make sure this path is correct
import { createItinerary } from "@/actions/createItinerary"; // Adjusted import path convention
import { ItineraryResult as ItineraryActionResult } from "@/actions/createItinerary"; // Import the result type

// --- Define Props ---
type ItineraryFormProps = {
  onItineraryCreated?: (result: ItineraryActionResult) => void; // Callback for when itinerary is created/failed
  onFormSubmit?: () => void; // <<-- ADD THIS: Callback to signal form submission start (for loading state)
};

// --- Interest and Month Options ---
const interestOptions = [
  "Adventure & Outdoors",
  "Arts & Culture",
  "Beaches & Islands",
  "Culinary & Food Experiences",
  "Family-Friendly",
  "Historical Sites",
  "Luxury Travel",
  "Nature & Wildlife",
  "Nightlife & Entertainment",
  "Religious & Spiritual",
  "Shopping & Markets",
  "Wellness & Spa",
];

const monthOptions = [
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

// --- Component ---
export default function ItineraryForm({
  onItineraryCreated,
  onFormSubmit, // <<-- Destructure the new prop here
}: ItineraryFormProps) {
  const [interests, setInterests] = useState<string[]>([]);
  const [travelMonth, setTravelMonth] = useState<string>("");
  const [budget, setBudget] = useState<number>(50000);
  const [days, setDays] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false); // Local loading state for button
  const [error, setError] = useState<string | null>(null); // Local error state (optional)

  const handleInterestChange = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous local errors

    // 1. Notify parent component that submission is starting (for global loading state)
    if (onFormSubmit) {
      onFormSubmit(); // <<-- CALL THE PROP FUNCTION
    }
    setLoading(true); // 2. Set local loading state (e.g., for button styling)

    try {
      // 3. Call the server action
      const result = await createItinerary({
        interests,
        travelMonth,
        budget,
        days,
      });

      // 4. Pass the result back to the parent component
      if (onItineraryCreated) {
        onItineraryCreated(result);
      }

      // Optionally set local error if needed, though parent handles display
      if (!result.success) {
        setError(result.message || "Failed to generate itinerary.");
      }
    } catch (err) {
      console.error("Error submitting itinerary form:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected client-side error occurred.";
      setError(errorMessage);
      // Ensure parent is notified of failure even if createItinerary crashes client-side
      if (onItineraryCreated) {
        onItineraryCreated({ success: false, message: errorMessage });
      }
    } finally {
      // 5. Reset local loading state
      setLoading(false);
    }
  };

  return (
    // No container needed here if parent provides it
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
        Plan Your Next Adventure
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Interests Selection */}
        <div>
          <label className="block text-lg font-medium mb-2 text-gray-700">
            What are your interests? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {interestOptions.map((interest) => (
              <label
                key={interest}
                htmlFor={interest}
                className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  id={interest}
                  name="interests"
                  value={interest}
                  checked={interests.includes(interest)}
                  onChange={() => handleInterestChange(interest)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{interest}</span>
              </label>
            ))}
          </div>
          {interests.length === 0 && (
            <p className="text-xs text-red-500 mt-1">
              Please select at least one interest.
            </p>
          )}
        </div>

        {/* Travel Month */}
        <div>
          <label
            htmlFor="travelMonth"
            className="block text-lg font-medium mb-2 text-gray-700"
          >
            When are you planning to travel?{" "}
            <span className="text-red-500">*</span>
          </label>
          <select
            id="travelMonth"
            value={travelMonth}
            onChange={(e) => setTravelMonth(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-700"
            required
          >
            <option value="" disabled>
              Select a month
            </option>
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>

        {/* Number of Days */}
        <div>
          <label className="block text-lg font-medium mb-2 text-gray-700">
            How many days? ({days})
          </label>
          <div className="flex items-center justify-center space-x-4">
            <button
              type="button"
              onClick={() => setDays(Math.max(1, days - 1))}
              disabled={days <= 1}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Decrease number of days"
            >
              -
            </button>
            <span className="text-xl font-medium w-12 text-center">{days}</span>
            <button
              type="button"
              onClick={() => setDays(Math.min(14, days + 1))} // Add a max limit?
              disabled={days >= 14} // Example max limit
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Increase number of days"
            >
              +
            </button>
          </div>
        </div>

        {/* Budget Slider */}
        <div>
          <label className="block text-lg font-medium mb-2 text-gray-700">
            Estimated Budget (INR)
          </label>
          <div className="space-y-3">
            <div className="text-center text-xl font-semibold text-blue-700">
              ₹{budget.toLocaleString()}
            </div>
            <Slider // Make sure Slider component is imported and works
              defaultValue={[budget]}
              min={10000}
              max={200000}
              step={5000}
              onValueChange={(value) => setBudget(value[0])}
              className="w-full" // Ensure slider takes width
            />
            <div className="flex justify-between text-xs text-gray-500 px-1">
              <span>₹10,000</span>
              <span>₹200,000</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || interests.length === 0 || !travelMonth}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed transition duration-200"
        >
          {loading ? "Generating Plan..." : "Create My Itinerary"}
        </button>
      </form>

      {/* Optional: Display local error message if needed */}
      {/* {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded border border-red-200 text-sm">
                {error}
            </div>
        )} */}
    </div>
  );
}
