import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    // Un único MongoDB en memoria (replica set, para las transacciones) para toda la corrida.
    globalSetup: ['./test/global-setup.js'],
    setupFiles: ['./test/setup-env.js'],
    testTimeout: 30000,
    // La primera corrida descarga el binario de mongod.
    hookTimeout: 180000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      reporter: ['text', 'html', 'lcov']
    }
  }
});
