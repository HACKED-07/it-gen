import { Calendar, Clock, MapPin, Utensils, Coffee, Bed } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DayItineraryType, ActivityType } from "@/types/itinerary"

interface DayItineraryProps {
  day: DayItineraryType
  isDetailed: boolean
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "attraction":
      return <MapPin className="h-4 w-4" />
    case "meal":
      return <Utensils className="h-4 w-4" />
    case "rest":
      return <Bed className="h-4 w-4" />
    case "break":
      return <Coffee className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case "attraction":
      return "bg-blue-100 text-blue-800"
    case "meal":
      return "bg-green-100 text-green-800"
    case "rest":
      return "bg-purple-100 text-purple-800"
    case "break":
      return "bg-orange-100 text-orange-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function DayItinerary({ day, isDetailed }: DayItineraryProps) {
  return (
    <div className="rounded-lg bg-white shadow-sm">
      <div className="border-b bg-gray-50 px-6 py-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold">
            Day {day.dayNumber}: {day.title}
          </h2>
        </div>
        <p className="mt-1 text-gray-600">{day.date}</p>
      </div>

      <div className="p-6">
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 z-0 w-0.5 bg-gray-200" />

          <div className="relative z-10 space-y-6">
            {day.activities.map((activity, index) => (
              <ActivityItem key={index} activity={activity} isDetailed={isDetailed} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityItem({
  activity,
  isDetailed,
}: {
  activity: ActivityType
  isDetailed: boolean
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white text-white">
        <div className={`rounded-full p-1.5 ${getActivityColor(activity.type)}`}>{getActivityIcon(activity.type)}</div>
      </div>

      <Card className="flex-1 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <div>
              <h3 className="font-medium">{activity.title}</h3>
              <div className="text-sm text-gray-500">
                {activity.timeStart} - {activity.timeEnd}
              </div>
            </div>
            <Badge variant="outline" className={`ml-2 ${getActivityColor(activity.type)}`}>
              {activity.type}
            </Badge>
          </div>

          {activity.location && (
            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
              <MapPin className="mr-1 h-3 w-3" />
              {activity.location}
            </div>
          )}
        </div>

        {isDetailed && activity.description && <p className="mt-3 text-sm text-gray-600">{activity.description}</p>}
      </Card>
    </div>
  )
}
