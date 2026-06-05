import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
const alerts = [];
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'webhook-server',
      configureServer(server) {
        server.middlewares.use('/webhook/alert', (req, res) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');
          if (req.method === 'OPTIONS') { res.end(); return; }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', d => body += d);
            req.on('end', () => {
              try { alerts.unshift({ ...JSON.parse(body), ts: new Date().toISOString() }); if (alerts.length > 500) alerts.pop(); } catch(e) {}
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            });
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ alerts: alerts.slice(0, 100) }));
          }
        });
      }
    }
  ],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/index.js',
        assetFileNames: 'assets/index.[ext]',
      }
    }
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://10.200.1.87:8766',
        changeOrigin: true,
      },
      '/tm-api': {
        target: 'https://onlinegaming.teramind.co',
        changeOrigin: true,
        secure: true,
        headers: { 'x-access-token': '8510842ce184994e84d6727c2b0691d0c3961c4d' }
      }
    }
  }
})
