import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'v3b.fal.media',
      },
      {
        protocol: "https",
        hostname: 'flux-hackathon.s3.us-east-2.amazonaws.com'
      }
    ],
  },
};

export default nextConfig;
