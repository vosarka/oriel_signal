import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig, type Plugin } from "vite";

const r3fSceneFiles = [
  "/features/tetradic-signature/TetradicBookScene.tsx",
  "/features/tetradic-signature/TetradicChapterScenes.tsx",
  "/features/tetradic-signature/TetradicSpread.tsx",
];

function jsxLocExceptR3fScenes(): Plugin {
  const plugin = jsxLocPlugin();
  const originalTransform = plugin.transform;

  return {
    ...plugin,
    async transform(code, id, options) {
      if (r3fSceneFiles.some(file => id.includes(file))) return null;

      if (typeof originalTransform === "function") {
        return originalTransform.call(this, code, id, options);
      }
      return originalTransform?.handler.call(this, code, id, options);
    },
  };
}

const plugins = [react(), tailwindcss(), jsxLocExceptR3fScenes()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
