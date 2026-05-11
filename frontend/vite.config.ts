import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "@mantine/core", "@emotion/react"],
    alias: {
      react: path.resolve(dirname, "node_modules/react"),
      "react-dom": path.resolve(dirname, "node_modules/react-dom"),
      /** Подпуть явно: иначе Vite не мапит `mantine-vaul/style.css` на пакет в корне. */
      "mantine-vaul/style.css": path.resolve(dirname, "node_modules/mantine-vaul/dist/style.css"),
      /** Единый экземпляр (без pnpm-дерева submodule при `file:` на DS). */
      "mantine-vaul": path.resolve(dirname, "node_modules/mantine-vaul"),
      "@april/profile-ui": path.resolve(dirname, "packages/profile-ui/src/index.ts"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    cache: false,
    // Пакет `@april/profile-ui` имеет свой `vitest run` в workspace; здесь только shell-приложение.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "packages/**"],
    server: {
      deps: {
        /** Только `@april/ui`: `mantine-vaul` из корня `node_modules` (единый React), не исходники из pnpm DS. */
        inline: [/@april\/ui/],
      },
    },
  },
});
