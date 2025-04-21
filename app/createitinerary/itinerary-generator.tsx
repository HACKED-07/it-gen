"use client";

import type React from "react";

import { useEffect, useState } from "react";
// Import your new server actions
import {
  saveItineraryAction,
  fetchSavedItinerariesAction,
  deleteSavedItineraryAction,
  SavedItineraryEntry, // Import the type
} from "@/actions/savedItineraryActions"; // Assuming you saved them here

// You still need createItinerary for generating the *new* itinerary
import { createItinerary } from "@/actions/createItinerary";

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supbase/client";

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
// These can stay as they are used for the generated result
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

// Use the imported type for SavedItinerary
// type SavedItinerary = { ... } // REMOVE OR COMMENT THIS OUT
type SavedItinerary = SavedItineraryEntry;

// Helper function to create daily plans (This function is fine)
// Helper function to create daily plans
// **CHANGE:** Add tripDuration parameter
const generateDailyPlans = (cityData: ItineraryCity, tripDuration: number) => {
  const { popular_destinations, hotels } = cityData;

  // Try to get the best hotel
  const selectedHotel =
    hotels && hotels.length > 0
      ? hotels.sort((a, b) => b.Hotel_Rating - a.Hotel_Rating)[0]
      : null;

  // Split destinations into days (max 3 per day)
  const destinationsPerDay = 3;
  const days: Array<{ day: number; activities: any[] }> = [];

  // Calculate total number of days needed based on destinations
  const totalDaysNeeded = Math.ceil(
    popular_destinations.length / destinationsPerDay
  );
  // Use the greater of the user's requested duration or the minimum days needed for destinations
  // **CHANGE:** Use the passed-in tripDuration parameter
  const actualTripDuration = Math.max(tripDuration, totalDaysNeeded);

  for (let dayIndex = 0; dayIndex < actualTripDuration; dayIndex++) {
    const dayNumber = dayIndex + 1;
    const startDestIndex = dayIndex * destinationsPerDay;
    // Ensure we don't go out of bounds for popular_destinations
    const dailyDestinations = popular_destinations.slice(
      startDestIndex,
      startDestIndex + destinationsPerDay
    );

    const dailyActivities = [];

    // First day should include arrival and hotel check-in (Only if it's the actual first day of the trip)
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
          time: index === 0 ? "Evening" : "Night", // Adjust time based on index after check-in
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
    // Last day should include hotel check-out and departure (Only if it's the actual last day)
    else if (dayNumber === actualTripDuration) {
      dailyActivities.push({
        time: "Morning", // Check-out typically morning
        activity: selectedHotel
          ? `Check-out from ${selectedHotel.Hotel_name}`
          : "Check-out from your hotel",
        description: "Pack your belongings and prepare for your final day.",
      });
      // Add destinations for the last day
      dailyDestinations.forEach((dest, index) => {
        dailyActivities.push({
          time:
            index === 0
              ? "Late Morning"
              : index === 1
              ? "Afternoon"
              : "Evening", // Adjust time based on index before departure
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
        time: "Night",
        activity: "Departure from " + cityData.city,
        description: "Farewell to " + cityData.city + "!",
      });
    }
    // Regular days
    else {
      dailyDestinations.forEach((dest, index) => {
        dailyActivities.push({
          time: index === 0 ? "Morning" : index === 1 ? "Afternoon" : "Evening", // Adjust time based on index
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

    // If a day has no destinations (e.g., requested duration is longer than destinations allow, and it's not the arrival/departure day)
    // or if destinations are fewer than requested and it's an intermediate day
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
  const [loading, setLoading] = useState(false);
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
  const [activeTab, setActiveTab] = useState("form");
  // Change type to SavedItineraryEntry[]
  const [savedItineraries, setSavedItineraries] = useState<
    SavedItineraryEntry[]
  >([]);
  // Change type to SavedItineraryEntry | null
  const [selectedSavedItinerary, setSelectedSavedItinerary] =
    useState<SavedItineraryEntry | null>(null);

  // Add loading state for saved itineraries
  const [isSavedLoading, setIsSavedLoading] = useState(false);

  // Load saved itineraries from database on component mount
  useEffect(() => {
    // Remove localStorage loading
    // const savedData = localStorage.getItem("savedItineraries");
    // if (savedData) {
    //   try {
    //     setSavedItineraries(JSON.parse(savedData));
    //   } catch (e) {
    //     console.error("Error loading saved itineraries:", e);
    //   }
    // }

    // **NEW: Fetch from database**
    const fetchItineraries = async () => {
      setIsSavedLoading(true); // Set loading state
      const response = await fetchSavedItinerariesAction();
      if (response.success && response.data) {
        setSavedItineraries(response.data);
      } else {
        // Handle fetch error if necessary (e.g., show a toast)
        console.error("Failed to fetch saved itineraries:", response.message);
        toast({
          title: "Error loading saved trips",
          description: response.message || "Could not load your saved trips.",
          variant: "destructive",
        });
        setSavedItineraries([]); // Ensure state is empty on failure
      }
      setIsSavedLoading(false); // Clear loading state
    };

    fetchItineraries();
  }, []); // Empty dependency array means this runs once on mount

  // Remove localStorage saving
  // useEffect(() => {
  //   localStorage.setItem("savedItineraries", JSON.stringify(savedItineraries));
  // }, [savedItineraries]);

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
      const parsedBudget = budget ? Number.parseInt(budget) : undefined;
      const response = await createItinerary({
        interests: selectedInterests,
        travelMonth,
        budget: parsedBudget,
      });

      if (response.success) {
        setResult(response);
        setActiveTab("results");
        // Select first interest & city by default
        if (response.itinerary && Object.keys(response.itinerary).length > 0) {
          const firstInterest = Object.keys(response.itinerary)[0];
          setSelectedInterestKey(firstInterest);
          setSelectedCityIndex(0);
        } else {
          // If no itinerary returned but success is true (e.g., no cities found)
          setActiveTab("results"); // Still go to results tab to show the empty state
        }
      } else {
        setError(response.message || "Failed to create itinerary");
      }
    } catch (err) {
      // Catch any unhandled exceptions
      console.error("Submit failed:", err);
      setError("An unexpected error occurred: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Get the currently selected city data from generated results
  const selectedCity =
    selectedInterestKey &&
    selectedCityIndex !== null &&
    result?.itinerary?.[selectedInterestKey]
      ? result.itinerary[selectedInterestKey][selectedCityIndex]
      : null;

  // Generate daily plans for the selected city from results
  // **CHANGE:** Pass tripDuration state (parsed to number)
  const dailyPlans = selectedCity
    ? generateDailyPlans(selectedCity, Number.parseInt(tripDuration, 10))
    : [];

  // Generate daily plans for the selected saved itinerary
  // **CHANGE:** Pass the duration from the saved itinerary (parsed to number)
  const savedItineraryDailyPlans = selectedSavedItinerary
    ? generateDailyPlans(
        selectedSavedItinerary.cityData,
        Number.parseInt(selectedSavedItinerary.duration, 10)
      )
    : [];

  // Modify generateDailyPlans to accept duration
  // const generateDailyPlans = (cityData: ItineraryCity, tripDuration: number) => { ... }

  // Save the current itinerary
  const saveItinerary = async () => {
    // Make async
    if (
      !selectedCity ||
      !selectedInterestKey ||
      !tripDuration ||
      !travelMonth
    ) {
      toast({
        title: "Cannot Save",
        description: "Please generate an itinerary first.",
        variant: "destructive",
      });
      return;
    }

    const newSavedItinerary: SavedItinerary = {
      id: Date.now().toString(), // Client-generated ID (timestamp)
      date: new Date().toLocaleDateString(),
      city: selectedCity.city,
      // Note: Currently saving only the *first* interest key from the generated result
      // If you want to save all interests used in the *form*, you'd need to access `selectedInterests`
      interests: [selectedInterestKey],
      month: travelMonth,
      duration: tripDuration, // Use the state value
      budget: budget || "No limit",
      estimatedCost:
        selectedCity.estimated_daily_cost * Number.parseInt(tripDuration, 10), // Use the state value
      cityData: selectedCity,
    };

    // **NEW: Call the server action to save**
    const response = await saveItineraryAction(newSavedItinerary);

    if (response.success) {
      // **NEW: Add the new itinerary to local state *after* successful save**
      // It's good practice to refetch, but for responsiveness, optimistic update is okay,
      // just handle potential sync issues if needed. For simplicity, let's re-fetch.
      // setSavedItineraries((prev) => [newSavedItinerary, ...prev]); // Old localStorage logic

      // **NEW: Re-fetch saved itineraries to ensure sync with DB**
      setIsSavedLoading(true);
      const fetchResponse = await fetchSavedItinerariesAction();
      if (fetchResponse.success && fetchResponse.data) {
        setSavedItineraries(fetchResponse.data);
      } else {
        console.error(
          "Failed to re-fetch saved itineraries after save:",
          fetchResponse.message
        );
        toast({
          title: "Save Successful, but Load Failed",
          description:
            fetchResponse.message || "Could not refresh saved trips list.",
          variant: "destructive",
        });
        // Optionally keep the optimistic update here if re-fetch fails
        // setSavedItineraries((prev) => [newSavedItinerary, ...prev]);
      }
      setIsSavedLoading(false);

      toast({
        title: "Itinerary Saved",
        description:
          response.message ||
          `Your trip to ${selectedCity.city} has been saved successfully.`,
        variant: "default",
      });
    } else {
      // **NEW: Handle save failure**
      toast({
        title: "Save Failed",
        description: response.message || "Could not save your itinerary.",
        variant: "destructive",
      });
    }
  };

  // Delete a saved itinerary
  const deleteSavedItinerary = async (id: string) => {
    // Make async
    // **NEW: Call the server action to delete**
    const response = await deleteSavedItineraryAction(id);

    if (response.success) {
      // **NEW: Update local state *after* successful deletion**
      setSavedItineraries((prev) => prev.filter((item) => item.id !== id));
      if (selectedSavedItinerary?.id === id) {
        setSelectedSavedItinerary(null);
      }
      toast({
        title: "Itinerary Deleted",
        description:
          response.message || "The saved itinerary has been removed.",
        variant: "default",
      });
    } else {
      // **NEW: Handle deletion failure**
      toast({
        title: "Deletion Failed",
        description:
          response.message || "Could not delete the saved itinerary.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    setLoading(false);

    if (error) {
      console.error("Error logging out:", error);
      // Optionally display an error message to the user
      alert("Logout failed. Please try again.");
    } else {
      // Redirect to the login page after successful logout
      redirect("/login"); // Adjust '/login' to your actual login route
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex justify-end mb-4">
        <Button
          onClick={handleLogout}
          disabled={loading}
          variant="outline"
          size="sm"
          className="text-blue-700 border-blue-500"
        >
          Log out
        </Button>
      </div>
      <Card className="border-none shadow-lg">
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
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="form" className="text-base">
                  Plan Your Trip
                </TabsTrigger>
                <TabsTrigger
                  value="results"
                  className="text-base"
                  disabled={!result?.success}
                >
                  Your Itinerary
                </TabsTrigger>
                <TabsTrigger value="saved" className="text-base">
                  Saved Trips ({savedItineraries.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="form" className="px-6 pb-6 space-y-8">
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
                        className={`
                          flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                          ${
                            selectedInterests.includes(interest)
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={selectedInterests.includes(interest)}
                          onChange={() => {}}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">{interest}</span>
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
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <h2 className="text-xl font-semibold">
                        When Are You Traveling?
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

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <IndianRupeeIcon className="h-5 w-5 text-blue-500" />
                    <h2 className="text-xl font-semibold">Daily Budget</h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setBudget("");
                        setShowCustomBudget(false);
                      }}
                      className={`p-4 rounded-lg transition-all ${
                        budget === "" && !showCustomBudget
                          ? "bg-blue-100 border-2 border-blue-500 text-blue-700 font-medium"
                          : "border-2 border-gray-200 hover:border-blue-200 hover:bg-gray-50"
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
                      className={`p-4 rounded-lg transition-all ${
                        budget === "3000" && !showCustomBudget
                          ? "bg-blue-100 border-2 border-blue-500 text-blue-700 font-medium"
                          : "border-2 border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium">Budget</div>
                      <div className="text-sm text-gray-600">₹3,000/day</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBudget("5000");
                        setShowCustomBudget(false);
                      }}
                      className={`p-4 rounded-lg transition-all ${
                        budget === "5000" && !showCustomBudget
                          ? "bg-blue-100 border-2 border-blue-500 text-blue-700 font-medium"
                          : "border-2 border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium">Mid-range</div>
                      <div className="text-sm text-gray-600">₹5,000/day</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBudget("10000");
                        setShowCustomBudget(false);
                      }}
                      className={`p-4 rounded-lg transition-all ${
                        budget === "10000" && !showCustomBudget
                          ? "bg-blue-100 border-2 border-blue-500 text-blue-700 font-medium"
                          : "border-2 border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium">Luxury</div>
                      <div className="text-sm text-gray-600">₹10,000/day</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBudget("20000");
                        setShowCustomBudget(false);
                      }}
                      className={`p-4 rounded-lg transition-all ${
                        budget === "20000" && !showCustomBudget
                          ? "bg-blue-100 border-2 border-blue-500 text-blue-700 font-medium"
                          : "border-2 border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium">Ultra Luxury</div>
                      <div className="text-sm text-gray-600">₹20,000/day</div>
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomBudget(!showCustomBudget);
                        if (!showCustomBudget) setBudget("");
                      }}
                      className={`p-3 rounded-lg transition-all w-full md:w-auto ${
                        showCustomBudget
                          ? "bg-blue-100 border-2 border-blue-500 text-blue-700 font-medium"
                          : "border-2 border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                      }`}
                    >
                      Custom Budget
                    </button>
                    {showCustomBudget && (
                      <div className="flex items-center mt-3 p-3 border-2 border-gray-200 rounded-lg focus-within:border-blue-500">
                        <span className="text-xl mr-2 text-gray-500">₹</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="Enter your daily budget"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          className="flex-grow p-1 focus:outline-none"
                        />
                        <span className="ml-2 text-gray-500">per day</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={
                    isLoading || selectedInterests.length === 0 || !travelMonth
                  }
                  className="w-full py-6 text-lg bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Creating Your Perfect Itinerary...</span>
                    </div>
                  ) : (
                    "Create My Itinerary"
                  )}
                </Button>
              </form>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
                  {error}
                </div>
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {result && result.success && (
                <div>
                  {!result.itinerary ||
                  Object.keys(result.itinerary).length === 0 ? (
                    <div className="p-6">
                      <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 flex flex-col items-center gap-4">
                        <Umbrella className="h-12 w-12 text-amber-500" />
                        <p className="text-center text-lg">
                          No destinations found for your selected criteria. Try
                          different interests, travel month, or budget.
                        </p>
                        <Button
                          onClick={() => setActiveTab("form")}
                          variant="outline"
                          className="border-amber-500 text-amber-700 hover:bg-amber-100"
                        >
                          Modify Your Search
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                      {/* Left sidebar */}
                      <div className="md:col-span-1 border-r">
                        <div className="p-4 bg-gray-50 border-b">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            Suggested Destinations
                          </h3>
                        </div>
                        <ScrollArea className="h-[calc(100vh-300px)] md:h-auto">
                          <div className="p-4">
                            {Object.entries(result.itinerary).map(
                              ([interest, cities]) => (
                                <div key={interest} className="mb-6">
                                  <h4 className="text-sm font-medium bg-blue-50 p-2 rounded-md text-blue-700 mb-2">
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
                                          {city.city}
                                          {city.state ? `, ${city.state}` : ""}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
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

                      {/* Right content */}
                      <div className="md:col-span-2 p-6">
                        {selectedCity ? (
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                <h2 className="text-2xl font-bold text-blue-800">
                                  {selectedCity.city}
                                  {selectedCity.state
                                    ? `, ${selectedCity.state}`
                                    : ""}
                                </h2>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={saveItinerary}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                    disabled={isLoading || isSavedLoading} // Disable while generating or saving
                                  >
                                    {/* Change icon based on if it's already saved - Optional enhancement */}
                                    {/* {savedItineraries.some(si => si.cityData?.city === selectedCity?.city && si.interests.includes(selectedInterestKey || '')) ? (
                                        <BookmarkCheck className="h-4 w-4 text-green-500" />
                                     ) : (
                                        <Bookmark className="h-4 w-4" />
                                     )} */}
                                    <Bookmark className="h-4 w-4" />
                                    <span>Save</span>
                                  </Button>
                                  <Button
                                    onClick={() => window.print()}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
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
                                  {selectedCity.best_time_to_visit.join(", ")}
                                </Badge>
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">
                                  <IndianRupeeIcon className="h-3.5 w-3.5 mr-1 text-blue-500" />
                                  Est. Daily Cost: ₹
                                  {selectedCity.estimated_daily_cost}
                                </Badge>
                              </div>
                            </div>

                            <Separator />

                            {/* Hotels */}
                            {selectedCity.hotels.length > 0 && (
                              <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                  <Heart className="h-4 w-4 text-rose-500" />
                                  Recommended Accommodation
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {selectedCity.hotels
                                    .slice(0, 3)
                                    .map((hotel, i) => (
                                      <Card key={i} className="overflow-hidden">
                                        <div className="h-24 bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                                          <span className="text-white text-xl font-bold">
                                            {hotel.Hotel_name.charAt(0)}
                                          </span>
                                        </div>
                                        <CardContent className="p-4">
                                          <div className="font-semibold truncate">
                                            {hotel.Hotel_name}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            {hotel.City}
                                          </div>
                                          <div className="flex justify-between items-center mt-2">
                                            <div className="flex items-center">
                                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                              <span className="ml-1 text-amber-600">
                                                {hotel.Hotel_Rating}
                                              </span>
                                            </div>
                                            <div className="font-medium text-blue-600">
                                              ₹{hotel.Hotel_price}/night
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                </div>
                              </div>
                            )}

                            <Separator />

                            {/* Day-by-day */}
                            <div>
                              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                Day-by-Day Itinerary ({tripDuration} days)
                              </h3>
                              <div className="space-y-6">
                                {dailyPlans.map((day) => (
                                  <Card
                                    key={day.day}
                                    className="overflow-hidden"
                                  >
                                    <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 px-4">
                                      <CardTitle className="text-lg">
                                        Day {day.day}
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                      <div className="divide-y">
                                        {day.activities.map((act, idx) => (
                                          <div
                                            key={idx}
                                            className="p-4 hover:bg-gray-50 transition-colors"
                                          >
                                            <div className="flex items-start gap-3">
                                              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium min-w-[5rem] text-center">
                                                {act.time}
                                              </div>
                                              <div>
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

                            {/* Budget summary */}
                            <Card className="bg-blue-50 border-blue-200">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                                  <IndianRupeeIcon className="h-4 w-4 text-blue-600" />
                                  Budget Summary
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-700">
                                      Accommodation (per night, avg best rated):
                                    </span>
                                    <span className="font-medium text-blue-700">
                                      ₹
                                      {selectedCity.hotels.length > 0
                                        ? // Calculate avg price of top 3 hotels for estimation
                                          (
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
                                          ).toFixed(0)
                                        : "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-700">
                                      Average attraction entry:
                                    </span>
                                    <span className="font-medium text-blue-700">
                                      ₹
                                      {(
                                        selectedCity.popular_destinations.reduce(
                                          (sum, d) => sum + d.price_fare,
                                          0
                                        ) /
                                        (selectedCity.popular_destinations
                                          .length || 1)
                                      ).toFixed(0)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-700">
                                      Estimated daily food/transport:
                                    </span>
                                    <span className="font-medium text-blue-700">
                                      ₹1,500
                                    </span>
                                  </div>
                                  <Separator className="bg-blue-200" />
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-blue-800">
                                      Total estimated daily cost:
                                    </span>
                                    <span className="font-semibold text-blue-800">
                                      ₹{selectedCity.estimated_daily_cost}
                                    </span>
                                  </div>
                                  <Separator className="bg-blue-200" />
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-blue-800">
                                      Total estimated trip cost ({tripDuration}{" "}
                                      days):
                                    </span>
                                    <span className="font-bold text-lg text-blue-800">
                                      ₹
                                      {selectedCity.estimated_daily_cost *
                                        Number.parseInt(tripDuration, 10)}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ) : (
                          <div className="flex h-[60vh] items-center justify-center text-gray-500 p-8 border rounded-lg bg-gray-50">
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

            <TabsContent value="saved" className="p-6">
              {isSavedLoading ? (
                <div className="flex h-[60vh] items-center justify-center text-gray-500 p-8 border rounded-lg bg-gray-50">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-lg">Loading saved trips...</p>
                  </div>
                </div>
              ) : savedItineraries.length === 0 ? (
                <Alert className="bg-blue-50 border-blue-200">
                  <div className="flex flex-col items-center text-center p-6">
                    <BookmarkCheck className="h-12 w-12 text-blue-400 mb-4" />
                    <AlertDescription className="text-lg text-gray-600">
                      You don't have any saved itineraries yet. Create and save
                      an itinerary to see it here.
                    </AlertDescription>
                    <Button
                      onClick={() => setActiveTab("form")}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      Create New Itinerary
                    </Button>
                  </div>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                  {/* Left sidebar - Saved Itineraries List */}
                  <div className="md:col-span-1 border-r">
                    <div className="p-4 bg-gray-50 border-b">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <BookmarkCheck className="h-4 w-4 text-blue-500" />
                        Your Saved Trips
                      </h3>
                    </div>
                    <ScrollArea className="h-[calc(100vh-300px)] md:h-auto">
                      <div className="p-4 space-y-3">
                        {savedItineraries.map((itinerary) => (
                          <div
                            key={itinerary.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedSavedItinerary?.id === itinerary.id
                                ? "border-blue-500 bg-blue-50"
                                : "hover:border-blue-200 hover:bg-gray-50"
                            }`}
                            onClick={() => setSelectedSavedItinerary(itinerary)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-blue-800">
                                  {itinerary.city}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  Saved on {itinerary.date}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent selecting the itinerary when deleting
                                  deleteSavedItinerary(itinerary.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {itinerary.duration} days
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {itinerary.month}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200"
                              >
                                ₹{itinerary.estimatedCost}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Right content - Selected Saved Itinerary */}
                  <div className="md:col-span-2 p-6">
                    {selectedSavedItinerary ? (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <h2 className="text-2xl font-bold text-blue-800">
                              {selectedSavedItinerary.city}
                              {selectedSavedItinerary.cityData?.state // Access state from cityData
                                ? `, ${selectedSavedItinerary.cityData.state}`
                                : ""}
                            </h2>
                            <Button
                              onClick={() => window.print()}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Printer className="h-4 w-4" />
                              <span>Print</span>
                            </Button>
                          </div>

                          <p className="text-gray-600 leading-relaxed">
                            {selectedSavedItinerary.cityData?.description ||
                              "No description available."}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none">
                              <Star className="h-3.5 w-3.5 mr-1 fill-amber-500 text-amber-500" />
                              Rating:{" "}
                              {selectedSavedItinerary.cityData?.rating || "N/A"}
                            </Badge>
                            <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 border-none">
                              <Calendar className="h-3.5 w-3.5 mr-1 text-sky-500" />
                              Best time:{" "}
                              {(
                                selectedSavedItinerary.cityData
                                  ?.best_time_to_visit || []
                              ).join(", ") || "N/A"}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">
                              <IndianRupeeIcon className="h-3.5 w-3.5 mr-1 text-blue-500" />
                              Est. Daily Cost: ₹
                              {selectedSavedItinerary.cityData
                                ?.estimated_daily_cost || "N/A"}
                            </Badge>
                          </div>

                          {/* Trip Details Card - Use direct saved itinerary properties */}
                          <Card className="bg-blue-50 border-blue-200">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-md text-blue-800">
                                Trip Details
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Travel Month
                                  </p>
                                  <p className="font-medium">
                                    {selectedSavedItinerary.month}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Duration
                                  </p>
                                  <p className="font-medium">
                                    {selectedSavedItinerary.duration} days
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Budget (Daily)
                                  </p>
                                  <p className="font-medium">
                                    {selectedSavedItinerary.budget ===
                                    "No limit"
                                      ? "No limit"
                                      : `₹${selectedSavedItinerary.budget}/day`}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Total Estimated Cost
                                  </p>
                                  <p className="font-medium">
                                    ₹{selectedSavedItinerary.estimatedCost}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <Separator />

                        {/* Hotels */}
                        {/* Use hotels from cityData */}
                        {(selectedSavedItinerary.cityData?.hotels || [])
                          .length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                              <Heart className="h-4 w-4 text-rose-500" />
                              Recommended Accommodation
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {(selectedSavedItinerary.cityData.hotels || [])
                                .slice(0, 3) // Show up to 3 hotels
                                .map((hotel, i) => (
                                  <Card key={i} className="overflow-hidden">
                                    <div className="h-24 bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                                      <span className="text-white text-xl font-bold">
                                        {hotel.Hotel_name.charAt(0)}
                                      </span>
                                    </div>
                                    <CardContent className="p-4">
                                      <div className="font-semibold truncate">
                                        {hotel.Hotel_name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {hotel.City}
                                      </div>
                                      <div className="flex justify-between items-center mt-2">
                                        <div className="flex items-center">
                                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                          <span className="ml-1 text-amber-600">
                                            {hotel.Hotel_Rating}
                                          </span>
                                        </div>
                                        <div className="font-medium text-blue-600">
                                          ₹{hotel.Hotel_price}/night
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          </div>
                        )}

                        <Separator />

                        {/* Day-by-day */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            Day-by-Day Itinerary (
                            {selectedSavedItinerary.duration} days)
                          </h3>
                          <div className="space-y-6">
                            {/* Use savedItineraryDailyPlans */}
                            {savedItineraryDailyPlans.map((day) => (
                              <Card key={day.day} className="overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 px-4">
                                  <CardTitle className="text-lg">
                                    Day {day.day}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                  <div className="divide-y">
                                    {day.activities.map((act, idx) => (
                                      <div
                                        key={idx}
                                        className="p-4 hover:bg-gray-50 transition-colors"
                                      >
                                        <div className="flex items-start gap-3">
                                          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium min-w-[5rem] text-center">
                                            {act.time}
                                          </div>
                                          <div>
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

                        {/* Budget summary for saved itinerary - Reuse structure but use saved data */}
                        <Card className="bg-blue-50 border-blue-200">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                              <IndianRupeeIcon className="h-4 w-4 text-blue-600" />
                              Budget Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700">
                                  Budget set:
                                </span>
                                <span className="font-medium text-blue-700">
                                  {selectedSavedItinerary.budget === "No limit"
                                    ? "No limit"
                                    : `₹${selectedSavedItinerary.budget}/day`}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700">
                                  Estimated daily cost:
                                </span>
                                <span className="font-medium text-blue-700">
                                  ₹
                                  {selectedSavedItinerary.cityData
                                    ?.estimated_daily_cost || "N/A"}
                                </span>
                              </div>

                              <Separator className="bg-blue-200" />
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-blue-800">
                                  Total estimated trip cost (
                                  {selectedSavedItinerary.duration} days):
                                </span>
                                <span className="font-bold text-lg text-blue-800">
                                  ₹{selectedSavedItinerary.estimatedCost}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      // Placeholder when no saved itinerary is selected
                      <div className="flex h-[60vh] items-center justify-center text-gray-500 p-8 border rounded-lg bg-gray-50">
                        <div className="text-center">
                          <BookmarkCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-lg">
                            Select a saved trip from the left to view details
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
