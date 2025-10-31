import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const IMAGES_DOMAIN = process.env.NEXT_PUBLIC_IMAGES_DOMAIN; // e.g. cdn.example.com or bucket.s3.region.amazonaws.com

const nextConfig: NextConfig = {
  images: IMAGES_DOMAIN
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: IMAGES_DOMAIN,
          },
        ],
      }
    : undefined,
  async rewrites() {
    if (!API_URL) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL.replace(/\/$/, "")}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
