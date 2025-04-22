"use client";

import type React from "react";
import { useEffect, useState } from "react";

import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  Clock,
  IndianRupeeIcon,
  Heart,
  MapPin,
  Printer,
  Star,
  Trash2,
  Umbrella,
  Info, // Added for info icon
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added AlertTitle
import { toast } from "@/hooks/use-toast";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supbase/client"; // Keep for auth operations like logout
import { SavedItineraryEntry } from "@/actions/savedItineraryActions";
import {
  callCreateItineraryRpc,
  callDeleteSavedItineraryRpc,
  callFetchSavedItinerariesRpc,
  callSaveItineraryRpc,
} from "@/actions/itineraryRpcActions";

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

// Define types for the generated itinerary result
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

// Type for the result from the create itinerary RPC call
type ItineraryResult = {
  success: boolean;
  message?: string;
  itinerary?: {
    [interest: string]: ItineraryCity[];
  };
};

// Use the imported type for SavedItinerary
type SavedItinerary = SavedItineraryEntry;

// Helper function to create daily plans
const generateDailyPlans = (
  cityData: ItineraryCity,
  tripDuration: number
): Array<{ day: number; activities: any[] }> => {
  if (!cityData) return []; // Add guard clause

  const { popular_destinations = [], hotels = [] } = cityData; // Default to empty arrays

  // Try to get the best hotel
  const selectedHotel =
    hotels && hotels.length > 0
      ? [...hotels].sort((a, b) => b.Hotel_Rating - a.Hotel_Rating)[0] // Create copy before sort
      : null;

  // Split destinations into days (max 3 per day)
  const destinationsPerDay = 3;
  const days: Array<{ day: number; activities: any[] }> = [];

  // Calculate total number of days needed based on destinations
  const totalDaysNeeded =
    popular_destinations.length > 0
      ? Math.ceil(popular_destinations.length / destinationsPerDay)
      : 0; // Handle case with no destinations

  // Use the greater of the user's requested duration or the minimum days needed for destinations
  const actualTripDuration = Math.max(
    tripDuration > 0 ? tripDuration : 1,
    totalDaysNeeded
  ); // Ensure duration is at least 1

  for (let dayIndex = 0; dayIndex < actualTripDuration; dayIndex++) {
    const dayNumber = dayIndex + 1;
    const startDestIndex = dayIndex * destinationsPerDay;
    // Ensure we don't go out of bounds for popular_destinations
    const dailyDestinations = popular_destinations.slice(
      startDestIndex,
      startDestIndex + destinationsPerDay
    );
    const dailyActivities = [];

    // First day: Arrival & Check-in
    if (dayNumber === 1) {
      dailyActivities.push({
        time: "Morning",
        activity: "Arrive in " + cityData.city,
        description: "Welcome to " + cityData.city + "!",
      });
      dailyActivities.push({
        time: "Afternoon",
        activity: selectedHotel
          ? `Check-in at ${selectedHotel.Hotel_name}`
          : `Check-in at your hotel`,
        description: selectedHotel
          ? `Get settled at ${selectedHotel.Hotel_name} (${selectedHotel.Hotel_Rating}★) located in ${selectedHotel.City}.`
          : "Get settled at your hotel and prepare for your adventure.",
      });
      // Add destinations for the first day
      dailyDestinations.forEach((dest, index) => {
        dailyActivities.push({
          time: index === 0 ? "Evening" : "Night", // Adjust time
          activity: dest.name,
          description: `Visit this ${dest.interest.join(
            ", "
          )} attraction (${dest.google_rating.toFixed(1)}★)`,
          price:
            dest.price_fare > 0
              ? `₹${dest.price_fare.toFixed(0)}`
              : "Free entry",
        });
      });
    }
    // Last day: Check-out & Departure
    else if (dayNumber === actualTripDuration) {
      // Add destinations first for the last day
      dailyDestinations.forEach((dest, index) => {
        dailyActivities.push({
          time: index === 0 ? "Morning" : index === 1 ? "Afternoon" : "Evening", // Adjust time
          activity: dest.name,
          description: `Visit this ${dest.interest.join(
            ", "
          )} attraction (${dest.google_rating.toFixed(1)}★)`,
          price:
            dest.price_fare > 0
              ? `₹${dest.price_fare.toFixed(0)}`
              : "Free entry",
        });
      });
      dailyActivities.push({
        time: "Late Afternoon", // Check-out usually before evening
        activity: selectedHotel
          ? `Check-out from ${selectedHotel.Hotel_name}`
          : "Check-out from your hotel",
        description: "Pack your belongings and prepare for departure.",
      });
      dailyActivities.push({
        time: "Night",
        activity: "Departure from " + cityData.city,
        description: "Farewell to " + cityData.city + "!",
      });
    }
    // Intermediate days
    else {
      dailyDestinations.forEach((dest, index) => {
        dailyActivities.push({
          time: index === 0 ? "Morning" : index === 1 ? "Afternoon" : "Evening", // Adjust time
          activity: dest.name,
          description: `Visit this ${dest.interest.join(
            ", "
          )} attraction (${dest.google_rating.toFixed(1)}★)`,
          price:
            dest.price_fare > 0
              ? `₹${dest.price_fare.toFixed(0)}`
              : "Free entry",
        });
      });
    }

    // If a day has no activities planned (e.g., duration > destinations needed)
    if (dailyActivities.length === 0) {
      dailyActivities.push({
        time: "Day",
        activity: "Explore " + cityData.city + " at your leisure",
        description:
          "Enjoy free time to discover local gems, revisit favorites, or relax.",
      });
    }

    days.push({ day: dayNumber, activities: dailyActivities });
  }
  return days;
};

