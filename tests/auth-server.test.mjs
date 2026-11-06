import assert from 'node:assert/strict'
import { once } from 'node:events'
import test from 'node:test'

import { createAuthServer } from './fixtures/auth-server.mjs'

test('auth smoke fixture returns explicit successful and unexpected callback targets', async () => {
  const server = createAuthServer().listen(0, '127.0.0.1')
  await once(server, 'listening')
  const origin = `http://127.0.0.1:${server.address().port}`

  try {
    const success = await fetch(`${origin}/complete`, { redirect: 'manual' })
    const wrong = await fetch(`${origin}/wrong`, { redirect: 'manual' })

    assert.equal(success.status, 302)
    assert.equal(
      success.headers.get('location'),
      'inappbrowsernitro://callback?code=demo&state=smoke'
    )
    assert.equal(
      wrong.headers.get('location'),
      'inappbrowsernitro://unexpected?code=demo&state=smoke'
    )
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    )
  }
})
