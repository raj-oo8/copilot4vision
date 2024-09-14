import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: 'build', // Ensure the output directory is set to 'build'
  },
  optimizeDeps: {
    exclude: ["@google/generative-ai"],
  },
});
