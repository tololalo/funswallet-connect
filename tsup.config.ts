import { defineConfig } from 'tsup';

export default defineConfig([
  // npm builds: ESM + CJS + type declarations. Deps stay external.
  // `src/wagmi.ts` is a separate entry so wagmi/viem stay optional peers.
  {
    entry: ['src/index.ts', 'src/wagmi.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2020',
    external: ['@wagmi/core', 'viem'],
  },
  // CDN build: single self-contained IIFE exposing `window.FunsConnect`.
  // Everything bundled so a plain <script> tag works with no build step.
  {
    entry: { 'funs-connect': 'src/index.ts' },
    format: ['iife'],
    globalName: 'FunsConnect',
    outExtension: () => ({ js: '.global.js' }),
    noExternal: [/.*/],
    platform: 'browser',
    minify: true,
    sourcemap: false,
    target: 'es2020',
    define: {
      'process.env.NODE_ENV': '"production"',
      global: 'globalThis',
    },
  },
]);
