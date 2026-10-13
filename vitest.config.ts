import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 120_000,
    coverage: { provider: 'v8', include: ['src/**/*.ts'], thresholds: { statements: 95, branches: 90, functions: 95, lines: 95 }, exclude: ["src/bidi-data.ts"] },
  },
})
