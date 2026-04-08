import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const ORT_DIST = path.resolve('./node_modules/onnxruntime-web/dist')

// Serve onnxruntime .mjs files directly from node_modules.
// They cannot live in public/ because Vite blocks dynamic import() of public files.
const serveOrtModules = {
  name: 'serve-ort-modules',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = (req.url || '').split('?')[0]
      if (url.startsWith('/ort-') && url.endsWith('.mjs')) {
        const filepath = path.join(ORT_DIST, path.basename(url))
        if (fs.existsSync(filepath)) {
          res.setHeader('Content-Type', 'application/javascript')
          fs.createReadStream(filepath).pipe(res)
          return
        }
      }
      next()
    })
  },
}

export default defineConfig({
  plugins: [react(), serveOrtModules],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
