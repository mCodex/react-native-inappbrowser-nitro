/**
 * Validate and sanitize a URL string before passing it to the native layer.
 * Throws if the URL is empty, missing a scheme, or uses an unsafe scheme.
 */
export const normalizeUrl = (candidate: string): string => {
  const trimmed = candidate?.trim()
  
  if (!trimmed) {
    throw new Error('URL must be a non-empty string.')
  }

  const schemeMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):/i)
  if (!schemeMatch) {
    throw new Error('URL must include a valid URI scheme (e.g. https://).')
  }

  const scheme = schemeMatch[1]?.toLowerCase()

  if (!scheme) {
    throw new Error('URL scheme could not be determined.')
  }

  const deniedSchemes = new Set(['javascript', 'data', 'vbscript'])

  if (deniedSchemes.has(scheme)) {
    throw new Error(`The URI scheme "${scheme}" is not allowed for security reasons.`)
  }

  return trimmed
}
