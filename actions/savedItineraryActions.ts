"use server";

import { createClient } from "@/utils/supbase/server";
import { z } from "zod";

// Define the type structure for a saved itinerary entry in the database JSONB array
// This should match the data structure you want to store for each saved trip.
// Based on your client-side `SavedItinerary` type, we'll store key details
// plus the full `cityData`.
const savedItineraryEntrySchema = z.object({
  id: z.string(), // Client-generated ID (timestamp as string)
  date: z.string(),
  city: z.string(),
  interests: z.array(z.string()),
  month: z.string(),
  duration: z.string(),
  budget: z.string(),
  estimatedCost: z.number(),
  // Validate cityData based on the ItineraryCity type
  cityData: z.object({
    city: z.string(),
    state: z.string().optional(),
    popular_destinations: z.array(
      z.object({
        name: z.string(),
        google_rating: z.number(),
        interest: z.array(z.string()),
        price_fare: z.number(),
      })
    ),
    hotels: z.array(
      z.object({
        Hotel_name: z.string(),
        City: z.string(),
        Hotel_Rating: z.number(),
        Hotel_price: z.number(),
      })
    ),
    rating: z.number(),
    description: z.string(),
    best_time_to_visit: z.array(z.string()),
    estimated_daily_cost: z.number(),
  }),
});

export type SavedItineraryEntry = z.infer<typeof savedItineraryEntrySchema>;

// Action to save an itinerary
export async function saveItineraryAction(
  itineraryToSave: SavedItineraryEntry
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "User not authenticated." };
    }

    const userId = user.user.id;

    // Validate the incoming data structure
    const validatedItinerary = savedItineraryEntrySchema.parse(itineraryToSave);

    // Fetch the current user data row
    const { data: userData, error: fetchError } = await supabase
      .from("user_data")
      .select("itineraries")
      .eq("user_id", userId)
      .single(); // Use single() as user_id should be unique

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 means no rows found
      console.error("Error fetching user data:", fetchError);
      return {
        success: false,
        message: `Failed to fetch user data: ${fetchError.message}`,
      };
    }

    let currentItineraries: SavedItineraryEntry[] = [];

    if (userData && userData.itineraries) {
      // Ensure the stored data is treated as an array
      currentItineraries = Array.isArray(userData.itineraries)
        ? userData.itineraries
        : [];
      // Remove existing itinerary with the same ID if updating/replacing
      currentItineraries = currentItineraries.filter(
        (item) => item.id !== validatedItinerary.id
      );
    }

    // Add the new itinerary
    const updatedItineraries = [validatedItinerary, ...currentItineraries];

    if (!userData) {
      // If no user_data row exists, create one
      const { error: insertError } = await supabase.from("user_data").insert([
        {
          user_id: userId,
          itineraries: updatedItineraries,
        },
      ]);

      if (insertError) {
        console.error("Error inserting user data:", insertError);
        return {
          success: false,
          message: `Failed to save itinerary: ${insertError.message}`,
        };
      }
    } else {
      // If user_data row exists, update it
      const { error: updateError } = await supabase
        .from("user_data")
        .update({
          itineraries: updatedItineraries,
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating user data:", updateError);
        return {
          success: false,
          message: `Failed to save itinerary: ${updateError.message}`,
        };
      }
    }

    return { success: true, message: "Itinerary saved successfully!" };
  } catch (error) {
    console.error("Error in saveItineraryAction:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: "Invalid itinerary data." };
    }
    return {
      success: false,
      message: `An unexpected error occurred: ${String(error)}`,
    };
  }
}

// Action to fetch saved itineraries for the logged-in user
export async function fetchSavedItinerariesAction(): Promise<{
  success: boolean;
  data?: SavedItineraryEntry[];
  message?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      // If no user, return success: true with empty data, as it's not an error
      // in the sense of a failed database operation, just no user logged in.
      return { success: true, data: [], message: "No user logged in." };
    }

    const userId = user.user.id;

    const { data: userData, error: fetchError } = await supabase
      .from("user_data")
      .select("itineraries")
      .eq("user_id", userId)
      .single(); // Use single() as user_id should be unique

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 means no rows found
      console.error(
        "Error fetching user data for saved itineraries:",
        fetchError
      );
      return {
        success: false,
        message: `Failed to fetch saved itineraries: ${fetchError.message}`,
      };
    }

    // If user_data exists and has itineraries, return them
    if (userData && userData.itineraries) {
      // Ensure the stored data is treated as an array and validate its structure
      const rawItineraries = Array.isArray(userData.itineraries)
        ? userData.itineraries
        : [];
      const validatedItineraries: SavedItineraryEntry[] = [];

      for (const item of rawItineraries) {
        const validationResult = savedItineraryEntrySchema.safeParse(item);
        if (validationResult.success) {
          validatedItineraries.push(validationResult.data);
        } else {
          console.warn(
            "Skipping invalid saved itinerary entry:",
            item,
            validationResult.error
          );
        }
      }

      return { success: true, data: validatedItineraries };
    }

    // If no user_data or no itineraries, return empty array
    return { success: true, data: [] };
  } catch (error) {
    console.error("Error in fetchSavedItinerariesAction:", error);
    return {
      success: false,
      message: `An unexpected error occurred: ${String(error)}`,
    };
  }
}

// Action to delete a saved itinerary by its client-side ID
export async function deleteSavedItineraryAction(
  itineraryIdToDelete: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "User not authenticated." };
    }

    const userId = user.user.id;

    // Fetch the current user data row
    const { data: userData, error: fetchError } = await supabase
      .from("user_data")
      .select("itineraries")
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching user data for deletion:", fetchError);
      return {
        success: false,
        message: `Failed to fetch user data: ${fetchError.message}`,
      };
    }

    if (
      !userData ||
      !userData.itineraries ||
      !Array.isArray(userData.itineraries)
    ) {
      // Nothing to delete if no data or itineraries are not an array
      return { success: true, message: "No saved itineraries found." };
    }

    // Filter out the itinerary to delete based on its 'id' field within the JSONB array
    const updatedItineraries = userData.itineraries.filter(
      (item: any) =>
        typeof item === "object" &&
        item !== null &&
        item.id !== itineraryIdToDelete
    );

    // Update the row with the filtered array
    const { error: updateError } = await supabase
      .from("user_data")
      .update({
        itineraries: updatedItineraries,
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating user data after deletion:", updateError);
      return {
        success: false,
        message: `Failed to delete itinerary: ${updateError.message}`,
      };
    }

    return { success: true, message: "Itinerary deleted successfully!" };
  } catch (error) {
    console.error("Error in deleteSavedItineraryAction:", error);
    return {
      success: false,
      message: `An unexpected error occurred: ${String(error)}`,
    };
  }
}
