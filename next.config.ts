import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8090",
        pathname: "/photos/**",
      },
    ],
  },

};

export default nextConfig;
