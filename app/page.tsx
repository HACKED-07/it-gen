import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import BgImage from "@/public/bgImage.jpg";

export default async function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Base gradient background - changed from solid black to a gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />

      {/* Decorative image layer - increased opacity from 20% to 50% */}
      <div className="absolute inset-0 opacity-50">
        <div className="relative h-full w-full">
          <Image
            src={BgImage}
            alt="Background Decoration"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex flex-col items-center justify-between min-h-screen">
        {/* Navigation */}
        <header className="w-full px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="text-white font-bold text-xl">TripPlanner</div>
            <nav className="hidden md:flex space-x-8">
              <Link
                href="/login"
                className="text-white hover:text-gray-200 transition-colors"
              >
                Login
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero section */}
        <main className="flex-1 flex items-center justify-center w-full px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
              Plan Your Perfect <span className="text-[#4f8bfc]">Journey</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Effortlessly create personalized travel itineraries in seconds
              with our intuitive AI-powered platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-[#155dfc] hover:bg-[#155dfc]/90 text-white px-8 py-4 rounded-md font-medium transition-colors"
              >
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full text-center text-gray-400 text-sm py-6 px-6">
          <div className="max-w-7xl mx-auto border-t border-gray-800 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                © {new Date().getFullYear()} TripPlanner. All rights reserved.
              </div>
              <div className="flex gap-6">
                <Link
                  href="/"
                  className="hover:text-gray-300 transition-colors"
                >
                  Terms
                </Link>
                <Link
                  href="/"
                  className="hover:text-gray-300 transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  href="/"
                  className="hover:text-gray-300 transition-colors"
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
