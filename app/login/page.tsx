import { createClient } from "@/utils/supbase/server";
import { MinimalAuthPage } from "./login-page";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (data.user || !error) redirect("/createitinerary");
  return <MinimalAuthPage />;
}
