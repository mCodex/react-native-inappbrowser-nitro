import type {
  BrowserAnimations,
  DynamicColor,
  InAppBrowserOptions,
} from '../specs/inappbrowser-nitro.nitro'

const COLOR_OPTION_KEYS = new Set<keyof InAppBrowserOptions>([
  'preferredBarTintColor',
  'preferredControlTintColor',
  'toolbarColor',
  'secondaryToolbarColor',
  'navigationBarColor',
  'navigationBarDividerColor',
])

const sanitizeColor = (value: DynamicColor | string | undefined) => {
  if (!value) {
    return undefined
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? { base: trimmed } : undefined
  }

  const payload: DynamicColor = {}

  if (value.base?.trim()) {
    payload.base = value.base.trim()
  }
  if (value.light?.trim()) {
    payload.light = value.light.trim()
  }
  if (value.dark?.trim()) {
    payload.dark = value.dark.trim()
  }
  if (value.highContrast?.trim()) {
    payload.highContrast = value.highContrast.trim()
  }

  return Object.keys(payload).length > 0 ? payload : undefined
}

const sanitizeAnimations = (animations?: BrowserAnimations) => {
  if (!animations) {
    return undefined
  }

  const sanitized: BrowserAnimations = {}
  if (animations.startEnter?.trim()) {
    sanitized.startEnter = animations.startEnter.trim()
  }
  if (animations.startExit?.trim()) {
    sanitized.startExit = animations.startExit.trim()
  }
  if (animations.endEnter?.trim()) {
    sanitized.endEnter = animations.endEnter.trim()
  }
  if (animations.endExit?.trim()) {
    sanitized.endExit = animations.endExit.trim()
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined
}

const sanitizeHeaders = (headers?: Record<string, string>) => {
  if (!headers) {
    return undefined
  }

  const sanitized: Record<string, string> = {}
  for (const [key, currentValue] of Object.entries(headers)) {
    if (typeof currentValue !== 'string') {
      continue
    }

    const normalizedKey = key.trim()
    if (!normalizedKey) {
      continue
    }

    sanitized[normalizedKey] = currentValue
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined
}

/**
 * Remove undefined entries and sanitize nested values before hitting native.
 */
export const normalizeOptions = (options?: InAppBrowserOptions) => {
  if (!options) {
    return undefined
  }

  const sanitized: InAppBrowserOptions = {}

  for (const [key, value] of Object.entries(options)) {
    if (value === undefined || value === null) {
      continue
    }

    if (COLOR_OPTION_KEYS.has(key as keyof InAppBrowserOptions)) {
      const normalizedColor = sanitizeColor(value as string | DynamicColor)
      if (normalizedColor) {
        // @ts-expect-error - dynamic key assignment is safe for optional props
        sanitized[key] = normalizedColor
      }
      continue
    }

    if (key === 'headers') {
      const normalizedHeaders = sanitizeHeaders(value as Record<string, string>)
      if (normalizedHeaders) {
        sanitized.headers = normalizedHeaders
      }
      continue
    }

    if (key === 'animations') {
      const normalizedAnimations = sanitizeAnimations(value as BrowserAnimations)
      if (normalizedAnimations) {
        sanitized.animations = normalizedAnimations
      }
      continue
    }

    // @ts-expect-error - dynamic key assignment is safe for optional props
    sanitized[key] = value
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined
}
