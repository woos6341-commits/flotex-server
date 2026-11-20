import { build } from "esbuild";
import { resolve } from "node:path";

const root = process.cwd();
await build({
  entryPoints: [resolve(root, "server/_core/index.ts")],
  outfile: resolve(root, "dist/index.js"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  packages: "external",
  sourcemap: false,
  logLevel: "info",
  alias: {
    "@": root,
    "@shared": resolve(root, "shared")
  }
});
