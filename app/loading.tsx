import React from "react";

// This is a React Server Component by default in App Router
// but can also be a Client Component if marked with 'use client'
export default function Loading() {
  // You can return any JSX here to display a loading indicator
  return (
    <div className="flex justify-center items-center min-h-screen">
      {/* You can add a spinner, text, or any loading animation */}
      {/* <p className="text-xl font-semibold">Loading...</p> */}
      {/* Or a simple spinner */}
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-blue-500 border-solid"></div>
    </div>
  );
}
