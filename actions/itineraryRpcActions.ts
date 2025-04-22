// Ensure correct path for Supabase client
import { createClient } from "@/utils/supbase/client";
import { z } from "zod";

// --- Type Definitions ---

// Define types for the generated itinerary result (matching component)
type Destination = {
  name: string;
  google_rating: number;
  interest: string[]; // Assuming interest is stored as an array in the JSONB structure
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
  state?: string | null; // State can be optional or null
  popular_destinations: Destination[] | null; // Destinations array can be null
  hotels: Hotel[] | null; // Hotels array can be null
  rating: number;
  description: string;
  best_time_to_visit: string[];
  estimated_daily_cost: number;
};

// Type for the result from the create itinerary RPC call (matching the SQL function's JSONB output structure)
// Note: The SQL function returns a JSONB object like { "InterestName": [city1, city2] }
type CreateItineraryRpcResult = {
  success: boolean;
  message?: string;
  itinerary?: {
    [interest: string]: ItineraryCity[]; // The generated itinerary structure
  };
};

// --- Zod Schema for Saved Itinerary Entry ---
// This schema validates the structure of a single saved itinerary object
const savedItineraryEntrySchema = z.object({
  id: z.string(), // Unique ID for the saved entry (e.g., timestamp string)
  date: z.string(), // Date saved (e.g., ISO string)
  city: z.string(), // The main city for the itinerary (or starting city)
  interests: z.array(z.string()), // Interests used for generation
  month: z.string(), // Travel month used
  duration: z.string(), // Duration string (e.g., "3 days")
  budget: z.string(), // Budget string (e.g., "$5000" or "No limit")
  estimatedCost: z.number(), // Estimated total cost (assuming daily cost * duration logic happens before saving)
  // Validate cityData - using the ItineraryCity type structure
  cityData: z.object({
    city: z.string(),
    state: z.string().optional().nullable(),
    popular_destinations: z
      .array(
        z.object({
          name: z.string(),
          google_rating: z.number(),
          interest: z.array(z.string()),
          price_fare: z.number().nullable(), // price_fare could potentially be null
        })
      )
      .nullable(),
    hotels: z
      .array(
        z.object({
          Hotel_name: z.string(),
          City: z.string(),
          Hotel_Rating: z.number().nullable(), // Hotel_Rating could be null
          Hotel_price: z.number().nullable(), // Hotel_price could be null
        })
      )
      .nullable(),
    rating: z.number().nullable(), // City rating could be null
    description: z.string().nullable(), // Description could be null
    best_time_to_visit: z.array(z.string()),
    estimated_daily_cost: z.number().nullable(), // Estimated daily cost could be null
  }),
});

// Export the derived type for use in the component
export type SavedItineraryEntry = z.infer<typeof savedItineraryEntrySchema>;

// --- Zod Schema for Create Itinerary Input ---
const createItineraryInputSchema = z.object({
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  travelMonth: z.string().min(1, "Select a travel month"),
  budget: z
    .number()
    .min(0, "Budget must be a positive number")
    .optional()
    .nullable(), // Allow budget to be null
});

// --- Common Response Type for RPC Calls ---
// Used for calls where a simple success/failure message is expected
type BasicRpcResponse = {
  success: boolean;
  message?: string;
};

// --- Calling create_itinerary RPC ---

export async function callCreateItineraryRpc(formData: {
  interests: string[];
  travelMonth: string;
  budget?: number | null; // Allow budget to be null
}): Promise<
  BasicRpcResponse & { itinerary?: { [interest: string]: ItineraryCity[] } }
> {
  // Extend BasicRpcResponse
  try {
    // Validate input using Zod schema
    const validatedData = createItineraryInputSchema.parse(formData);
    const { interests, travelMonth, budget } = validatedData;

    const supabase = createClient(); // Use your client instance

    // Call the Supabase RPC function
    const { data, error } = await supabase.rpc("create_itinerary", {
      p_interests: interests,
      p_travel_month: travelMonth,
      p_budget: budget, // Pass budget (can be null/undefined)
    });

    // Handle RPC errors (network, database issues *before* function body)
    if (error) {
      console.error("RPC Error (create_itinerary):", error);
      return { success: false, message: `RPC Error: ${error.message}` };
    }

    // The SQL function returns a JSONB object with success/message/itinerary
    // Supabase maps this JSONB to a JavaScript object.
    const result = data as CreateItineraryRpcResult; // Cast based on expected SQL output structure

    // Check the 'success' flag returned *within* the RPC function's JSON response
    if (!result || result.success === false) {
      // Check for null/undefined result or explicit success: false
      return {
        success: false,
        message: result?.message || "Itinerary creation failed (RPC).",
      };
    }

    // If result.success is true, return the itinerary data
    return {
      success: true,
      message: result.message, // Pass along message if any (e.g., "No cities for this month")
      itinerary: result.itinerary, // Pass along the generated itinerary object
    };
  } catch (error) {
    // Handle client-side errors (e.g., Zod validation errors, network issues before RPC call)
    console.error("Error calling create_itinerary RPC:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors.map((e) => e.message).join(", "),
      };
    }
    // Handle other unexpected errors
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected client-side error occurred.",
    };
  }
}

// --- Calling save_itinerary RPC ---

