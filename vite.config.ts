import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tsconfigPaths from "vite-tsconfig-paths";

import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
      "@tabler/icons-react": "@tabler/icons-react/dist/esm/icons/index.mjs",
    },
  },
  plugins: [
    tsconfigPaths(),
    tanstackRouter({ autoCodeSplitting: true,target:'react' }),
    viteReact(),
    tailwindcss(),
    cloudflare({
      remoteBindings: true,
    }),
  ],
  server: {
    watch: {
      ignored: ["**/.wrangler/state/**"],
    },
  }, // The build configuration is handled by the Cloudflare plugin, so we can leave this empty
});
