import { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        // match anything under /public, which is served at "/"
        pathname: "/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
