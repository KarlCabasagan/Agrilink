import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "supabase-vendor": ["@supabase/supabase-js"],
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "icons": ["@iconify/react"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});

