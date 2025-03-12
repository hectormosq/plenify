import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const destinationUrl = process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_VERCEL_URL
        : process.env.NEXT_PUBLIC_API_URL;

    return [
      // Rewrites all API requests to express server
      {
        source: "/api/v1/:path*",
        destination: `${destinationUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
