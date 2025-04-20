export interface ActivityType {
  type: string
  title: string
  timeStart: string
  timeEnd: string
  location?: string
  description?: string
}

export interface DayItineraryType {
  id: string
  dayNumber: number
  title: string
  date: string
  activities: ActivityType[]
}
