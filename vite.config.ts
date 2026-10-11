import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Bundle react-helmet-async into the pre-render (SSR) build: the deploy workflow runs Node 18,
  // which can't import its named exports from CommonJS.
  ssr: {
    noExternal: ['react-helmet-async'],
  },
  base: '/' // Since this will be the base directory
}));
