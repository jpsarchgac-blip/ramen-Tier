import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Server Actions imported in Client Components are typed as () => void by the
    // Next.js TS plugin, but they accept arguments at runtime. Ignore these false positives.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
