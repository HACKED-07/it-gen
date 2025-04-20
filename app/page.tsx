import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-gradient-to-br from-black via-[#0a1128] to-[#0d1d40] text-white p-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-3xl mx-auto w-full py-20">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">TripPlanner</h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-12">
          Effortlessly create personalized travel itineraries in seconds
        </p>
        <Link
          href="/createitinerary"
          className="inline-flex items-center gap-2 bg-[#155dfc] hover:bg-[#155dfc]/90 text-white px-6 py-3 rounded-md font-medium transition-colors"
        >
          Get Started <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <footer className="w-full text-center text-gray-400 text-sm py-6">
        © {new Date().getFullYear()} TripPlanner. All rights reserved.
      </footer>
    </div>
  );
}
