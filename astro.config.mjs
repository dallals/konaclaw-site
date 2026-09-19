// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://konaclaw.ai",
  output: "static",
  trailingSlash: "never",
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
