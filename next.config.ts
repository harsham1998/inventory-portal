import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,
  // pdf-parse (via pdfjs-dist) loads a worker file at runtime that Turbopack
  // doesn't bundle correctly when this package is compiled into the server
  // chunk — keep it as a real Node require instead.
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  // @napi-rs/canvas's native binary is loaded via a dynamic require inside
  // pdfjs-dist, which Next's output file tracing can't detect statically —
  // force it into the deployed function bundle explicitly.
  outputFileTracingIncludes: {
    // The native .node binary ships in a separate platform-specific sibling
    // package (@napi-rs/canvas-linux-x64-gnu on Vercel), not the main one.
    // Every route whose server action calls pdf-parse needs this listed
    // explicitly — it's not inherited from a shared glob.
    "/invoices/new": ["./node_modules/@napi-rs/canvas*/**"],
    "/sales/new": ["./node_modules/@napi-rs/canvas*/**"],
  },
};

export default nextConfig;
