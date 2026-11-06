import { getHybridObjectConstructor } from 'react-native-nitro-modules'

import type { InappbrowserNitro } from '../specs/inappbrowser-nitro.nitro'
import type {
  InAppBrowserAuthResult,
  InAppBrowserOptions,
  InAppBrowserResult,
} from '../types'
import { normalizeOptions } from '../utils/options'
import { validateBrowserUrl, validateUrl } from '../utils/url'

/** @internal Lazy-initialized JSI hybrid object cache. */
let _native: InappbrowserNitro | null = null

/**
 * Lazily resolve the Nitro hybrid object. Keeping construction behind a
 * getter avoids allocating this library's HybridObject during import.
 * Nitro's own runtime initialization still runs when its module is imported.
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
 * - On Android this also accepts a system browser without Custom Tabs.
 *   Authentication specifically requires a Custom Tabs provider.
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
 * Resolves with an {@link InAppBrowserResult} when presentation or launch succeeds.
 * This does not wait for dismissal or track subsequent navigation.
 *
 * @throws {Error} if `url` is not a valid HTTP(S) URL without credentials.
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
): Promise<InAppBrowserResult> => {
  const validatedUrl = validateBrowserUrl(url)

  return getNative().open(validatedUrl, normalizeOptions(options))
}

/**
 * Launch an authentication session for `url` and resolve when the native
 * runtime intercepts a navigation matching `redirectUrl`.
 *
 * @throws {Error} for invalid initial URLs or unsafe callback URI schemes.
 * Android also requires a callback endpoint without a query or fragment.
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
): Promise<InAppBrowserAuthResult> => {
  const validatedUrl = validateBrowserUrl(url)
  const validatedRedirect = validateUrl(redirectUrl)

  return getNative().openAuth(
    validatedUrl,
    validatedRedirect,
    normalizeOptions(options)
  )
}

/**
 * Dismiss any currently visible in-app browser opened via {@link open}.
 * No-op when no browser is presented.
 * Android normal Custom Tabs must be closed by the user; this method is a no-op.
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
