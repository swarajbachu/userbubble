import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default [
  // ESM build
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: true,
      inlineDynamicImports: true,
    },
    external: [
      "react",
      "react-native",
      "expo-secure-store",
      "@react-native-async-storage/async-storage",
      "expo-constants",
    ],
    plugins: [
      nodeResolve({
        extensions: [".ts", ".tsx"],
      }),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationDir: "./dist",
        rootDir: "./src",
        noEmitOnError: false,
      }),
    ],
  },
  // CommonJS build
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "cjs",
      sourcemap: true,
      exports: "named",
      inlineDynamicImports: true,
    },
    external: [
      "react",
      "react-native",
      "expo-secure-store",
      "@react-native-async-storage/async-storage",
      "expo-constants",
    ],
    plugins: [
      nodeResolve({
        extensions: [".ts", ".tsx"],
      }),
      typescript({
        tsconfig: "./tsconfig.json",
        noEmitOnError: false,
      }),
    ],
  },
];
