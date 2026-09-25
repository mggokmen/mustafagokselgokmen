import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The image ships a server and the files it traced, not the whole node_modules tree
  // (docs/devops.md#images).
  output: "standalone",
};

export default nextConfig;
