import "./src/env.ts";
import type { NextConfig } from "next";

const config: NextConfig = {
  images: {
    remotePatterns: [{ hostname: "img.clerk.com" }],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default config;
