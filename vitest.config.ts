import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      APP_ORIGIN: "http://localhost:5173",
      JWT_SECRET: "test-only-secret-with-at-least-32-characters",
      NODE_ENV: "test",
    },
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
