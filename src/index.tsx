import { InAppBrowser } from './InAppBrowserCore';
import { useInAppBrowser } from './hooks/useInAppBrowser';

// Export the main class
export { InAppBrowser } from './InAppBrowserCore';

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

// Add hooks to the InAppBrowser object for legacy compatibility
// This ensures that imports like `InAppBrowser.useInAppBrowser` will work
InAppBrowser.useInAppBrowser = useInAppBrowser;
