import { NitroModules } from 'react-native-nitro-modules';
import type {
  InAppBrowserNitro,
  InAppBrowserOptions,
  InAppBrowserResult,
  InAppBrowserAuthResult,
} from './InAppBrowserNitro.nitro';

const InAppBrowserNitroHybridObject =
  NitroModules.createHybridObject<InAppBrowserNitro>('InAppBrowserNitro');

/**
 * InAppBrowser - A fast, modern in-app browser for React Native using Nitro modules
 *
 * Provides access to the system's web browser (Safari on iOS, Chrome Custom Tabs on Android)
 * with support for authentication flows, deep linking, and performance optimizations.
 */
export class InAppBrowser {
  /**
   * Check if the device supports InAppBrowser
   * @returns Promise<boolean> - true if supported, false otherwise
   */
  static async isAvailable(): Promise<boolean> {
    return InAppBrowserNitroHybridObject.isAvailable();
  }

  /**
   * Open a URL in the in-app browser
   * @param url - The URL to open
   * @param options - Browser configuration options
   * @returns Promise<InAppBrowserResult> - Result of the browser operation
   */
  static async open(
    url: string,
    options?: InAppBrowserOptions
  ): Promise<InAppBrowserResult> {
    return InAppBrowserNitroHybridObject.open(url, options);
  }

  /**
   * Open a URL for authentication flow (OAuth, etc.)
   * @param url - The URL to open for authentication
   * @param redirectUrl - The redirect URL scheme to listen for
   * @param options - Browser configuration options
   * @returns Promise<InAppBrowserAuthResult> - Result of the authentication
   */
  static async openAuth(
    url: string,
    redirectUrl: string,
    options?: InAppBrowserOptions
  ): Promise<InAppBrowserAuthResult> {
    return InAppBrowserNitroHybridObject.openAuth(url, redirectUrl, options);
  }

  /**
   * Close the currently opened in-app browser
   * @returns Promise<void>
   */
  static async close(): Promise<void> {
    return InAppBrowserNitroHybridObject.close();
  }

  /**
   * Close the currently opened authentication session
   * @returns Promise<void>
   */
  static async closeAuth(): Promise<void> {
    return InAppBrowserNitroHybridObject.closeAuth();
  }
}

// Export types for external use
export type {
  InAppBrowserOptions,
  InAppBrowserResult,
  InAppBrowserAuthResult,
  InAppBrowseriOSOptions,
  InAppBrowserAndroidOptions,
  BrowserResultType,
  DismissButtonStyle,
  ModalPresentationStyle,
  ModalTransitionStyle,
  BrowserAnimations,
} from './InAppBrowserNitro.nitro';

// Legacy compatibility - imperative API
export const RNInAppBrowserNitro = InAppBrowser;

// Hook for React components
export { useInAppBrowser } from './hooks/useInAppBrowser';
