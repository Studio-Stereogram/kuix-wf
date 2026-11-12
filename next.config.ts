import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export keeps the draft hostable anywhere while we iterate.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
