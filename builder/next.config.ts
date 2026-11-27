import type { NextConfig } from "next";

// The scene builder: a separate small app in the same repository. It uses the
// site's splat engine (lib/splats, components/splats) and the site's
// node_modules directly, so it renders exactly what the site renders. Built
// with `next build builder` from the repository root into builder/out.
const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // Allow importing the engine from outside this folder.
  experimental: { externalDir: true },
};

export default config;
