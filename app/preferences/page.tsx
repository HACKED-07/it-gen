"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, X } from "lucide-react"

export default function PreferencesPage() {
  const [budget, setBudget] = useState([1000])
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  // Deduplicated list of interests
  const interests = [
    "Cultural & Heritage Sites",
    "Religious & Spiritual Pilgrimages",
    "Adventure & Outdoor Activities",
    "Arts, Science & Literature Attractions",
    "Shopping & Markets",
    "Natural Landscapes & Wildlife",
    "Sightseeing & Exploration",
    "Sports & Recreation",
    "Culinary & Food Experiences",
    "Beach",
  ]

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest))
    } else {
      setSelectedInterests([...selectedInterests, interest])
    }
  }

  const handleSubmit = () => {
    // Handle form submission - could send to API or store in state
    console.log({
      budget: budget[0],
      travelMonth: selectedMonth,
      interests: selectedInterests,
    })
    // In a real app, you would navigate or submit this data
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Travel Preferences</h1>
      <p className="text-muted-foreground mb-8">
        Tell us about your travel preferences so we can create the perfect itinerary for you.
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget</CardTitle>
            <CardDescription>Set your maximum budget for the trip</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Slider value={budget} onValueChange={setBudget} max={10000} step={100} />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">$0</span>
                <span className="text-xl font-medium">${budget[0].toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">$10,000+</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Travel Month</CardTitle>
            <CardDescription>When are you planning to travel?</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Interests</CardTitle>
            <CardDescription>Select the activities and experiences you're interested in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <ScrollArea className="h-full">
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <Badge
                      key={interest}
                      variant={selectedInterests.includes(interest) ? "default" : "outline"}
                      className="cursor-pointer py-2 px-3 text-sm"
                      onClick={() => toggleInterest(interest)}
                    >
                      {selectedInterests.includes(interest) && <Check className="mr-1 h-3 w-3" />}
                      {interest}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {selectedInterests.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Selected Interests:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedInterests.map((interest) => (
                    <Badge key={interest} className="flex items-center gap-1 py-1.5">
                      {interest}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => toggleInterest(interest)} />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Selected {selectedInterests.length} of {interests.length} interests
            </p>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8 flex justify-end">
        <Button size="lg" onClick={handleSubmit} disabled={!selectedMonth || selectedInterests.length === 0}>
          Save Preferences
        </Button>
      </div>
    </div>
  )
}
