import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface DestinationCardProps {
  id: string;
  name: string;
  state: string;
  type: string;
  popularity: number;
  best_time_to_visit: string;
  created_at: Date;
}

export default function DestinationCard(props: {
  destination: DestinationCardProps;
}) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <div className="relative h-48 w-full">
        <Image
          src={
            "https://images.unsplash.com/photo-1741807083060-39c641cd97fa?q=80&w=3236&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          }
          alt={props.destination.name}
          fill
          className="object-cover"
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{props.destination.name}</h2>
            <div className="flex items-center text-muted-foreground mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{props.destination.state}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex justify-end">
              <Badge variant="outline">{props.destination.type}</Badge>
            </div>
            <div>
              <Button size="sm" asChild className="mt-3">
                <Link href={`/destinations/${props.destination.id}`}>
                  View Details
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
