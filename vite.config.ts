import react from '@vitejs/plugin-react'
import type { Connect, Plugin } from 'vite'
import { defineConfig } from 'vite'

const GREEN_API_HOST = 'https://api.green-api.com'

function greenApiProxy(): Plugin {
  return {
    name: 'green-api-proxy',
    configureServer(server) {
      server.middlewares.use('/green-api', createGreenApiMiddleware())
    },
    configurePreviewServer(server) {
      server.middlewares.use('/green-api', createGreenApiMiddleware())
    },
  }
}

function createGreenApiMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    try {
      const incomingUrl = new URL(req.url ?? '/', 'http://localhost')
      const target = new URL(
        `${GREEN_API_HOST}${incomingUrl.pathname}${incomingUrl.search}`,
      )

      const chunks: Buffer[] = []
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      }
      const body = Buffer.concat(chunks)

      const headers = new Headers()
      if (req.headers['content-type']) {
        headers.set('Content-Type', String(req.headers['content-type']))
      }

      const upstream = await fetch(target, {
        method: req.method,
        headers,
        body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
      })

      res.statusCode = upstream.status
      const contentType = upstream.headers.get('content-type')
      if (contentType) {
        res.setHeader('Content-Type', contentType)
      }
      const responseBody = Buffer.from(await upstream.arrayBuffer())
      res.end(responseBody)
    } catch (error) {
      next(error)
    }
  }
}

export default defineConfig({
  plugins: [react(), greenApiProxy()],
})
