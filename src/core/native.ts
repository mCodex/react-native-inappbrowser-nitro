import { getHybridObjectConstructor } from 'react-native-nitro-modules'

import type { InappbrowserNitro } from '../specs/inappbrowser-nitro.nitro'
import type {
  InAppBrowserAuthResult,
  InAppBrowserOptions,
  InAppBrowserResult,
} from '../types'
import { normalizeOptions } from '../utils/options'
import { validateUrl } from '../utils/url'

/** @internal Lazy-initialized JSI hybrid object cache. */
let _native: InappbrowserNitro | null = null

/**
 * Lazily resolve the Nitro hybrid object. Keeping construction behind a
 * getter avoids any native allocation at module import time, so consumers
 * that only import types pay no startup cost.
 */
const getNative = (): InappbrowserNitro => {
  if (_native !== null) return _native
  const Ctor =
    getHybridObjectConstructor<InappbrowserNitro>('InappbrowserNitro')
  _native = new Ctor()
  return _native
}

/**
 * Report whether an in-app browser is available on the current device.
 *
 * - On iOS this is always `true`.
 * - On Android it depends on whether a Custom Tabs compatible browser is
 *   installed (Chrome, Samsung Internet, etc.).
 *
 * @example
 * ```ts
 * if (await isAvailable()) {
 *   await open('https://example.com')
 * }
 * ```
 * @see {@link InappbrowserNitro.isAvailable}
 */
export const isAvailable = (): Promise<boolean> => getNative().isAvailable()

/**
 * Present an in-app browser for `url` with optional platform configuration.
 *
 * Resolves with the final {@link InAppBrowserResult} once the user dismisses
 * the browser or the system closes it.
 *
 * @throws {Error} if `url` is empty, missing a scheme, or uses a denied
 * scheme (`javascript:`, `data:`, `vbscript:`).
 *
 * @example
 * ```ts
 * const result = await open('https://example.com', {
 *   preferredBarTintColor: { light: '#FFFFFF', dark: '#000000' },
 * })
 * if (result.type === 'success') { … }
 * ```
 * @see {@link InappbrowserNitro.open}
 */
export const open = (
  url: string,
  options?: InAppBrowserOptions
): Promise<InAppBrowserResult> =>
  getNative().open(validateUrl(url), normalizeOptions(options))

/**
 * Launch an authentication session for `url` and resolve when the native
 * runtime intercepts a navigation matching `redirectUrl`.
 *
 * @throws {Error} if either `url` or `redirectUrl` is empty, missing a
 * scheme, or uses a denied scheme.
 *
 * @example
 * ```ts
 * const result = await openAuth(
 *   'https://example.com/oauth/authorize?…',
 *   'myapp://callback'
 * )
 * ```
 * @see {@link InappbrowserNitro.openAuth}
 */
export const openAuth = (
  url: string,
  redirectUrl: string,
  options?: InAppBrowserOptions
): Promise<InAppBrowserAuthResult> =>
  getNative().openAuth(
    validateUrl(url),
    validateUrl(redirectUrl),
    normalizeOptions(options)
  )

/**
 * Dismiss any currently visible in-app browser opened via {@link open}.
 * No-op when no browser is presented.
 *
 * @see {@link InappbrowserNitro.close}
 */
export const close = (): Promise<void> => getNative().close()

/**
 * Dismiss any currently running authentication session opened via
 * {@link openAuth}. No-op when no session is active.
 *
 * @see {@link InappbrowserNitro.closeAuth}
 */
export const closeAuth = (): Promise<void> => getNative().closeAuth()
