import {
  Calendar,
  LocateFixed,
  LocateIcon,
  LucideType,
  MapPin,
  Star,
  Thermometer,
  TypeIcon,
} from "lucide-react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QUERIES } from "@/lib/queries";
import { DestinationCardProps } from "@/components/destination-card";

interface Attraction {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  rating: number;
}

interface Hotel {
  id: string;
  name: string;
  description: string;
  image: string;
  priceRange: string;
  rating: number;
}

interface Restaurant {
  id: string;
  name: string;
  description: string;
  image: string;
  cuisine: string;
  priceRange: string;
  rating: number;
}

interface Destination {
  id: string;
  name: string;
  country: string;
  description: string;
  images: string[];
  bestSeason: string;
  climate: string;
  rating: number;
  attractions: Attraction[];
  hotels: Hotel[];
  restaurants: Restaurant[];
}

// Mock data for demonstration
const destinationData: Destination = {
  id: "paris-001",
  name: "Paris",
  country: "France",
  description:
    "Paris, the capital of France, is a major European city and a global center for art, fashion, gastronomy, and culture. Its 19th-century cityscape is crisscrossed by wide boulevards and the River Seine. Beyond such landmarks as the Eiffel Tower and the 12th-century, Gothic Notre-Dame cathedral, the city is known for its cafe culture and designer boutiques along the Rue du Faubourg Saint-Honoré.",
  images: [
    "/placeholder.svg?height=300&width=500",
    "/placeholder.svg?height=300&width=500",
    "/placeholder.svg?height=300&width=500",
  ],
  bestSeason: "Spring",
  climate: "Continental",
  rating: 4.8,
  attractions: [
    {
      id: "eiffel-001",
      name: "Eiffel Tower",
      description:
        "Iconic wrought-iron tower offering city views from observation decks.",
      image: "/placeholder.svg?height=200&width=350",
      category: "Landmark",
      rating: 4.7,
    },
    {
      id: "louvre-001",
      name: "Louvre Museum",
      description:
        "World's largest art museum housing thousands of works including the Mona Lisa.",
      image: "/placeholder.svg?height=200&width=350",
      category: "Museum",
      rating: 4.9,
    },
    {
      id: "notredame-001",
      name: "Notre-Dame Cathedral",
      description:
        "Medieval Catholic cathedral known for its French Gothic architecture.",
      image: "/placeholder.svg?height=200&width=350",
      category: "Historic",
      rating: 4.6,
    },
  ],
  hotels: [
    {
      id: "hotel-001",
      name: "Hôtel Plaza Athénée",
      description:
        "Luxury hotel with Eiffel Tower views, featuring elegant rooms and fine dining.",
      image: "/placeholder.svg?height=200&width=350",
      priceRange: "$$",
      rating: 4.9,
    },
    {
      id: "hotel-002",
      name: "Le Meurice",
      description:
        "Historic palace hotel with opulent decor and a 3-Michelin-star restaurant.",
      image: "/placeholder.svg?height=200&width=350",
      priceRange: "$$",
      rating: 4.8,
    },
    {
      id: "hotel-003",
      name: "Hôtel des Arts Montmartre",
      description:
        "Charming boutique hotel in the artistic Montmartre district.",
      image: "/placeholder.svg?height=200&width=350",
      priceRange: "$",
      rating: 4.5,
    },
  ],
  restaurants: [
    {
      id: "rest-001",
      name: "Le Jules Verne",
      description:
        "Fine dining restaurant located on the second floor of the Eiffel Tower.",
      image: "/placeholder.svg?height=200&width=350",
      cuisine: "French",
      priceRange: "$$",
      rating: 4.7,
    },
    {
      id: "rest-002",
      name: "L'Ambroisie",
      description:
        "Three-Michelin-starred restaurant serving classic French cuisine.",
      image: "/placeholder.svg?height=200&width=350",
      cuisine: "French",
      priceRange: "$$",
      rating: 4.9,
    },
    {
      id: "rest-003",
      name: "Café de Flore",
      description:
        "Historic café known for its famous clientele and traditional French fare.",
      image: "/placeholder.svg?height=200&width=350",
      cuisine: "Café",
      priceRange: "$",
      rating: 4.4,
    },
  ],
};

