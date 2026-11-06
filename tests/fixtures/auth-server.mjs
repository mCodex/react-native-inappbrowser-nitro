import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'

export const createAuthServer = () =>
  createServer((request, response) => {
    if (request.url === '/complete' || request.url === '/wrong') {
      const host = request.url === '/wrong' ? 'unexpected' : 'callback'

      response.writeHead(302, {
        Location: `inappbrowsernitro://${host}?code=demo&state=smoke`,
        'Cache-Control': 'no-store',
      })
      response.end()
      return
    }

    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    response.end(
      '<!doctype html><meta name="viewport" content="width=device-width"><a href="/complete">Complete authentication</a>'
    )
  })

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const server = createAuthServer()

  server.on('error', (error) => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })

  server.listen(8082, '127.0.0.1', () => {
    process.stdout.write('Auth smoke server: http://127.0.0.1:8082\n')
  })
}