export function ItineraryGenerator() {
  const [loading, setLoading] = useState(false); // General loading (e.g., logout)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [travelMonth, setTravelMonth] = useState("");
  const [budget, setBudget] = useState<string>(""); // Store as string for input flexibility
  const [isLoading, setIsLoading] = useState(false); // Loading state for itinerary generation
  const [result, setResult] = useState<ItineraryResult | null>(null);
  const [error, setError] = useState("");
  const [tripDuration, setTripDuration] = useState("3"); // Default trip duration string
  const [selectedCityIndex, setSelectedCityIndex] = useState<number | null>(
    null
  );
  const [selectedInterestKey, setSelectedInterestKey] = useState<string | null>(
    null
  );
  const [showCustomBudget, setShowCustomBudget] = useState(false);
  const [activeTab, setActiveTab] = useState("form");
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerary[]>(
    []
  );
  const [selectedSavedItinerary, setSelectedSavedItinerary] =
    useState<SavedItinerary | null>(null);
  const [isSavedLoading, setIsSavedLoading] = useState(false); // Loading state for saved itineraries (fetch, save, delete)

  // Fetch saved itineraries on mount
  useEffect(() => {
    const fetchItineraries = async () => {
      setIsSavedLoading(true);
      const response = await callFetchSavedItinerariesRpc(); // Use RPC call wrapper
      if (response.success && response.data) {
        // Sort by date descending (newest first) - assuming 'date' can be parsed
        const sortedData = response.data.sort((a, b) => {
          try {
            // Assuming date is stored like "MM/DD/YYYY" or similar parseable format
            // Or use the 'id' (timestamp) for sorting if date format is unreliable
            return parseInt(b.id, 10) - parseInt(a.id, 10);
            // return new Date(b.date).getTime() - new Date(a.date).getTime();
          } catch {
            return 0; // Fallback if date parsing fails
          }
        });
        //@ts-ignore
        setSavedItineraries(sortedData);
      } else {
        console.error("Failed to fetch saved itineraries:", response.message);
        toast({
          title: "Error loading saved trips",
          description: response.message || "Could not load your saved trips.",
          variant: "destructive",
        });
        setSavedItineraries([]);
      }
      setIsSavedLoading(false);
    };
    fetchItineraries();
  }, []); // Empty dependency array means run once on mount

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  // Handle form submission to generate itinerary
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setResult(null);
    setSelectedCityIndex(null);
    setSelectedInterestKey(null);
    setSelectedSavedItinerary(null); // Clear selected saved trip when generating new

    try {
      const parsedBudget = budget ? Number.parseInt(budget) : undefined;
      // Use the RPC call wrapper action
      const response = await callCreateItineraryRpc({
        interests: selectedInterests,
        travelMonth,
        budget: parsedBudget,
      });

      if (response.success) {
        //@ts-ignore
        setResult(response);
        setActiveTab("results");
        if (response.itinerary && Object.keys(response.itinerary).length > 0) {
          const firstInterest = Object.keys(response.itinerary)[0];
          setSelectedInterestKey(firstInterest);
          setSelectedCityIndex(0);
        } else {
          setActiveTab("results"); // Show empty state on results tab
        }
      } else {
        setError(response.message || "Failed to create itinerary");
        setActiveTab("form"); // Stay on form if error
      }
    } catch (err) {
      console.error("Submit failed:", err);
      setError("An unexpected error occurred: " + (err as Error).message);
      setActiveTab("form"); // Stay on form if error
    } finally {
      setIsLoading(false);
    }
  };

  // Get the currently selected city data from generated results
  const selectedCity =
    selectedInterestKey &&
    selectedCityIndex !== null &&
    result?.itinerary?.[selectedInterestKey]?.[selectedCityIndex]
      ? result.itinerary[selectedInterestKey][selectedCityIndex]
      : null;

  // Generate daily plans for the selected generated city
  const dailyPlans = selectedCity
    ? generateDailyPlans(selectedCity, Number.parseInt(tripDuration, 10) || 1) // Ensure duration is at least 1
    : [];

  // Generate daily plans for the selected saved itinerary
  const savedItineraryDailyPlans = selectedSavedItinerary
    ? generateDailyPlans(
        selectedSavedItinerary.cityData,
        Number.parseInt(selectedSavedItinerary.duration, 10) || 1 // Ensure duration is at least 1
      )
    : [];

  // Save the currently displayed generated itinerary
  const saveItinerary = async () => {
    if (
      !selectedCity ||
      !selectedInterestKey ||
      !tripDuration ||
      !travelMonth
    ) {
      toast({
        title: "Cannot Save",
        description: "Please generate and select an itinerary first.",
        variant: "destructive",
      });
      return;
    }

    // Check if already saved (simple check based on city and month)
    const alreadyExists = savedItineraries.some(
      (si) =>
        si.city === selectedCity.city &&
        si.month === travelMonth &&
        si.duration === tripDuration
    );
    if (alreadyExists) {
      toast({
        title: "Already Saved",
        description:
          "An itinerary for this city, month, and duration seems to already be saved.",
        variant: "default",
      });
      return; // Don't save duplicates
    }

    setIsSavedLoading(true); // Indicate loading state

    const newSavedItinerary: SavedItinerary = {
      id: Date.now().toString(), // Client-generated ID
      date: new Date().toISOString(), // Use ISO string for better sorting/parsing
      city: selectedCity.city,
      // Save the interests used to *generate* this specific result
      interests: [selectedInterestKey], // Or use `selectedInterests` if you want all form interests
      month: travelMonth,
      duration: tripDuration,
      budget: budget || "No limit", // Save budget used for generation
      estimatedCost:
        selectedCity.estimated_daily_cost *
        (Number.parseInt(tripDuration, 10) || 1),
      cityData: selectedCity,
    };

    // Use the RPC call wrapper action
    const response = await callSaveItineraryRpc(newSavedItinerary);

    if (response.success) {
      // Add optimistically first for responsiveness
      setSavedItineraries((prev) =>
        [newSavedItinerary, ...prev].sort(
          (a, b) => parseInt(b.id, 10) - parseInt(a.id, 10)
        )
      );

      toast({
        title: "Itinerary Saved",
        description:
          response.message ||
          `Your trip to ${selectedCity.city} has been saved.`,
        variant: "default",
      });
      // Optionally switch to saved tab
      // setActiveTab("saved");
      // setSelectedSavedItinerary(newSavedItinerary);

      // Re-fetch in the background to ensure consistency (optional, but good practice)
      callFetchSavedItinerariesRpc().then((fetchResponse) => {
        if (fetchResponse.success && fetchResponse.data) {
          const sortedData = fetchResponse.data.sort(
            (a, b) => parseInt(b.id, 10) - parseInt(a.id, 10)
          );
          //@ts-ignore
          setSavedItineraries(sortedData);
        }
        // No need to show error here if background fetch fails, already saved optimistically
      });
    } else {
      toast({
        title: "Save Failed",
        description: response.message || "Could not save your itinerary.",
        variant: "destructive",
      });
    }
    setIsSavedLoading(false); // Clear loading state
  };

  // Delete a saved itinerary
  const deleteSavedItinerary = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click when delete button is clicked
    setIsSavedLoading(true);

    // Optimistically remove from UI
    const previousItineraries = [...savedItineraries];
    setSavedItineraries((prev) => prev.filter((item) => item.id !== id));
    if (selectedSavedItinerary?.id === id) {
      setSelectedSavedItinerary(null); // Clear selection if deleted item was selected
    }

    // Use the RPC call wrapper action
    const response = await callDeleteSavedItineraryRpc(id);

    if (response.success) {
      toast({
        title: "Itinerary Deleted",
        description:
          response.message || "The saved itinerary has been removed.",
        variant: "default",
      });
      // Confirm optimistic removal, no state change needed
    } else {
      // Revert optimistic removal on failure
      setSavedItineraries(previousItineraries);
      toast({
        title: "Deletion Failed",
        description:
          response.message || "Could not delete the saved itinerary.",
        variant: "destructive",
      });
    }
    setIsSavedLoading(false);
  };

  // Handle user logout
  const handleLogout = async () => {
    setLoading(true);
    const supabase = createClient(); // Use client instance for auth
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      redirect("/login"); // Redirect on successful logout
    }
  };

  // Check if the currently displayed generated itinerary is already saved
  const isCurrentGeneratedItinerarySaved =
    selectedCity &&
    savedItineraries.some(
      (si) =>
        si.city === selectedCity.city &&
        si.month === travelMonth &&
        si.duration === tripDuration &&
        si.interests.includes(selectedInterestKey || "")
    );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex justify-end mb-4">
        <Button
          onClick={handleLogout}
          disabled={loading || isSavedLoading} // Disable during any loading
          variant="outline"
          size="sm"
          className="text-blue-700 border-blue-500 hover:bg-blue-50"
        >
          Log out
        </Button>
      </div>

      <Card className="border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-t-lg">
          <CardTitle className="text-3xl font-bold">
            Discover Your Perfect Journey
          </CardTitle>
          <CardDescription className="text-blue-50 text-lg">
            Create a personalized travel itinerary based on your interests and
            preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            {/* Tab List */}
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3 mb-0 -mb-px">
                {" "}
                {/* Adjusted margin */}
                <TabsTrigger
                  value="form"
                  className="text-base data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-none"
                >
                  Plan Your Trip
                </TabsTrigger>
                <TabsTrigger
                  value="results"
                  className="text-base data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-none"
                  disabled={!result?.success} // Only enable if generation was successful
                >
                  Your Itinerary
                </TabsTrigger>
                <TabsTrigger
                  value="saved"
                  className="text-base data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-none"
                >
                  Saved Trips ({savedItineraries.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Form Tab */}
            <TabsContent value="form" className="px-6 pb-6 pt-8 space-y-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Interests */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose-500" />
                    <h2 className="text-xl font-semibold">Travel Interests</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {INTEREST_CATEGORIES.map((interest) => (
                      <div
                        key={interest}
                        onClick={() => handleInterestToggle(interest)}
                        className={` flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedInterests.includes(interest)
                            ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        } `}
                      >
                        <input
                          type="checkbox"
                          checked={selectedInterests.includes(interest)}
                          readOnly // Click handled by div
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 pointer-events-none"
                        />
                        <span className="text-sm font-medium select-none">
                          {interest}
                        </span>
                      </div>
                    ))}
                  </div>
                  {selectedInterests.length === 0 && (
                    <p className="text-rose-500 text-sm">
                      Please select at least one interest
                    </p>
                  )}
                </div>

                {/* Month, Duration & Budget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Month */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <h2 className="text-xl font-semibold">
                        {" "}
                        When Are You Traveling?{" "}
                      </h2>
                    </div>
                    <select
                      value={travelMonth}
                      onChange={(e) => setTravelMonth(e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
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
                  {/* Duration */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <h2 className="text-xl font-semibold">Trip Duration</h2>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="range"
                        min="1"
                        max="14"
                        value={tripDuration}
                        onChange={(e) => setTripDuration(e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <span className="ml-4 text-lg font-medium min-w-[4rem] text-center">
                        {tripDuration}{" "}
                        {Number.parseInt(tripDuration) === 1 ? "day" : "days"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Budget */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <IndianRupeeIcon className="h-5 w-5 text-blue-500" />
                    <h2 className="text-xl font-semibold">
                      Daily Budget (Optional)
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    {/* No Limit Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setBudget("");
                        setShowCustomBudget(false);
                      }}
                      className={`p-4 rounded-lg transition-all text-center ${
                        budget === "" && !showCustomBudget
                          ? "bg-blue-100 border-2 border-blue-500 text-blue-700 font-medium ring-1 ring-blue-500"
                          : "border-2 border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      No limit
                    </button>
                    {/* Preset Budget Buttons */}
                    {[3000, 5000, 10000, 20000].map((presetBudget) => (
                      <button
                        key={presetBudget}
                        type="button"
                        onClick={() => {
                          setBudget(presetBudget.toString());
                          setShowCustomBudget(false);
                        }}
                        className={`p-4 rounded-lg transition-all text-center ${
                          budget === presetBudget.toString() &&
                          !showCustomBudget
                            ? "bg-blue-100 border-2 border-blue-500 text-blue-700 font-medium ring-1 ring-blue-500"
                            : "border-2 border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-medium">
                          {presetBudget <= 3000
                            ? "Budget"
                            : presetBudget <= 5000
                            ? "Mid-range"
                            : presetBudget <= 10000
                            ? "Luxury"
                            : "Ultra Luxury"}
                        </div>
                        <div className="text-sm text-gray-600">
                          ₹{presetBudget.toLocaleString("en-IN")}/day
                        </div>
                      </button>
                    ))}
                  </div>
                  {/* Custom Budget Input */}
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomBudget(!showCustomBudget);
                        if (!showCustomBudget) setBudget(""); // Clear budget when opening custom
                      }}
                      className={`p-3 rounded-lg transition-all w-full md:w-auto text-center ${
                        showCustomBudget
                          ? "bg-blue-100 border-2 border-blue-500 text-blue-700 font-medium ring-1 ring-blue-500"
                          : "border-2 border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      Set Custom Budget
                    </button>
                    {showCustomBudget && (
                      <div className="flex items-center mt-3 p-3 border-2 border-gray-200 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                        <span className="text-xl mr-2 text-gray-500">₹</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="Enter your daily budget"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          className="flex-grow p-1 focus:outline-none appearance-none"
                          style={{ MozAppearance: "textfield" }} // Hide arrows Firefox
                        />
                        <span className="ml-2 text-gray-500">per day</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    selectedInterests.length === 0 ||
                    !travelMonth ||
                    isSavedLoading
                  }
                  className="w-full py-6 text-lg bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-all duration-300 disabled:opacity-60"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Creating Your Perfect Itinerary...</span>
                    </div>
                  ) : (
                    "Create My Itinerary"
                  )}
                </Button>
              </form>
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-6 bg-gray-50/50">
              {result && result.success && (
                <div>
                  {!result.itinerary ||
                  Object.keys(result.itinerary).length === 0 ? (
                    // Empty State for No Results
                    <div className="p-6">
                      <Alert
                        variant="destructive"
                        className="bg-amber-50 border-amber-200 text-amber-800"
                      >
                        <Umbrella className="h-5 w-5 !text-amber-600" />{" "}
                        {/* Use ! to force color */}
                        <AlertTitle>No Destinations Found</AlertTitle>
                        <AlertDescription>
                          We couldn't find any destinations matching your
                          criteria. Try adjusting your interests, travel month,
                          or budget.
                          <Button
                            onClick={() => setActiveTab("form")}
                            variant="outline"
                            size="sm"
                            className="mt-3 border-amber-500 text-amber-700 hover:bg-amber-100"
                          >
                            Modify Your Search
                          </Button>
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    // Results Display Grid
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 min-h-[calc(100vh-200px)]">
                      {" "}
                      {/* Added min-h */}
                      {/* Left sidebar - Destinations List */}
                      <div className="md:col-span-1 border-r bg-white">
                        <div className="p-4 bg-gray-50 border-b sticky top-0 z-10">
                          {" "}
                          {/* Sticky header */}
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            Suggested Destinations
                          </h3>
                        </div>
                        <ScrollArea className="h-[calc(100vh-260px)]">
                          {" "}
                          {/* Adjusted height */}
                          <div className="p-4">
                            {Object.entries(result.itinerary).map(
                              ([interest, cities]) => (
                                <div key={interest} className="mb-6">
                                  <h4 className="text-sm font-medium bg-blue-50 p-2 rounded-md text-blue-700 mb-2 sticky top-0">
                                    {" "}
                                    {/* Sticky interest header */}
                                    {interest}
                                  </h4>
                                  <div className="space-y-2">
                                    {cities.map((city, idx) => (
                                      <button
                                        key={idx}
                                        className={`w-full text-left p-3 rounded-md transition-all ${
                                          selectedInterestKey === interest &&
                                          selectedCityIndex === idx
                                            ? "bg-blue-100 border-l-4 border-blue-500"
                                            : "hover:bg-gray-50 border-l-4 border-transparent"
                                        }`}
                                        onClick={() => {
                                          setSelectedInterestKey(interest);
                                          setSelectedCityIndex(idx);
                                        }}
                                      >
                                        <div className="font-medium">
                                          {city.city}{" "}
                                          {city.state ? `, ${city.state}` : ""}
                                        </div>
                                        <div className="flex items-center flex-wrap gap-2 mt-1">
                                          {" "}
                                          {/* Added flex-wrap */}
                                          <Badge
                                            variant="outline"
                                            className="bg-amber-50 text-amber-700 border-amber-200"
                                          >
                                            <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                                            {city.rating}
                                          </Badge>
                                          <Badge
                                            variant="outline"
                                            className="bg-blue-50 text-blue-700 border-blue-200"
                                          >
                                            <IndianRupeeIcon className="h-3 w-3 mr-1 text-blue-500" />
                                            {city.estimated_daily_cost}/day
                                          </Badge>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                      {/* Right content - Selected Destination Detail */}
                      <div className="md:col-span-2 p-6">
                        {selectedCity ? (
                          <div className="space-y-6">
                            {/* City Header & Actions */}
                            <div className="space-y-4">
                              <div className="flex justify-between items-start gap-4">
                                {" "}
                                {/* Added gap */}
                                <h2 className="text-2xl font-bold text-blue-800">
                                  {selectedCity.city}
                                  {selectedCity.state
                                    ? `, ${selectedCity.state}`
                                    : ""}
                                </h2>
                                <div className="flex gap-2 flex-shrink-0">
                                  {" "}
                                  {/* Added flex-shrink-0 */}
                                  <Button
                                    onClick={saveItinerary}
                                    variant="outline"
                                    size="sm"
                                    className={`flex items-center gap-1 ${
                                      isCurrentGeneratedItinerarySaved
                                        ? "border-green-500 text-green-700 hover:bg-green-50"
                                        : "border-gray-300 hover:bg-gray-50"
                                    }`}
                                    disabled={
                                      isLoading ??
                                      isSavedLoading ??
                                      isCurrentGeneratedItinerarySaved
                                    } // Disable while loading or if already saved
                                  >
                                    {isCurrentGeneratedItinerarySaved ? (
                                      <BookmarkCheck className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Bookmark className="h-4 w-4" />
                                    )}
                                    <span>
                                      {isCurrentGeneratedItinerarySaved
                                        ? "Saved"
                                        : "Save"}
                                    </span>
                                  </Button>
                                  <Button
                                    onClick={() => window.print()}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1 border-gray-300 hover:bg-gray-50"
                                  >
                                    <Printer className="h-4 w-4" />
                                    <span>Print</span>
                                  </Button>
                                </div>
                              </div>
                              <p className="text-gray-600 leading-relaxed">
                                {selectedCity.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none">
                                  <Star className="h-3.5 w-3.5 mr-1 fill-amber-500 text-amber-500" />
                                  Rating: {selectedCity.rating}
                                </Badge>
                                <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 border-none">
                                  <Calendar className="h-3.5 w-3.5 mr-1 text-sky-500" />
                                  Best time:{" "}
                                  {selectedCity.best_time_to_visit
                                    .join(", ")
                                    .replaceAll('"', "")
                                    .replaceAll("[", "")
                                    .replaceAll("]", "")}
                                </Badge>
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">
                                  <IndianRupeeIcon className="h-3.5 w-3.5 mr-1 text-blue-500" />
                                  Est. Daily Cost: ₹
                                  {selectedCity.estimated_daily_cost.toLocaleString(
                                    "en-IN"
                                  )}
                                </Badge>
                              </div>
                            </div>
                            <Separator />

                            {/* Hotels */}
                            {selectedCity.hotels &&
                              selectedCity.hotels.length > 0 && (
                                <div>
                                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-rose-500" />
                                    Recommended Accommodation
                                  </h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {selectedCity.hotels
                                      .slice(0, 3) // Show top 3
                                      .map((hotel, i) => (
                                        <Card
                                          key={i}
                                          className="overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                        >
                                          {/* Placeholder for image or initial */}
                                          <div className="h-24 bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                                            <span className="text-white text-3xl font-bold opacity-80">
                                              {hotel.Hotel_name.charAt(
                                                0
                                              ).toUpperCase()}
                                            </span>
                                          </div>
                                          <CardContent className="p-4">
                                            <div
                                              className="font-semibold truncate"
                                              title={hotel.Hotel_name}
                                            >
                                              {hotel.Hotel_name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                              {hotel.City}
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                              <div className="flex items-center">
                                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                                <span className="ml-1 text-sm text-amber-700">
                                                  {hotel.Hotel_Rating.toFixed(
                                                    1
                                                  )}
                                                </span>
                                              </div>
                                              <div className="font-medium text-sm text-blue-700">
                                                ₹
                                                {hotel.Hotel_price.toLocaleString(
                                                  "en-IN"
                                                )}
                                                /night
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                  </div>
                                  {selectedCity.hotels.length === 0 && (
                                    <p className="text-sm text-gray-500">
                                      No specific hotel recommendations found
                                      matching the budget (if provided).
                                    </p>
                                  )}
                                </div>
                              )}
                            <Separator />

                            {/* Day-by-day Itinerary */}
                            <div>
                              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                Day-by-Day Itinerary ({tripDuration} days)
                              </h3>
                              <div className="space-y-6">
                                {dailyPlans.map((day) => (
                                  <Card
                                    key={day.day}
                                    className="overflow-hidden shadow-sm"
                                  >
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 py-3 px-4 border-b">
                                      <CardTitle className="text-lg">
                                        Day {day.day}
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                      <div className="divide-y">
                                        {day.activities.map((act, idx) => (
                                          <div
                                            key={idx}
                                            className="p-4 hover:bg-gray-50/50 transition-colors"
                                          >
                                            <div className="flex items-start gap-3">
                                              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium min-w-[5rem] text-center mt-1">
                                                {act.time}
                                              </div>
                                              <div className="flex-1">
                                                <div className="font-medium">
                                                  {act.activity}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                  {act.description}
                                                </div>
                                                {act.price && (
                                                  <div className="text-sm text-blue-600 mt-1 font-medium">
                                                    {act.price}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>

                            {/* Budget Summary */}
                            <Card className="bg-blue-50 border-blue-200">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                                  <IndianRupeeIcon className="h-4 w-4 text-blue-600" />
                                  Budget Summary
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3 text-sm">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-700">
                                      Accommodation (Avg. Top Rated):
                                    </span>
                                    <span className="font-medium text-blue-700">
                                      ₹
                                      {selectedCity.hotels &&
                                      selectedCity.hotels.length > 0
                                        ? (
                                            selectedCity.hotels
                                              .slice(0, 3)
                                              .reduce(
                                                (sum, h) => sum + h.Hotel_price,
                                                0
                                              ) /
                                            Math.min(
                                              selectedCity.hotels.length,
                                              3
                                            )
                                          ).toLocaleString("en-IN", {
                                            maximumFractionDigits: 0,
                                          })
                                        : "N/A"}{" "}
                                      / night
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-700">
                                      Average Attraction Entry:
                                    </span>
                                    <span className="font-medium text-blue-700">
                                      ₹
                                      {(selectedCity.popular_destinations &&
                                      selectedCity.popular_destinations.length >
                                        0
                                        ? selectedCity.popular_destinations.reduce(
                                            (sum, d) => sum + d.price_fare,
                                            0
                                          ) /
                                          selectedCity.popular_destinations
                                            .length
                                        : 0
                                      ).toLocaleString("en-IN", {
                                        maximumFractionDigits: 0,
                                      })}
                                    </span>
                                  </div>
                                  <Separator className="bg-blue-200" />
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-blue-800">
                                      Total Estimated Daily Cost:
                                    </span>
                                    <span className="font-semibold text-blue-800">
                                      ₹
                                      {selectedCity.estimated_daily_cost.toLocaleString(
                                        "en-IN"
                                      )}
                                    </span>
                                  </div>
                                  <Separator className="bg-blue-200" />
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-blue-800">
                                      Total Estimated Trip Cost ({tripDuration}{" "}
                                      days):
                                    </span>
                                    <span className="font-bold text-lg text-blue-800">
                                      ₹
                                      {(
                                        selectedCity.estimated_daily_cost *
                                        (Number.parseInt(tripDuration, 10) || 1)
                                      ).toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ) : (
                          // Placeholder when no destination is selected
                          <div className="flex h-[calc(100vh-260px)] items-center justify-center text-gray-500 p-8 border rounded-lg bg-white shadow-sm">
                            <div className="text-center">
                              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                              <p className="text-lg">
                                Select a destination from the left to view your
                                personalized itinerary
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Saved Trips Tab */}
            <TabsContent value="saved" className="p-0 bg-gray-50/50">
              {isSavedLoading && savedItineraries.length === 0 ? ( // Show loading only if list is initially empty
                // Loading State
                <div className="flex h-[calc(100vh-200px)] items-center justify-center text-gray-500 p-8">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-lg">Loading saved trips...</p>
                  </div>
                </div>
              ) : !isSavedLoading && savedItineraries.length === 0 ? (
                // Empty State for No Saved Trips
                <div className="p-6">
                  <Alert className="bg-blue-50 border-blue-200">
                    <BookmarkCheck className="h-5 w-5 !text-blue-600" />{" "}
                    {/* Use ! to force color */}
                    <AlertTitle>No Saved Trips Yet</AlertTitle>
                    <AlertDescription>
                      You haven't saved any itineraries. Plan a trip and click
                      the 'Save' button to keep it here.
                      <Button
                        onClick={() => setActiveTab("form")}
                        variant="link"
                        className="p-0 h-auto ml-1 text-blue-600 hover:underline"
                      >
                        Plan a new trip
                      </Button>
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                // Saved Trips Display Grid
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 min-h-[calc(100vh-200px)]">
                  {" "}
                  {/* Added min-h */}
                  {/* Left sidebar - Saved Itineraries List */}
                  <div className="md:col-span-1 border-r bg-white">
                    <div className="p-4 bg-gray-50 border-b sticky top-0 z-10">
                      {" "}
                      {/* Sticky header */}
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <BookmarkCheck className="h-4 w-4 text-blue-500" />
                        Your Saved Trips
                      </h3>
                    </div>
                    <ScrollArea className="h-[calc(100vh-260px)]">
                      {" "}
                      {/* Adjusted height */}
                      <div className="p-4 space-y-3">
                        {savedItineraries.map((itinerary) => (
                          <div
                            key={itinerary.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all relative group ${
                              // Added relative and group
                              selectedSavedItinerary?.id === itinerary.id
                                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                                : "hover:border-blue-300 hover:bg-gray-50"
                            }`}
                            onClick={() => setSelectedSavedItinerary(itinerary)}
                          >
                            {/* Delete Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity" // Show on hover
                              onClick={(e) =>
                                deleteSavedItinerary(itinerary.id, e)
                              }
                              disabled={isSavedLoading} // Disable while loading
                              aria-label="Delete saved itinerary"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>

                            {/* Itinerary Info */}
                            <div className="font-semibold text-lg mb-1 pr-8">
                              {" "}
                              {/* Added padding-right */}
                              {itinerary.city}
                            </div>
                            <div className="text-xs text-gray-500 mb-2">
                              Saved on:{" "}
                              {new Date(itinerary.date).toLocaleDateString()}{" "}
                              {/* Format date */}
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm">
                              <Badge
                                variant="secondary"
                                className="font-normal"
                              >
                                <Calendar className="h-3 w-3 mr-1" />{" "}
                                {itinerary.month}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="font-normal"
                              >
                                <Clock className="h-3 w-3 mr-1" />{" "}
                                {itinerary.duration}{" "}
                                {Number(itinerary.duration) === 1
                                  ? "day"
                                  : "days"}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="font-normal"
                              >
                                <IndianRupeeIcon className="h-3 w-3 mr-1" />
                                {itinerary.budget === "No limit"
                                  ? "No limit"
                                  : `~₹${Number(
                                      itinerary.budget
                                    ).toLocaleString("en-IN")}/day`}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              Est. Total Cost: ₹
                              {itinerary.estimatedCost.toLocaleString("en-IN")}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  {/* Right content - Selected Saved Itinerary Detail */}
                  <div className="md:col-span-2 p-6">
                    {selectedSavedItinerary ? (
                      <div className="space-y-6">
                        {/* Saved Itinerary Header & Info */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <h2 className="text-2xl font-bold text-blue-800">
                              {selectedSavedItinerary.city}
                              {selectedSavedItinerary.cityData.state
                                ? `, ${selectedSavedItinerary.cityData.state}`
                                : ""}
                            </h2>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                onClick={() => window.print()} // Simple print for saved view
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1 border-gray-300 hover:bg-gray-50"
                              >
                                <Printer className="h-4 w-4" />
                                <span>Print</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1 border-red-300 text-red-600 hover:bg-red-50"
                                onClick={(e) =>
                                  deleteSavedItinerary(
                                    selectedSavedItinerary.id,
                                    e
                                  )
                                }
                                disabled={isSavedLoading}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete</span>
                              </Button>
                            </div>
                          </div>
                          {/* Display saved trip parameters */}
                          <Card className="bg-gray-50 border-gray-200">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="text-gray-500 mb-1">
                                    Saved Date
                                  </div>
                                  <div className="font-medium">
                                    {new Date(
                                      selectedSavedItinerary.date
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500 mb-1">
                                    Travel Month
                                  </div>
                                  <div className="font-medium">
                                    {selectedSavedItinerary.month}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500 mb-1">
                                    Duration
                                  </div>
                                  <div className="font-medium">
                                    {selectedSavedItinerary.duration}{" "}
                                    {Number(selectedSavedItinerary.duration) ===
                                    1
                                      ? "day"
                                      : "days"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500 mb-1">
                                    Daily Budget
                                  </div>
                                  <div className="font-medium">
                                    {selectedSavedItinerary.budget ===
                                    "No limit"
                                      ? "No limit"
                                      : `₹${Number(
                                          selectedSavedItinerary.budget
                                        ).toLocaleString("en-IN")}`}
                                  </div>
                                </div>
                                <div className="col-span-2 sm:col-span-4">
                                  <div className="text-gray-500 mb-1">
                                    Interests
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {selectedSavedItinerary.interests.map(
                                      (interest) => (
                                        <Badge
                                          key={interest}
                                          variant="outline"
                                          className="font-normal bg-white"
                                        >
                                          {interest}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <p className="text-gray-600 leading-relaxed">
                            {selectedSavedItinerary.cityData.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none">
                              <Star className="h-3.5 w-3.5 mr-1 fill-amber-500 text-amber-500" />
                              Rating: {selectedSavedItinerary.cityData.rating}
                            </Badge>
                            <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 border-none">
                              <Calendar className="h-3.5 w-3.5 mr-1 text-sky-500" />
                              Best time:{" "}
                              {selectedSavedItinerary.cityData.best_time_to_visit
                                .join(", ")
                                .replaceAll('"', "")
                                .replaceAll("[", "")
                                .replaceAll("]", "")}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">
                              <IndianRupeeIcon className="h-3.5 w-3.5 mr-1 text-blue-500" />
                              Est. Daily Cost: ₹
                              {selectedSavedItinerary.cityData.estimated_daily_cost.toLocaleString(
                                "en-IN"
                              )}
                            </Badge>
                          </div>
                        </div>
                        <Separator />

                        {/* Day-by-day Itinerary for Saved Trip */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            Saved Day-by-Day Itinerary (
                            {selectedSavedItinerary.duration} days)
                          </h3>
                          <div className="space-y-6">
                            {savedItineraryDailyPlans.map((day) => (
                              <Card
                                key={day.day}
                                className="overflow-hidden shadow-sm"
                              >
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 py-3 px-4 border-b">
                                  <CardTitle className="text-lg">
                                    Day {day.day}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                  <div className="divide-y">
                                    {day.activities.map((act, idx) => (
                                      <div
                                        key={idx}
                                        className="p-4 hover:bg-gray-50/50 transition-colors"
                                      >
                                        <div className="flex items-start gap-3">
                                          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium min-w-[5rem] text-center mt-1">
                                            {act.time}
                                          </div>
                                          <div className="flex-1">
                                            <div className="font-medium">
                                              {act.activity}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                              {act.description}
                                            </div>
                                            {act.price && (
                                              <div className="text-sm text-blue-600 mt-1 font-medium">
                                                {act.price}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Total Estimated Cost */}
                        <Card className="bg-green-50 border-green-200">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                              <Info className="h-4 w-4 text-green-600" />
                              Saved Trip Estimated Cost
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-green-800">
                                Total Estimated Trip Cost (
                                {selectedSavedItinerary.duration} days):
                              </span>
                              <span className="font-bold text-xl text-green-800">
                                ₹
                                {selectedSavedItinerary.estimatedCost.toLocaleString(
                                  "en-IN"
                                )}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                              This cost was estimated when the itinerary was
                              generated and saved.
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      // Placeholder when no saved itinerary is selected
                      <div className="flex h-[calc(100vh-260px)] items-center justify-center text-gray-500 p-8 border rounded-lg bg-white shadow-sm">
                        <div className="text-center">
                          <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-lg">
                            Select a saved trip from the left to view its
                            details.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
