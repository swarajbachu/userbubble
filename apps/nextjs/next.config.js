import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
await jiti.import("./src/env");

/** @type {import("next").NextConfig} */
const config = {
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@critichut/api",
    "@critichut/auth",
    "@critichut/db",
    "@critichut/ui",
    "@critichut/validators",
  ],

  /** We already do linting and typechecking as separate tasks in CI */
  typescript: { ignoreBuildErrors: true },

  /** Support path-based routing for local development */
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/external/:org/:path*",
          destination: "/external/:org/:path*",
        },
      ],
    };
  },
};

export default config;
