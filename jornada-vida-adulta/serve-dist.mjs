import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { createServer } from 'node:http'

const port = Number(process.env.PORT || 4173)
const root = join(process.cwd(), 'dist')

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
}

function resolvePath(urlPath) {
  const pathname = decodeURIComponent((urlPath || '/').split('?')[0])
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, '')
  const candidate = join(root, safePath)

  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate
  }

  return join(root, 'index.html')
}

createServer((req, res) => {
  const filePath = resolvePath(req.url)
  const ext = extname(filePath)

  res.writeHead(200, {
    'Content-Type': contentTypes[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  })

  createReadStream(filePath).pipe(res)
}).listen(port, '0.0.0.0', () => {
  console.log(`Static server running at http://localhost:${port}/`)
})
