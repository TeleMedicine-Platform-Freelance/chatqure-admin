// import path from 'path'
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  // Check if MSW is enabled - if so, don't proxy API requests
  const useMsw = env.VITE_USE_MSW === "true";

  return {
    plugins: [react(), tsconfigPaths(), tailwindcss()],
    build: {
      sourcemap: false,
    },
    optimizeDeps: {
      // Exclude source files from esbuild scanning to avoid decorator errors
      entries: ["index.html"],
      esbuildOptions: {
        // Tell esbuild to only look at node_modules for pre-bundling
        resolveExtensions: [".js", ".mjs", ".cjs"],
      },
    },
    server: {
      // Proxy API requests to backend when MSW is disabled
      // When MSW is enabled, requests stay local and are intercepted by MSW
      proxy: useMsw
        ? undefined
        : {
            "/api": {
              target: "http://localhost:3000", // Backend runs on port 3000
              changeOrigin: true,
              secure: false,
            },
          },
    },
  };
});
