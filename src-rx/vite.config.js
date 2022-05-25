import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from '@honkhonk/vite-plugin-svgr'
import { viteCommonjs, esbuildCommonjs } from '@originjs/vite-plugin-commonjs';
import federation from '@originjs/vite-plugin-federation'
import pkg from './package.json'

export default defineConfig(({ mode }) => {
  return {
  plugins: [react(), svgr(), viteCommonjs(),
    federation({
      remotes: {
        CustomComponent: {
          external: 'Promise.resolve(window._customComponent)',
          externalType: 'promise'
        }
      },
      shared: {
        '@iobroker/adapter-react-v5': {
          singleton: true,
        },
        react: {
          singleton: true,
          // requiredVersion: pkg.dependencies.react,
        },
        'react-dom': {
          singleton: true,
          // requiredVersion: pkg.dependencies['react-dom'],
        },
        '@mui/material': {
          singleton: true,
          // requiredVersion: pkg.dependencies['@mui/material'],
        }
      }
    })
  ],
  server: {
    proxy: {
      '/files': 'http://localhost:8081',
      '/adapter': 'http://localhost:8081',
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
}
});