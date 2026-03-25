import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load environment variables for the API mock
  const env = loadEnv(mode, process.cwd(), '')

  // Vite plugin to mock Vercel API routes locally during `npm run dev`
  const apiPlugin = {
    name: 'api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url.startsWith('/api/') && req.method === 'POST') {
          try {
            // Load environment variables so the backend file gets them
            process.env.VITE_CLAUDE_API_KEY = env.VITE_CLAUDE_API_KEY || process.env.VITE_CLAUDE_API_KEY
            
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                // Map url to the correct file path
                const filePath = `.${req.url}.js`
                const { default: handler } = await server.ssrLoadModule(filePath)
                
                // Parse incoming body
                req.body = body ? JSON.parse(body) : {}
                
                // Mock Vercel specific response methods
                res.status = (code) => { res.statusCode = code; return res }
                res.json = (data) => {
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(data))
                }
                
                // Call the handler
                await handler(req, res)
              } catch (innerErr) {
                console.error('[vite api mock] execution error:', innerErr)
                res.statusCode = 500
                res.end(JSON.stringify({ error: innerErr.message }))
              }
            })
          } catch (e) {
            console.error('[vite api mock] setup error:', e)
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }
        next()
      })
    }
  }

  return {
    plugins: [react(), apiPlugin],
  }
})
