import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/__tests__/**/*.spec.[jt]s?(x)', '**/tests/**/*.spec.[jt]s?(x)'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        'tests/**',
        'vitest.config.ts',
        '*.config.js',
        '*.config.ts',
      ],
    },
  },
})
