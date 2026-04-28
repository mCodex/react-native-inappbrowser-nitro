import type { HybridObject } from 'react-native-nitro-modules'

import type {
  InAppBrowserAuthResult,
  InAppBrowserOptions,
  InAppBrowserResult,
} from '../types'

/**
 * Native bridge spec consumed by Nitrogen to generate the iOS (Swift) and
 * Android (Kotlin) hybrid object scaffolding.
 *
 * @internal Application code should use the imperative API exported from the
 * package root (`open`, `openAuth`, `close`, `closeAuth`, `isAvailable`) or
 * the {@link useInAppBrowser} hook — not this interface directly.
 */
export interface InappbrowserNitro
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /** Report whether the native runtime can present an in-app browser. */
  isAvailable(): Promise<boolean>

  /** Present an in-app browser with the supplied configuration. */
  open(url: string, options?: InAppBrowserOptions): Promise<InAppBrowserResult>

  /** Launch an authentication flow and resolve with the redirect payload. */
  openAuth(
    url: string,
    redirectUrl: string,
    options?: InAppBrowserOptions
  ): Promise<InAppBrowserAuthResult>

  /** Close any visible browser session. */
  close(): Promise<void>

  /** Dismiss an ongoing authentication session. */
  closeAuth(): Promise<void>
}
