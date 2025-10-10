import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Conditional import for development only
const getDevPlugins = async (mode) => {
  if (mode === "development") {
    try {
      const { componentTagger } = await import("lovable-tagger");
      return componentTagger();
    } catch (err) {
      console.warn("lovable-tagger not available - skipping in production");
      return null;
    }
  }
  return null;
};

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => ({
  server: {
    host: "localhost", // force IPv4 instead of "::"
    port: 8080,        // frontend runs on 8080
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    await getDevPlugins(mode),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
