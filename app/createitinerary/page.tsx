import { createClient } from "@/utils/supbase/server";
import { ItineraryGenerator } from "./itinerary-generator";
import { redirect } from "next/navigation";

export default async function ItineraryPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (!data.user || error) {
    redirect("/login");
  }
  return <ItineraryGenerator />;
}
