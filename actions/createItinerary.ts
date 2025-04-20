"use server";

import { createClient } from "@/utils/supbase/server";
import { z } from "zod";

// Define a validation schema for the input
const createItinerarySchema = z.object({
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  travelMonth: z.string().min(1, "Select a travel month"),
});

// Define a type for the returned itinerary
type ItineraryCity = {
  city: string;
  state?: string;
  popular_destinations: {
    name: string;
    google_rating: number;
    interest: string[];
    price_fare: number;
  }[];
  hotels: {
    name: string;
    address: string;
    rating: number;
    price_per_night: number;
  }[];
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

export async function createItinerary(formData: {
  interests: string[];
  travelMonth: string;
}): Promise<ItineraryResult> {
  try {
    console.log(
      "Starting itinerary creation with data:",
      JSON.stringify(formData)
    );

    const validatedData = createItinerarySchema.parse(formData);
    const { interests, travelMonth } = validatedData;

    const supabase = await createClient();

    if (!supabase) {
      console.error("Failed to initialize Supabase client");
      return {
        success: false,
        message: "Database connection failed",
      };
    }

    console.log("Successfully initialized Supabase client");

    // 1. Get cities that match the month
    const { data: matchingCities, error: citiesError } = await supabase
      .from("city_info")
      .select("*")
      .ilike("best_time_to_visit", `%${travelMonth}%`);

    if (citiesError) {
      console.error("Error fetching cities by month:", citiesError);
      return {
        success: false,
        message: `Failed to fetch cities: ${citiesError.message}`,
      };
    }

    if (!matchingCities || matchingCities.length === 0) {
      return {
        success: true,
        message: "No cities available for your selected travel month.",
        itinerary: {},
      };
    }

    const visitableCities = new Map();
    matchingCities.forEach((city: any) => {
      let bestTimeArray;
      if (typeof city.best_time_to_visit === "string") {
        try {
          bestTimeArray = JSON.parse(city.best_time_to_visit);
        } catch (e) {
          bestTimeArray = [city.best_time_to_visit];
        }
      } else if (Array.isArray(city.best_time_to_visit)) {
        bestTimeArray = city.best_time_to_visit;
      } else {
        bestTimeArray = [String(city.best_time_to_visit)];
      }

      visitableCities.set(city.city.toLowerCase(), {
        ...city,
        best_time_to_visit: bestTimeArray,
      });
    });

    const cityNames = Array.from(visitableCities.keys());
    console.log(
      `Will search for places in these cities: ${cityNames
        .slice(0, 5)
        .join(", ")}${cityNames.length > 5 ? "..." : ""}`
    );

    // 2. Get hotel details for those cities - using proper capitalization to match database
    const { data: hotels, error: hotelError } = await supabase
      .from("Hotels")
      .select("*")
      .in(
        "City",
        cityNames.map((name) => name.charAt(0).toUpperCase() + name.slice(1))
      );

    if (hotelError) {
      console.error("Error fetching hotels:", hotelError);
      // Continue with the process even if hotel data retrieval fails
      console.log("Continuing without hotel data");
    }

    console.log("Hotels found:", hotels?.length || 0);

    // Organize hotels by city for easy access
    const hotelsByCity: { [city: string]: any[] } = {};
    if (hotels && hotels.length > 0) {
      hotels.forEach((hotel) => {
        if (!hotel.City) return;

        const cityLower = hotel.City.toLowerCase();
        if (!hotelsByCity[cityLower]) {
          hotelsByCity[cityLower] = [];
        }
        hotelsByCity[cityLower].push(hotel);
      });
    }

    const itinerary: { [interest: string]: ItineraryCity[] } = {};

    for (const interest of interests) {
      console.log(`Finding places for interest: ${interest}`);

      // 🔹 Direct query for places
      const { data: placesData, error: placesError } = await supabase
        .from("places")
        .select("*")
        .ilike("interest", `%${interest}%`)
        .in(
          "city",
          cityNames.map((name) => name.charAt(0).toUpperCase() + name.slice(1))
        );

      if (placesError) {
        console.error(`Error fetching places for ${interest}:`, placesError);
        continue;
      }

      if (!placesData || placesData.length === 0) {
        continue;
      }

      const placesByCity: { [city: string]: any[] } = {};

      for (const place of placesData) {
        if (!place.city) continue;

        const cityLower = place.city.toLowerCase();
        if (!placesByCity[cityLower]) {
          placesByCity[cityLower] = [];
        }
        placesByCity[cityLower].push(place);
      }

      const citiesForInterest: ItineraryCity[] = [];

      for (const [cityLower, places] of Object.entries(placesByCity)) {
        const cityInfo = visitableCities.get(cityLower);
        if (!cityInfo) continue;

        const parseInterest = (interestValue: any): string[] => {
          if (Array.isArray(interestValue)) return interestValue;
          if (typeof interestValue === "string") {
            try {
              const parsed = JSON.parse(interestValue);
              return Array.isArray(parsed) ? parsed : [interestValue];
            } catch {
              return [interestValue];
            }
          }
          return [interest];
        };

        // Get hotels for this city
        const cityHotels = hotelsByCity[cityLower] || [];

        citiesForInterest.push({
          city: cityInfo.city,
          state: places[0]?.state,
          popular_destinations: places.map((place) => ({
            name:
              place.popular_destination || place.name || "Unnamed Destination",
            google_rating: Number(place.google_rating) || 0,
            interest: parseInterest(place.interest),
            price_fare: Number(place.price_fare) || 0,
          })),
          hotels: cityHotels.map((hotel) => ({
            name: hotel.Name || "Unknown Hotel",
            address: hotel.Address || "",
            rating: Number(hotel.Rating) || 0,
            price_per_night: Number(hotel.Price_per_night) || 0,
          })),
          rating: Number(cityInfo.rating) || 0,
          description: cityInfo.description || "",
          best_time_to_visit: cityInfo.best_time_to_visit,
        });
      }

      citiesForInterest.sort((a, b) => b.rating - a.rating);

      if (citiesForInterest.length > 0) {
        itinerary[interest] = citiesForInterest;
      }
    }

    if (Object.keys(itinerary).length === 0) {
      return {
        success: true,
        message:
          "No matching destinations found for your interests and travel month.",
        itinerary: {},
      };
    }

    return {
      success: true,
      itinerary,
    };
  } catch (error) {
    console.error("Error creating itinerary:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : `Failed to create itinerary: ${String(error)}`,
    };
  }
}
