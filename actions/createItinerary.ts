"use server";

import { createClient } from "@/utils/supbase/client";
import { z } from "zod";

// Define a validation schema for the input
const createItinerarySchema = z.object({
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  travelMonth: z.string().min(1, "Select a travel month"),
  budget: z.number().min(0, "Budget must be a positive number").optional(),
});

// Define a type for the returned itinerary
export type ItineraryCity = {
  city: string;
  state?: string;
  popular_destinations: {
    name: string;
    google_rating: number;
    interest: string[];
    price_fare: number;
  }[];
  hotels: {
    Hotel_name: string;
    City: string;
    Hotel_Rating: number;
    Hotel_price: number;
  }[];
  rating: number;
  description: string;
  best_time_to_visit: string[];
  estimated_daily_cost: number;
};

export type ItineraryResult = {
  success: boolean;
  message?: string;
  itinerary?: {
    [interest: string]: ItineraryCity[];
  };
};

export async function createItinerary(formData: {
  interests: string[];
  travelMonth: string;
  budget?: number;
}): Promise<ItineraryResult> {
  try {
    console.log(
      "Starting itinerary creation with data:",
      JSON.stringify(formData)
    );

    const validatedData = createItinerarySchema.parse(formData);
    const { interests, travelMonth, budget } = validatedData;

    const supabase = createClient();

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

        // Filter hotels by budget if provided
        let filteredHotels = cityHotels;
        if (budget !== undefined) {
          filteredHotels = cityHotels.filter(
            (hotel) => Number(hotel.Hotel_price) <= budget
          );
        }

        // Calculate average attraction cost
        const avgAttractionCost =
          places.reduce(
            (sum, place) => sum + (Number(place.price_fare) || 0),
            0
          ) / places.length;

        // Calculate average hotel cost
        let avgHotelCost = 0;
        if (filteredHotels.length > 0) {
          avgHotelCost =
            filteredHotels.reduce(
              (sum, hotel) => sum + (Number(hotel.Hotel_price) || 0),
              0
            ) / filteredHotels.length;
        } else if (cityHotels.length > 0) {
          // If no hotels match budget but city has hotels, use average for estimation
          avgHotelCost =
            cityHotels.reduce(
              (sum, hotel) => sum + (Number(hotel.Hotel_price) || 0),
              0
            ) / cityHotels.length;
        }

        // Estimate daily cost (hotel + 3 attractions + food estimate)
        const estimatedDailyFood = 1500; // A rough estimate for food costs
        const estimatedDailyCost =
          avgHotelCost + avgAttractionCost * 3 + estimatedDailyFood;

        // Skip this city if the daily cost exceeds the budget
        if (budget !== undefined && estimatedDailyCost > budget) {
          console.log(
            `Skipping ${cityInfo.city} as daily cost ${estimatedDailyCost} exceeds budget ${budget}`
          );
          continue;
        }

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
          hotels: filteredHotels.map((hotel) => ({
            Hotel_name: hotel.Hotel_name || "Unknown Hotel",
            City: hotel.City || "",
            Hotel_Rating: Number(hotel.Hotel_Rating) || 0,
            Hotel_price: Number(hotel.Hotel_price) || 0,
          })),
          rating: Number(cityInfo.rating) || 0,
          description: cityInfo.description || "",
          best_time_to_visit: cityInfo.best_time_to_visit,
          estimated_daily_cost: Math.round(estimatedDailyCost),
        });
      }

      // Sort cities by rating first, but if budget is specified, prioritize cities within budget
      citiesForInterest.sort((a, b) => {
        if (budget !== undefined) {
          // If both are within budget or both exceed budget, sort by rating
          if (
            (a.estimated_daily_cost <= budget &&
              b.estimated_daily_cost <= budget) ||
            (a.estimated_daily_cost > budget && b.estimated_daily_cost > budget)
          ) {
            return b.rating - a.rating;
          }
          // Prioritize the one within budget
          return a.estimated_daily_cost <= budget ? -1 : 1;
        }
        // Default sort by rating when no budget constraint
        return b.rating - a.rating;
      });

      if (citiesForInterest.length > 0) {
        itinerary[interest] = citiesForInterest;
      }
    }

    if (Object.keys(itinerary).length === 0) {
      return {
        success: true,
        message:
          budget !== undefined
            ? "No matching destinations found for your interests, travel month, and budget constraints."
            : "No matching destinations found for your interests and travel month.",
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
