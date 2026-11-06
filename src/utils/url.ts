const DENIED_SCHEMES = new Set(['javascript', 'data', 'vbscript'])
const SCHEME_PATTERN = /^([a-z][a-z0-9+.-]*):/i

/**
 * Validate a URL string before passing it to the native layer.
 * Throws if the URL is empty, missing a scheme, or uses an unsafe scheme.
 */
export const validateUrl = (candidate: unknown): string => {
  if (typeof candidate !== 'string') {
    throw new TypeError('URL must be a string.')
  }

  const trimmed = candidate.trim()

  if (!trimmed) {
    throw new Error('URL must be a non-empty string.')
  }

  const schemeMatch = SCHEME_PATTERN.exec(trimmed)

  if (schemeMatch === null) {
    throw new Error('URL must include a valid URI scheme (e.g. https://).')
  }

  const scheme = (schemeMatch[1] ?? '').toLowerCase()

  if (DENIED_SCHEMES.has(scheme)) {
    throw new Error(
      `The URI scheme "${scheme}" is not allowed for security reasons.`
    )
  }

  return trimmed
}

/** Initial browser pages must use the schemes supported by Safari and Custom Tabs. */
export const validateBrowserUrl = (candidate: unknown): string => {
  const url = validateUrl(candidate)

  for (let index = 0; index < url.length; index += 1) {
    const code = url.charCodeAt(index)

    if (code <= 32 || code === 127) {
      throw new Error(
        'Browser URL must not contain whitespace or control characters.'
      )
    }
  }

  const parsed = new URL(url)

  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error(
      'Browser URL must be an HTTP(S) URL without embedded credentials.'
    )
  }

  return url
}
