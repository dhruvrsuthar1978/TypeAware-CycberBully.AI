import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [react()];

  // Only load lovable-tagger in development
  if (mode === "development") {
    try {
      const { componentTagger } = require("lovable-tagger");
      plugins.push(componentTagger());
    } catch (err) {
      console.warn("lovable-tagger not available - skipping");
    }
  }

  return {
    server: {
      host: "localhost",
      port: 8080,
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      minify: "terser",
      emptyOutDir: true,
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom"],
            "vendor-router": ["react-router-dom"],
            "vendor-query": ["@tanstack/react-query"],
            "vendor-radix": [
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-slot",
              "@radix-ui/react-tooltip",
              "@radix-ui/react-popover",
            ],
            "vendor-utils": ["clsx", "class-variance-authority", "zod"],
            "vendor-icons": ["lucide-react"],
            "vendor-forms": ["react-hook-form", "@hookform/resolvers"],
            "vendor-charts": ["recharts", "chart.js", "react-chartjs-2"],
          },
        },
      },
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom"],
    },
  };
});