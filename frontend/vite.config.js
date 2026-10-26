import http from 'node:http'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // Node >= 19 reutiliza conexiones (keep-alive) por defecto y Express las cierra
        // a los 5 s de inactividad; si el proxy reutiliza una que se está cerrando,
        // la petición falla con ECONNRESET. Una conexión nueva por petición lo evita.
        agent: new http.Agent({ keepAlive: false }),
      }
    }
  },
  test: {
    environment: 'jsdom',
    // backend/ tiene su propia configuración de Vitest.
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/test/**', 'src/**/*.test.{js,jsx}', 'src/main.jsx'],
      reporter: ['text', 'html', 'lcov'],
    },
  },
})
