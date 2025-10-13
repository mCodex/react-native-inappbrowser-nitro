import { NitroModules } from 'react-native-nitro-modules'

import type {
  InappbrowserNitro,
  InAppBrowserAuthResult,
  InAppBrowserOptions,
  InAppBrowserResult,
} from '../specs/inappbrowser-nitro.nitro'
import type { UseInAppBrowserReturn } from '../hooks/useInAppBrowser'
import { normalizeOptions } from '../utils/options'
import { normalizeUrl } from '../utils/url'

let cachedModule: InappbrowserNitro | null = null

const getNativeModule = (): InappbrowserNitro => {
  if (!cachedModule) {
    cachedModule = NitroModules.createHybridObject<InappbrowserNitro>(
      'InappbrowserNitro'
    )
  }

  return cachedModule
}

const mapOptions = (options?: InAppBrowserOptions) => normalizeOptions(options)

/**
 * Public imperative API for the in-app browser Nitro module.
 */
export class InAppBrowser {
  /** Optional React hook injector (populated in index.ts). */
  static useInAppBrowser?: () => UseInAppBrowserReturn

  /**
   * Return whether the current device/runtime can present the in-app browser.
   */
  static async isAvailable(): Promise<boolean> {
    return getNativeModule().isAvailable()
  }

  /**
   * Launch the in-app browser with the provided URL and options.
   */
  static async open(
    url: string,
    options?: InAppBrowserOptions
  ): Promise<InAppBrowserResult> {
    const sanitizedUrl = normalizeUrl(url)
    const sanitizedOptions = mapOptions(options)
    return getNativeModule().open(sanitizedUrl, sanitizedOptions)
  }

  /**
   * Launch the authentication browser flow, resolving with the redirect payload.
   */
  static async openAuth(
    url: string,
    redirectUrl: string,
    options?: InAppBrowserOptions
  ): Promise<InAppBrowserAuthResult> {
    const sanitizedUrl = normalizeUrl(url)

    const sanitizedRedirect = normalizeUrl(redirectUrl)

    const sanitizedOptions = mapOptions(options)

    return getNativeModule().openAuth(
      sanitizedUrl,
      sanitizedRedirect,
      sanitizedOptions
    )
  }

  /**
   * Close the currently visible browser instance.
   */
  static async close(): Promise<void> {
    return getNativeModule().close()
  }

  /**
   * Close the currently active authentication session.
   */
  static async closeAuth(): Promise<void> {
    return getNativeModule().closeAuth()
  }

  /**
   * Warm up native browser resources to improve first paint latency.
   */
  static async warmup(options?: InAppBrowserOptions): Promise<void> {
    const sanitizedOptions = mapOptions(options)
    
    return getNativeModule().warmup(sanitizedOptions)
  }
}
