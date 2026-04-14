import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // 生成独立部署包，适合 Docker
};

export default nextConfig;
