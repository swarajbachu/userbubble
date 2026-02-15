import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default [
  // Vanilla JS — ESM
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: true,
    },
    plugins: [
      nodeResolve(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationDir: "./dist",
        rootDir: "./src",
      }),
    ],
  },
  // Vanilla JS — CJS
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
    plugins: [nodeResolve(), typescript({ tsconfig: "./tsconfig.json" })],
  },
  // Vanilla JS — UMD (minified, for script tags)
  {
    input: "src/umd.ts",
    output: {
      file: "dist/userbubble.min.js",
      format: "umd",
      name: "Userbubble",
      sourcemap: true,
      exports: "default",
    },
    plugins: [
      nodeResolve(),
      typescript({ tsconfig: "./tsconfig.json" }),
      terser({
        compress: { passes: 2 },
        format: { comments: false },
      }),
    ],
  },
  // React — ESM
  {
    input: "src/react.ts",
    output: {
      file: "dist/react.esm.js",
      format: "esm",
      sourcemap: true,
    },
    external: ["react", "react/jsx-runtime"],
    plugins: [
      nodeResolve(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationDir: "./dist",
        rootDir: "./src",
      }),
    ],
  },
  // React — CJS
  {
    input: "src/react.ts",
    output: {
      file: "dist/react.js",
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
    external: ["react", "react/jsx-runtime"],
    plugins: [nodeResolve(), typescript({ tsconfig: "./tsconfig.json" })],
  },
];
