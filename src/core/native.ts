import { getHybridObjectConstructor } from 'react-native-nitro-modules'

import type { InappbrowserNitro } from '../specs/inappbrowser-nitro.nitro'
import type {
  InAppBrowserAuthResult,
  InAppBrowserOptions,
  InAppBrowserResult,
} from '../types'
import { normalizeOptions } from '../utils/options'
import { normalizeUrl } from '../utils/url'

const HybridInAppBrowser =
  getHybridObjectConstructor<InappbrowserNitro>('InappbrowserNitro')
const native = new HybridInAppBrowser()

export function isAvailable(): Promise<boolean> {
  return native.isAvailable()
}

export function open(
  url: string,
  options?: InAppBrowserOptions
): Promise<InAppBrowserResult> {
  return native.open(normalizeUrl(url), normalizeOptions(options))
}

export function openAuth(
  url: string,
  redirectUrl: string,
  options?: InAppBrowserOptions
): Promise<InAppBrowserAuthResult> {
  return native.openAuth(
    normalizeUrl(url),
    normalizeUrl(redirectUrl),
    normalizeOptions(options)
  )
}

export function close(): Promise<void> {
  return native.close()
}

export function closeAuth(): Promise<void> {
  return native.closeAuth()
}
