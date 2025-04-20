import { createClient } from "@/utils/supbase/server";

export const QUERIES = {
  getDestinations: async () => {
    const client = await createClient();
    return client.from("destinations").select("*").limit(5);
  },
  getDestinationDetails: async (destId: number) => {
    const client = await createClient();
    return client.from("destinations").select().eq("id", destId);
  },
};
