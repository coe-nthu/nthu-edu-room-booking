import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        ".next/**",
        "node_modules/**",
        "src/test/**",
        "**/*.config.*",
        "**/*.d.ts",
      ],
    },
  },
})