export async function DestinationContents(props: {
  destDetails: DestinationCardProps;
}) {
  const destination = props.destDetails;
  console.log(destination);
  if (!destination) {
    return <div>No destination found</div>;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold">{destination.name}</h1>
          <div className="flex items-center text-gray-600 mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{destination.state}</span>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="col-span-1">
            <Image
              src={"/placeholder.svg"}
              alt={`${destination.name} scene 1`}
              width={600}
              height={400}
              className="rounded-lg w-full h-[300px] object-cover"
            />
          </div>
          <div className="col-span-1 grid grid-rows-2 gap-4">
            <Image
              src={"/placeholder.svg"}
              alt={`${destination.name} scene 2`}
              width={600}
              height={200}
              className="rounded-lg w-full h-[140px] object-cover"
            />
            <Image
              src={"/placeholder.svg"}
              alt={`${destination.name} scene 3`}
              width={600}
              height={200}
              className="rounded-lg w-full h-[140px] object-cover"
            />
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-100 rounded-lg p-4 flex items-center">
            <div className="bg-gray-200 rounded-full p-3 mr-4">
              <Star className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Rating</p>
              <p className="font-semibold">{destination.popularity}/10</p>
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg p-4 flex items-center">
            <div className="bg-gray-200 rounded-full p-3 mr-4">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Best Season</p>
              <p className="font-semibold">{destination.best_time_to_visit}</p>
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg p-4 flex items-center">
            <div className="bg-gray-200 rounded-full p-3 mr-4">
              <LocateFixed className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Type</p>
              <p className="font-semibold">{destination.type}</p>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">About {destination.name}</h2>
          <p className="text-gray-700 leading-relaxed">
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Fugiat
            ullam, eos est error pariatur perferendis unde enim exercitationem
            qui sint sapiente facere magnam illo! Necessitatibus, suscipit optio
            natus eius illum pariatur debitis quam expedita reprehenderit
            veritatis, aperiam inventore vero mollitia beatae alias nesciunt
            saepe odit illo! Expedita nobis iusto earum.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="attractions" className="w-full">
          <TabsList className="w-full bg-gray-100 rounded-lg mb-6">
            <TabsTrigger value="attractions" className="flex-1">
              Attractions
            </TabsTrigger>
            <TabsTrigger value="hotels" className="flex-1">
              Hotels
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="flex-1">
              Restaurants
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attractions" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {destinationData.attractions.map((attraction) => (
                <div
                  key={attraction.id}
                  className="bg-gray-100 rounded-lg overflow-hidden shadow-sm"
                >
                  <div className="relative h-48">
                    <Image
                      src={attraction.image || "/placeholder.svg"}
                      alt={attraction.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold">
                        {attraction.name}
                      </h3>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                        {attraction.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      {attraction.description}
                    </p>
                    <div className="flex items-center text-sm">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 mr-1" />
                      <span>{attraction.rating}/5</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="hotels" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {destinationData.hotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="bg-gray-100 rounded-lg overflow-hidden shadow-sm"
                >
                  <div className="relative h-48">
                    <Image
                      src={hotel.image || "/placeholder.svg"}
                      alt={hotel.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold">{hotel.name}</h3>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 mr-1" />
                        <span>{hotel.rating}/5</span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      {hotel.description}
                    </p>
                    <div className="text-sm font-semibold">
                      {hotel.priceRange}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="restaurants" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {destinationData.restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="bg-gray-100 rounded-lg overflow-hidden shadow-sm"
                >
                  <div className="relative h-48">
                    <Image
                      src={restaurant.image || "/placeholder.svg"}
                      alt={restaurant.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold">
                        {restaurant.name}
                      </h3>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                        {restaurant.cuisine}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      {restaurant.description}
                    </p>
                    <div className="flex justify-between items-center text-sm">
                      <div className="font-semibold">
                        {restaurant.priceRange}
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 mr-1" />
                        <span>{restaurant.rating}/5</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
