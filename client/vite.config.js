import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'NGROK_')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      allowedHosts: env.NGROK_HOST ? [env.NGROK_HOST] : [],
      // Share the frontend, API, and live updates through one ngrok tunnel.
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:4000',
          changeOrigin: true,
        },
        '/socket.io': {
          target: 'http://127.0.0.1:4000',
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})