export async function callSaveItineraryRpc(
  itineraryToSave: SavedItineraryEntry
): Promise<BasicRpcResponse> {
  try {
    // Validate the itinerary object against the Zod schema before sending
    const validatedItinerary = savedItineraryEntrySchema.parse(itineraryToSave);

    const supabase = createClient();

    // Call the save_itinerary RPC function, passing the validated data
    const { data, error } = await supabase.rpc("save_itinerary", {
      // The parameter name must match the one defined in your SQL function
      p_itinerary_to_save: validatedItinerary, // Pass the validated JS object
    });

    // Handle RPC errors
    if (error) {
      console.error("RPC Error (save_itinerary):", error);
      return { success: false, message: `RPC Error: ${error.message}` };
    }

    // Process the response from the RPC function (assuming it returns { success: boolean, message?: string })
    const result = data as BasicRpcResponse; // Cast based on expected SQL output structure
    return { success: result.success, message: result.message };
  } catch (error) {
    // Handle client-side errors (e.g., Zod validation)
    console.error("Error calling save_itinerary RPC:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Invalid itinerary data provided for saving.",
      };
    }
    // Handle other unexpected errors
    return { success: false, message: `Client Error: ${String(error)}` };
  }
}

// --- Calling fetch_saved_itineraries RPC ---

// Type for the response from the fetch RPC - this function returns an array of itineraries directly
type FetchSavedItinerariesResult = {
  success: boolean;
  data?: SavedItineraryEntry[]; // The fetched itineraries are expected as an array in the 'data' field of the return object
  message?: string; // Message can be undefined on success, string on error/info
};

export async function callFetchSavedItinerariesRpc(): Promise<FetchSavedItinerariesResult> {
  try {
    const supabase = createClient();

    // Call the fetch_saved_itineraries RPC function (no parameters needed)
    // The SQL function returns jsonb (the array of itineraries or []) directly.
    const { data, error } = await supabase.rpc("fetch_saved_itineraries");

    // Handle RPC errors (network, database issues *before* function body)
    if (error) {
      console.error("RPC Error (fetch_saved_itineraries):", error);
      return { success: false, message: `RPC Error: ${error.message}` };
    }

    // **FIXED LOGIC:**
    // The 'data' variable from supabase.rpc holds the direct return value of the SQL function.
    // Our SQL function with COALESCE returns jsonb which maps to a JavaScript array ([...]).
    // So, 'data' here is expected to be either an array of itinerary objects or an empty array [].

    if (data === null || data === undefined) {
      // This case is unlikely with COALESCE in SQL function returning '[]'::jsonb,
      // but defensively check. It means RPC succeeded but returned no data payload.
      console.warn("RPC returned null or undefined data payload unexpectedly.");
      return {
        success: true, // RPC call succeeded, but no data returned
        data: [], // Return empty array
        message: "No itineraries found or RPC returned empty result.",
      };
    }

    // Now 'data' is expected to be the array from the database. Validate its structure.
    const validationResult = z.array(savedItineraryEntrySchema).safeParse(data);

    if (!validationResult.success) {
      // Data fetched from DB doesn't match the expected Zod schema structure for the array elements
      console.error(
        "Fetched saved itineraries validation failed:",
        validationResult.error.errors // Log specific Zod validation errors
      );
      // This indicates an issue with the data stored in the database not matching the client's schema.
      // Return success: false because the data is unusable due to format issues.
      return {
        success: false,
        message: "Fetched itineraries are in an invalid format.",
        data: [], // Return empty array as the data is unreliable
      };
    }

    // If validation passes, return the structured result object
    return {
      success: true,
      data: validationResult.data, // validationResult.data is the correctly typed array
      message: "Itineraries fetched successfully.", // Add a success message for clarity
    };
  } catch (error) {
    // Handle unexpected client-side errors that might occur *during* processing the RPC response
    console.error(
      "Client-side error calling fetch_saved_itineraries RPC:",
      error
    );
    return { success: false, message: `Client Error: ${String(error)}` };
  }
}

// --- Calling delete_saved_itinerary RPC ---

export async function callDeleteSavedItineraryRpc(
  itineraryIdToDelete: string
): Promise<BasicRpcResponse> {
  try {
    // Basic validation: ensure ID is a non-empty string
    if (!itineraryIdToDelete || typeof itineraryIdToDelete !== "string") {
      return {
        success: false,
        message: "Invalid itinerary ID provided for deletion.",
      };
    }

    const supabase = createClient();

    // Call the delete_saved_itinerary RPC function
    const { data, error } = await supabase.rpc("delete_saved_itinerary", {
      // Parameter name must match your SQL function definition
      p_itinerary_id_to_delete: itineraryIdToDelete,
    });

    // Handle RPC errors
    if (error) {
      console.error("RPC Error (delete_saved_itinerary):", error);
      return { success: false, message: `RPC Error: ${error.message}` };
    }

    // Process the response (assuming it returns { success: boolean, message?: string })
    const result = data as BasicRpcResponse; // Cast based on expected SQL output structure
    return { success: result.success, message: result.message };
  } catch (error) {
    // Handle unexpected client-side errors
    console.error("Error calling delete_saved_itinerary RPC:", error);
    return { success: false, message: `Client Error: ${String(error)}` };
  }
}
