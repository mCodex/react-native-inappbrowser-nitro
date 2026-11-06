import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeOptions } from '../src/utils/options.ts'
import { validateUrl } from '../src/utils/url.ts'

test('normalization preserves flags and trims headers, colors and animations', () => {
  const options = {
    showTitle: false,
    headers: { ' X-Test ': ' value ', Empty: ' ' },
    toolbarColor: { base: ' #123456 ', dark: ' ' },
    animations: { startEnter: ' slide_in ', endExit: ' ' },
  }

  assert.deepEqual(normalizeOptions(options), {
    showTitle: false,
    headers: { 'X-Test': 'value' },
    toolbarColor: { base: '#123456' },
    animations: { startEnter: 'slide_in' },
  })
  assert.equal(options.toolbarColor.base, ' #123456 ')
})

test('empty and nullish options do not cross the native seam', () => {
  assert.equal(normalizeOptions(), undefined)
  assert.equal(
    normalizeOptions({ headers: {}, animations: {}, toolbarColor: {} }),
    undefined
  )
})

test('callback URLs retain custom schemes while unsafe schemes are rejected', () => {
  assert.equal(validateUrl(' myapp://callback '), 'myapp://callback')

  for (const url of [
    '',
    'example.com',
    'JAVASCRIPT:alert(1)',
    'data:text/plain,a',
    'vbscript:a',
  ]) {
    assert.throws(() => validateUrl(url))
  }

  assert.throws(() => validateUrl(null), TypeError)
})
