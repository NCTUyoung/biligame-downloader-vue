import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      sourcemap: true,
      minify: false,
      outDir: 'dist-electron',
      lib: {
        entry: 'electron/main.ts',
        formats: ['cjs'],
        fileName: () => 'main.js',
      },
      emptyOutDir: false,
      rollupOptions: {
        output: {
          entryFileNames: 'main.js',
          format: 'cjs'
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      sourcemap: true,
      minify: false,
      outDir: 'dist-electron',
      lib: {
        entry: 'electron/preload.ts',
        formats: ['cjs'],
        fileName: () => 'preload.js',
      },
      emptyOutDir: false,
      rollupOptions: {
        output: {
          entryFileNames: 'preload.js',
          format: 'cjs'
        }
      }
    }
  },
  renderer: {
    root: process.cwd(),
    resolve: {
      alias: {
        '@': resolve('src/')
      }
    },
    plugins: [vue()],
    publicDir: 'public',
    server: {
      host: '127.0.0.1',
      port: 3000,
      strictPort: true,
      hmr: true,
      watch: {
        usePolling: true
      }
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: resolve('index.html')
      }
    }
  }
})