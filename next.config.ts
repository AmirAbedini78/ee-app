import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export is disabled to allow full Next.js features:
  // - API Routes
  // - Server-Side Rendering (SSR)
  // - Server Components
  // - Dynamic routes
  // If you need static export in the future, uncomment below:
  // output: 'export',
  // distDir: 'out',
  
  // If you need to configure CORS or proxy API requests, uncomment below:
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/:path*`,
  //     },
  //   ];
  // },
  
  // Environment variables that should be available on both server and client
  env: {
    // Add any custom env vars here if needed
  },
};

export default nextConfig;
