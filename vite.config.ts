import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Local ComfyUI is proxied at /comfy so the browser never hits CORS.
// Point OPENTV_COMFY_URL at a non-default ComfyUI address if needed.
const COMFY_TARGET = process.env.OPENTV_COMFY_URL ?? 'http://127.0.0.1:8188'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/comfy': {
        target: COMFY_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/comfy/, ''),
      },
    },
  },
})
