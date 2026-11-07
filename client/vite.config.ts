import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.ANALYZE === 'true'
      ? [
          visualizer({
            template: 'treemap',
            open: false,
            gzipSize: true,
            filename: 'dist/stats.html',
          }),
        ]
      : []),
  ],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          minSize: 20_000,
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,
              priority: 30,
            },
            {
              name: 'radix-vendor',
              test: /node_modules[\\/](?:@radix-ui|@floating-ui)[\\/]/,
              priority: 20,
            },
            {
              name: 'markdown-vendor',
              test: /node_modules[\\/](?:react-markdown|remark(?:-[^\\/]+)?|micromark(?:-[^\\/]+)?|mdast-util-[^\\/]+|unified|unist-util-[^\\/]+)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})