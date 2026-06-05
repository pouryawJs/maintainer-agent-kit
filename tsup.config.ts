import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/action.ts'],
  format: ['cjs'],
  target: 'node20',
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  splitting: false,
  shims: true
});
