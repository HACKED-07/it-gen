"use server";

import { createClient } from "@/utils/supbase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validate inputs to avoid TypeScript errors
  if (!email || !password) {
    return {
      error: "Email and password are required",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error:
        error.message || "Failed to sign in. Please check your credentials.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/createitinerary");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validate inputs to avoid TypeScript errors
  if (!email || !password) {
    return {
      error: "Email and password are required",
    };
  }

  // Try to sign up the user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  // Check for specific error indicating email exists
  if (error) {
    return {
      error: error.message || "Failed to create account. Please try again.",
    };
  }

  // Check if the user was actually created or if it already exists
  // When a user already exists, Supabase often returns data.user but with a specific status
  if (data.user?.identities?.length === 0) {
    return {
      error:
        "A user with this email already exists. Please use a different email or sign in.",
    };
  }

  // If we get here, the user was successfully created
  revalidatePath("/", "layout");
  redirect("/createitinerary");
}
