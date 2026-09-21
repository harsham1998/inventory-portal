import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,
  // pdf-parse (via pdfjs-dist) loads a worker file at runtime that Turbopack
  // doesn't bundle correctly when this package is compiled into the server
  // chunk — keep it as a real Node require instead.
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
};

export default nextConfig;
