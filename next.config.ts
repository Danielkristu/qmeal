import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ['192.168.0.106', '10.128.127.120', '10.97.71.10'],
};

export default nextConfig;
