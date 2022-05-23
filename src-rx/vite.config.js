import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from '@honkhonk/vite-plugin-svgr'
import { viteCommonjs, esbuildCommonjs } from '@originjs/vite-plugin-commonjs';

export default defineConfig({
  plugins: [react(), svgr(), viteCommonjs()],
  server: {
    proxy: {
      '/files': 'http://localhost:8081',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        // Solves:
        // https://github.com/vitejs/vite/issues/5308
        esbuildCommonjs(['@iobroker/adapter-react'])
      ],
    },
  },
});