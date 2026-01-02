import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { version } from './package.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    '__APP_VERSION__': JSON.stringify(version),
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true, // Ensure we always use 5173 or fail
    proxy: {
      '/api': {
        target: 'https://raider.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy Error (Raider.io):', err);
            // Attempt to log to backend if possible, or just console error since backend might be down
            fetch('http://localhost:3000/api/v1/logs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'ERROR',
                message: `Proxy Error (Raider.io): ${err.message}`,
                stack: err.stack,
                details: { target: 'https://raider.io' }
              })
            }).catch(e => console.error('Failed to log proxy error to backend:', e));
          });
        }
      },
      '/local': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/local/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy Error (Local Backend):', err);
            // We probably can't log to backend if the backend connection itself failed
            // But we can try in case it's a specific endpoint issue
            fetch('http://localhost:3000/api/v1/logs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'ERROR',
                message: `Proxy Error (Local Backend): ${err.message}`,
                stack: err.stack,
                details: { target: 'http://localhost:3000' }
              })
            }).catch(e => console.error('Failed to log proxy error to backend (likely backend down):', e));
          });
        }
      }
    }
  },
})
