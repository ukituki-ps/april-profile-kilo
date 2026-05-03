import { defineConfig } from "vitest/config";

/** DS ≥0.1.9 тянет `mantine-vaul` с side-effect `.css`; без inline Vitest отдаёт файл в Node и падает на расширении. */
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    cache: false,
    server: {
      deps: {
        inline: [/@april\/ui/, "mantine-vaul"],
      },
    },
  },
});
