import type { HybridObject } from 'react-native-nitro-modules'

import type {
  InAppBrowserAuthResult,
  InAppBrowserOptions,
  InAppBrowserResult,
} from '../types'

export interface InappbrowserNitro
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Report whether the Native runtime can present an in-app browser.
   */
  isAvailable(): Promise<boolean>

  /**
   * Present an in-app browser with the supplied configuration.
   */
  open(url: string, options?: InAppBrowserOptions): Promise<InAppBrowserResult>

  /**
   * Launch an authentication flow and resolve with the redirect payload.
   */
  openAuth(
    url: string,
    redirectUrl: string,
    options?: InAppBrowserOptions
  ): Promise<InAppBrowserAuthResult>

  /**
   * Close any visible browser session.
   */
  close(): Promise<void>

  /**
   * Dismiss an ongoing authentication session.
   */
  closeAuth(): Promise<void>
}
