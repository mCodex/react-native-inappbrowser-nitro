import type { InAppBrowserOptions } from '../types'

const COLOR_KEYS = new Set([
  'preferredBarTintColor',
  'preferredControlTintColor',
  'toolbarColor',
  'secondaryToolbarColor',
  'navigationBarColor',
  'navigationBarDividerColor',
])

/** Trim whitespace from every string value in a record, drop empty results. */
const trimStringValues = (
  obj: Record<string, unknown>
): Record<string, string> => {
  const next: Record<string, string> = {}
  for (const key of Object.keys(obj)) {
    const val = obj[key]
    if (typeof val === 'string') {
      const trimmed = val.trim()
      if (trimmed) next[key] = trimmed
    }
  }
  return next
}

/** Trim keys and values in an HTTP headers record, drop empty entries. */
const sanitizeHeaders = (
  headers: Record<string, string>
): Record<string, string> => {
  const result: Record<string, string> = {}

  for (const key of Object.keys(headers)) {
    const value = headers[key]
    if (typeof value !== 'string') continue

    const trimmedKey = key.trim()
    const trimmedValue = value.trim()
    if (trimmedKey && trimmedValue) {
      result[trimmedKey] = trimmedValue
    }
  }

  return result
}

/**
 * Clean and normalize browser options for the JSI boundary.
 * Trims string values, sanitizes headers, and strips nullish entries.
 */
export const normalizeOptions = (
  options?: InAppBrowserOptions
): InAppBrowserOptions | undefined => {
  if (!options) return undefined

  const cleaned: Partial<InAppBrowserOptions> = {}

  for (const key of Object.keys(options) as (keyof InAppBrowserOptions &
    string)[]) {
    const value = options[key]
    if (value === undefined || value === null) continue

    if (key === 'headers') {
      const result = sanitizeHeaders(value as Record<string, string>)
      if (Object.keys(result).length > 0) {
        ;(cleaned as Record<string, unknown>)[key] = result
      }
      continue
    }

    if (COLOR_KEYS.has(key)) {
      const result = trimStringValues(value as Record<string, unknown>)
      if (Object.keys(result).length > 0) {
        ;(cleaned as Record<string, unknown>)[key] = result
      }
      continue
    }

    if (key === 'animations') {
      const result = trimStringValues(value as Record<string, unknown>)
      if (Object.keys(result).length > 0) {
        ;(cleaned as Record<string, unknown>)[key] = result
      }
      continue
    }

    ;(cleaned as Record<string, unknown>)[key] = value
  }

  return Object.keys(cleaned).length > 0
    ? (cleaned as InAppBrowserOptions)
    : undefined
}
