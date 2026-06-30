// @ts-nocheck
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'http'
import {
  clearSessionCookieHeader,
  createSessionToken,
  getAdminPassword,
  hasAdminSession,
  isAdminAuthEnabled,
  sessionCookieHeader,
} from './netlify/lib/admin-session.mjs'

const SPREADSHEET_ID = '1ko8p-HMzXMnSHT8qPxv14X-TPaac0RJTrfw8PwjikH8'
const EVENTS_GID = '1023308778'
const SUBMISSIONS_GID = '1055272051'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    req.on('error', reject)
  })
}

function mockEvent(req: IncomingMessage) {
  return {
    headers: {
      cookie: req.headers.cookie || '',
      host: req.headers.host || '',
    },
  }
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown, extraHeaders: Record<string, string> = {}) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  for (const [key, value] of Object.entries(extraHeaders)) {
    res.setHeader(key, value)
  }
  res.end(JSON.stringify(body))
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const sheetApiUrl = env.GOOGLE_APPS_SCRIPT_URL || env.VITE_GOOGLE_APPS_SCRIPT_URL

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'puddles-api-dev',
        configureServer(server) {
          server.middlewares.use('/api/admin-auth', async (req, res) => {
            const event = mockEvent(req)

            if (req.method === 'GET') {
              sendJson(res, 200, {
                ok: true,
                authRequired: isAdminAuthEnabled(),
                authenticated: hasAdminSession(event),
              })
              return
            }

            if (req.method !== 'POST') {
              sendJson(res, 405, { ok: false, error: 'Method not allowed' })
              return
            }

            let body: { action?: string; password?: string }
            try {
              body = JSON.parse(await readBody(req))
            } catch {
              sendJson(res, 400, { ok: false, error: 'Invalid JSON body' })
              return
            }

            if (body.action === 'logout') {
              sendJson(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookieHeader(event) })
              return
            }

            if (!isAdminAuthEnabled()) {
              sendJson(res, 503, {
                ok: false,
                error: 'Admin password is not configured. Set ADMIN_PASSWORD in .env.local.',
              })
              return
            }

            const password = String(body.password || '')
            if (!password || password !== getAdminPassword()) {
              sendJson(res, 401, { ok: false, error: 'Incorrect password' })
              return
            }

            const token = createSessionToken()
            sendJson(res, 200, { ok: true }, { 'Set-Cookie': sessionCookieHeader(token, event) })
          })

          server.middlewares.use('/api/sheet-csv', async (req, res) => {
            const event = mockEvent(req)
            if (isAdminAuthEnabled() && !hasAdminSession(event)) {
              sendJson(res, 401, { ok: false, error: 'Unauthorized' })
              return
            }

            const exportUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${EVENTS_GID}`
            try {
              const response = await fetch(exportUrl)
              if (!response.ok) {
                sendJson(res, response.status, { ok: false, error: `Sheet export failed (${response.status})` })
                return
              }
              res.statusCode = 200
              res.setHeader('Content-Type', 'text/csv; charset=utf-8')
              res.end(await response.text())
            } catch (error) {
              sendJson(res, 502, {
                ok: false,
                error: error instanceof Error ? error.message : 'Sheet CSV proxy failed',
              })
            }
          })

          server.middlewares.use('/api/sheet-submissions-csv', async (req, res) => {
            const event = mockEvent(req)
            if (isAdminAuthEnabled() && !hasAdminSession(event)) {
              sendJson(res, 401, { ok: false, error: 'Unauthorized' })
              return
            }

            const exportUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SUBMISSIONS_GID}`
            try {
              const response = await fetch(exportUrl)
              if (!response.ok) {
                sendJson(res, response.status, {
                  ok: false,
                  error: `Submissions export failed (${response.status})`,
                })
                return
              }
              res.statusCode = 200
              res.setHeader('Content-Type', 'text/csv; charset=utf-8')
              res.end(await response.text())
            } catch (error) {
              sendJson(res, 502, {
                ok: false,
                error: error instanceof Error ? error.message : 'Submissions CSV proxy failed',
              })
            }
          })

          server.middlewares.use('/api/sheet-api', async (req, res) => {
            if (req.method !== 'POST') {
              sendJson(res, 405, { ok: false, error: 'Method not allowed' })
              return
            }

            const bodyText = await readBody(req)
            let body: { action?: string }
            try {
              body = JSON.parse(bodyText)
            } catch {
              sendJson(res, 400, { ok: false, error: 'Invalid JSON body' })
              return
            }

            const isPublicAction = body.action === 'appendSubmission'
            const event = mockEvent(req)
            if (!isPublicAction && isAdminAuthEnabled() && !hasAdminSession(event)) {
              sendJson(res, 401, { ok: false, error: 'Unauthorized' })
              return
            }

            if (!sheetApiUrl) {
              sendJson(res, 503, {
                ok: false,
                error: 'Set GOOGLE_APPS_SCRIPT_URL in .env.local to test submissions locally.',
              })
              return
            }

            try {
              const upstream = await fetch(sheetApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: bodyText,
                redirect: 'follow',
              })
              const text = await upstream.text()
              res.statusCode = upstream.status
              res.setHeader('Content-Type', 'application/json')
              res.end(text)
            } catch (error) {
              sendJson(res, 502, {
                ok: false,
                error: error instanceof Error ? error.message : 'Proxy failed',
              })
            }
          })
        },
      },
    ],
  }
})
