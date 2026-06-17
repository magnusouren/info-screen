import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.10.131'],
  // node-ical pulls in moment-timezone, which Turbopack mis-bundles
  // (`s.BigInt is not a function`). Resolve it with native require instead.
  serverExternalPackages: ['node-ical'],
};

export default nextConfig;
