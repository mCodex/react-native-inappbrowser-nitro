import assert from 'node:assert/strict'
import test from 'node:test'

import * as urls from '../src/utils/url.ts'

test('initial browser URLs require a valid HTTP(S) destination', () => {
  assert.equal(typeof urls.validateBrowserUrl, 'function')
  assert.equal(
    urls.validateBrowserUrl(' https://example.com/path?q=1 '),
    'https://example.com/path?q=1'
  )

  for (const url of [
    'myapp://callback',
    'file:///secret',
    'intent://example',
    'https://',
    'https://user:pass@example.com',
    'https://example.com/\ncallback',
  ]) {
    assert.throws(() => urls.validateBrowserUrl(url))
  }
})
