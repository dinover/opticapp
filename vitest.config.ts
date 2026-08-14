import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Sin esto, vitest levanta también los tests ya compilados a CommonJS que
    // quedan en dist/ después de un build, y fallan al importar vitest.
    exclude: ['node_modules/**', 'dist/**', 'frontend/**'],
    setupFiles: ['./src/__tests__/setup.ts'],
    // Los tests de integración comparten una única base: si corren en paralelo
    // se pisan los TRUNCATE entre sí.
    fileParallelism: false,
  },
});
