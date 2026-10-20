import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function pwaCleanupPlugin() {
  return {
    name: 'pwa-cleanup-handler',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.includes('@vite-plugin-pwa')) {
          res.setHeader('Content-Type', 'application/javascript');
          res.statusCode = 200;
          res.end('// PWA cleanup stub');
          return;
        }
        if (req.url && (req.url.startsWith('/manifest.webmanifest') || req.url.startsWith('/manifest.json'))) {
          res.setHeader('Content-Type', 'application/manifest+json');
          res.statusCode = 200;
          res.end(JSON.stringify({
            name: "Nexentra Security Audit",
            short_name: "Nexentra",
            start_url: "/",
            display: "standalone",
            background_color: "#f8fafc",
            theme_color: "#0f172a",
            icons: [
              {
                src: "/favicon.svg",
                sizes: "any",
                type: "image/svg+xml"
              }
            ]
          }));
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), pwaCleanupPlugin()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

