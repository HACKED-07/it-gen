import DestinationCard from "@/components/destination-card";
import { QUERIES } from "@/lib/queries";

export default async function Destinations() {
  const dest = await QUERIES.getDestinations();
  if (!dest.data) {
    return <div>Error getting destinations</div>;
  }
  console.log(dest);
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          Explore Amazing Destinations
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover breathtaking locations around the world and plan your next
          unforgettable adventure.
        </p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {dest.data.map((destination) => (
          <DestinationCard key={destination.id} destination={destination} />
        ))}
      </div>
    </div>
  );
}
