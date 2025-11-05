import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 60,
        lines: 70,
      },
      exclude: [
        'src/instrument.js',
        'src/storage.ts',
        'dist/**',
        '**/*.d.ts',
        'vitest.config.ts',
      ],
    },
  },
});


