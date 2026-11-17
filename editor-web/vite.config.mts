import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const here = dirname(fileURLToPath(import.meta.url));

// Builds the editor page into one self contained HTML file (inlined into the app by `editor:build`).
export default defineConfig({
  root: resolve(here),
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      // Installed inside TenTap's own folder; TipTap core and pm are shared at the top level.
      '@tiptap/react': resolve(here, '../node_modules/@10play/tentap-editor/node_modules/@tiptap/react'),
    },
    dedupe: ['react', 'react-dom', '@tiptap/core', '@tiptap/pm'],
  },
  // TenTap's source checks __DEV__ like React Native code does.
  define: { __DEV__: 'false', 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: resolve(here, 'build'),
    emptyOutDir: true,
  },
});
