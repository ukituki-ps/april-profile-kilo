import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(dirname, "../..");

/**
 * Один React / `mantine-vaul` из корня workspace (`frontend/node_modules`), без pnpm-дерева submodule.
 * `mantine-vaul` не inline — иначе Vitest тянет исходники из DS и второй экземпляр React.
 */
export default defineConfig({
  resolve: {
    dedupe: ["react", "react-dom", "@mantine/core", "@mantine/hooks"],
    alias: {
      react: path.resolve(frontendRoot, "node_modules/react"),
      "react-dom": path.resolve(frontendRoot, "node_modules/react-dom"),
      "mantine-vaul/style.css": path.resolve(frontendRoot, "node_modules/mantine-vaul/dist/style.css"),
      "mantine-vaul": path.resolve(frontendRoot, "node_modules/mantine-vaul"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    cache: false,
    server: {
      deps: {
        inline: [/@april\/ui/],
      },
    },
  },
});
