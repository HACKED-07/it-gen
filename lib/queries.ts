import { createClient } from "@/utils/supbase/client";

export const QUERIES = {
  getDestinations: async () => {
    const client = createClient();
    return client.from("destinations").select("*").limit(5);
  },
  getDestinationDetails: async (destId: number) => {
    const client = createClient();
    return client.from("destinations").select().eq("id", destId);
  },
};
