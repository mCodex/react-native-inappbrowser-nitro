import type {
  BrowserAnimations,
  DynamicColor,
  InAppBrowserOptions,
} from '../types'

/**
 * Return `obj` when it has at least one own key, otherwise `undefined`.
 * Used to elide empty nested payloads before they cross JSI.
 */
const compact = <T extends object>(obj: T): T | undefined =>
  Object.keys(obj).length > 0 ? obj : undefined

const DYNAMIC_COLOR_KEYS = [
  'base',
  'light',
  'dark',
  'highContrast',
] as const satisfies readonly (keyof DynamicColor)[]

const ANIMATION_KEYS = [
  'startEnter',
  'startExit',
  'endEnter',
  'endExit',
] as const satisfies readonly (keyof BrowserAnimations)[]

/**
 * Whitelist-trim string fields. Returns `null` when the input was already
 * bridge-safe (caller can keep its original reference); otherwise returns the
 * new payload (or `undefined` when every entry was dropped).
 *
 * "Bridge-safe" means: every own property is a non-empty trimmed string AND
 * is in the whitelist. Any explicit `undefined`, non-string value, or extra
 * enumerable key forces a fresh object so the value crossing JSI is clean.
 */
const trimStringFields = <T extends object>(
  source: T,
  keys: readonly (keyof T)[]
): T | undefined | null => {
  const ownKeyCount = Object.keys(source).length
  let out: Partial<T> | null = null
  let mutated = false
  let kept = 0

  for (const key of keys) {
    const value = source[key]
    if (typeof value !== 'string') {
      // Any own non-string property (including explicit `undefined`) needs
      // to be stripped before bridging.
      if (key in source) mutated = true
      continue
    }
    const trimmed = value.trim()
    if (!trimmed) {
      mutated = true
      continue
    }
    if (trimmed !== value) mutated = true
    if (out === null) out = {}
    out[key] = trimmed as T[keyof T]
    kept++
  }

  // Extra (non-whitelisted) own keys also require sanitization.
  if (!mutated && kept === ownKeyCount) return null
  return out ? (compact(out) as T | undefined) : undefined
}

const sanitizeColor = (value: DynamicColor) =>
  trimStringFields(value, DYNAMIC_COLOR_KEYS)

const sanitizeAnimations = (value: BrowserAnimations) =>
  trimStringFields(value, ANIMATION_KEYS)

const sanitizeHeaders = (
  headers: Record<string, string>
): Record<string, string> | undefined | null => {
  let out: Record<string, string> | null = null
  let mutated = false

  for (const key of Object.keys(headers)) {
    const value = headers[key]
    if (typeof value !== 'string') {
      mutated = true
      continue
    }
    const normalizedKey = key.trim()
    if (!normalizedKey) {
      mutated = true
      continue
    }
    if (normalizedKey !== key) mutated = true
    if (out === null) out = {}
    out[normalizedKey] = value
  }

  if (!mutated) return null
  return out ? compact(out) : undefined
}

type Sanitizer<V> = (value: V) => V | undefined | null

type SanitizerMap = {
  [K in keyof InAppBrowserOptions]?: Sanitizer<
    NonNullable<InAppBrowserOptions[K]>
  >
}

const SANITIZERS: SanitizerMap = {
  preferredBarTintColor: sanitizeColor,
  preferredControlTintColor: sanitizeColor,
  toolbarColor: sanitizeColor,
  secondaryToolbarColor: sanitizeColor,
  navigationBarColor: sanitizeColor,
  navigationBarDividerColor: sanitizeColor,
  headers: sanitizeHeaders,
  animations: sanitizeAnimations,
}

/**
 * Remove `undefined`/`null` entries and sanitize nested values before the
 * options object is bridged to the native hybrid module.
 *
 * Fast paths (zero allocations):
 * - When no options are supplied, returns `undefined`.
 * - When every field is already clean, returns the original `options` reference
 *   so consumers passing a stable object incur no GC churn per call.
 */
export const normalizeOptions = (
  options?: InAppBrowserOptions
): InAppBrowserOptions | undefined => {
  if (!options) return undefined

  // Fast first pass: detect whether anything needs to change.
  // Sanitizers return `null` only when the input is already bridge-safe
  // (see `trimStringFields`), so `sanitizer(value) !== null` is a sound
  // dirty-check predicate without needing a separate traversal.
  let dirty = false
  const keys = Object.keys(options)

  for (const key of keys) {
    const typedKey = key as keyof InAppBrowserOptions & string
    const value = options[typedKey]
    if (value === undefined || value === null) {
      dirty = true
      break
    }
    const sanitizer = SANITIZERS[typedKey] as Sanitizer<unknown> | undefined
    if (sanitizer && sanitizer(value) !== null) {
      dirty = true
      break
    }
  }

  if (!dirty) return options

  // Slow path: build a new object with sanitized values.
  const out: InAppBrowserOptions = {}
  for (const key of keys) {
    const typedKey = key as keyof InAppBrowserOptions & string
    const value = options[typedKey]
    if (value === undefined || value === null) continue

    const sanitizer = SANITIZERS[typedKey] as Sanitizer<unknown> | undefined
    if (!sanitizer) {
      ;(out as Record<string, unknown>)[typedKey] = value
      continue
    }

    const sanitized = sanitizer(value)
    const next = sanitized === null ? value : sanitized
    if (next === undefined) continue
    ;(out as Record<string, unknown>)[typedKey] = next
  }

  return compact(out)
}
