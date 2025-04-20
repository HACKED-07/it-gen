import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DayItinerary from "./day-itinerary"
import { itineraryData } from "@/data/itinerary-data"

export default function ItineraryView() {
  return (
    <Card className="p-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {itineraryData.map((day) => (
            <DayItinerary key={day.id} day={day} isDetailed={false} />
          ))}
        </TabsContent>

        <TabsContent value="detailed" className="space-y-10">
          {itineraryData.map((day) => (
            <DayItinerary key={day.id} day={day} isDetailed={true} />
          ))}
        </TabsContent>
      </Tabs>
    </Card>
  )
}
