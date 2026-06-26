import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const SPREADSHEET_ID = '1ko8p-HMzXMnSHT8qPxv14X-TPaac0RJTrfw8PwjikH8'
const EVENTS_GID = '1023308778'
const SUBMISSIONS_GID = '1055272051'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const sheetApiUrl = env.GOOGLE_APPS_SCRIPT_URL || env.VITE_GOOGLE_APPS_SCRIPT_URL

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'sheet-api-dev-proxy',
        configureServer(server) {
          server.middlewares.use('/api/sheet-api', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }))
              return
            }

            if (!sheetApiUrl) {
              res.statusCode = 503
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  ok: false,
                  error:
                    'Set GOOGLE_APPS_SCRIPT_URL in .env.local to test submissions locally.',
                }),
              )
              return
            }

            const chunks: Buffer[] = []
            req.on('data', (chunk) => chunks.push(chunk))
            req.on('end', async () => {
              try {
                const body = Buffer.concat(chunks).toString()
                const upstream = await fetch(sheetApiUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body,
                  redirect: 'follow',
                })
                const text = await upstream.text()
                res.statusCode = upstream.status
                res.setHeader('Content-Type', 'application/json')
                res.end(text)
              } catch (error) {
                res.statusCode = 502
                res.setHeader('Content-Type', 'application/json')
                res.end(
                  JSON.stringify({
                    ok: false,
                    error: error instanceof Error ? error.message : 'Proxy failed',
                  }),
                )
              }
            })
          })
        },
      },
    ],
    server: {
      proxy: {
        '/api/sheet-csv': {
          target: 'https://docs.google.com',
          changeOrigin: true,
          rewrite: () =>
            `/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${EVENTS_GID}`,
        },
        '/api/sheet-submissions-csv': {
          target: 'https://docs.google.com',
          changeOrigin: true,
          rewrite: () =>
            `/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SUBMISSIONS_GID}`,
        },
      },
    },
  }
})
