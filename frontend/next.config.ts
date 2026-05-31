import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow blob: URLs for upload image preview (createObjectURL)
    remotePatterns: [],
    dangerouslyAllowSVG: false,
    unoptimized: true, // blob: URLs can't go through Next.js image optimization
  },
};

export default nextConfig;
