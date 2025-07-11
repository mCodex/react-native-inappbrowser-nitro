import { useCallback, useState } from 'react';
import { InAppBrowser } from '../index';
import type {
  InAppBrowserOptions,
  InAppBrowserResult,
  InAppBrowserAuthResult,
} from '../InAppBrowserNitro.nitro';

export interface UseInAppBrowserReturn {
  /**
   * Open a URL in the in-app browser
   */
  open: (
    url: string,
    options?: InAppBrowserOptions
  ) => Promise<InAppBrowserResult>;

  /**
   * Open a URL for authentication flow (OAuth, etc.)
   */
  openAuth: (
    url: string,
    redirectUrl: string,
    options?: InAppBrowserOptions
  ) => Promise<InAppBrowserAuthResult>;

  /**
   * Close the currently opened in-app browser
   */
  close: () => Promise<void>;

  /**
   * Close the currently opened authentication session
   */
  closeAuth: () => Promise<void>;

  /**
   * Check if the device supports InAppBrowser
   */
  isAvailable: () => Promise<boolean>;

  /**
   * Current loading state
   */
  isLoading: boolean;

  /**
   * Last error that occurred
   */
  error: Error | null;
}

/**
 * React hook for InAppBrowser functionality
 *
 * Provides a convenient interface for using InAppBrowser in React components
 * with built-in loading and error state management.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { open, isLoading, error } = useInAppBrowser();
 *
 *   const handleOpenBrowser = async () => {
 *     try {
 *       const result = await open('https://example.com', {
 *         preferredBarTintColor: '#453AA4',
 *         preferredControlTintColor: 'white',
 *       });
 *       console.log('Browser result:', result);
 *     } catch (err) {
 *       console.error('Failed to open browser:', err);
 *     }
 *   };
 *
 *   return (
 *     <Button
 *       title="Open Browser"
 *       onPress={handleOpenBrowser}
 *       disabled={isLoading}
 *     />
 *   );
 * }
 * ```
 */
export function useInAppBrowser(): UseInAppBrowserReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleAsync = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await operation();
        return result;
      } catch (err) {
        const currentError =
          err instanceof Error ? err : new Error(String(err));
        setError(currentError);
        throw currentError;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const open = useCallback(
    (url: string, options?: InAppBrowserOptions) =>
      handleAsync(() => InAppBrowser.open(url, options)),
    [handleAsync]
  );

  const openAuth = useCallback(
    (url: string, redirectUrl: string, options?: InAppBrowserOptions) =>
      handleAsync(() => InAppBrowser.openAuth(url, redirectUrl, options)),
    [handleAsync]
  );

  const close = useCallback(
    () => handleAsync(() => InAppBrowser.close()),
    [handleAsync]
  );

  const closeAuth = useCallback(
    () => handleAsync(() => InAppBrowser.closeAuth()),
    [handleAsync]
  );

  const isAvailable = useCallback(
    () => handleAsync(() => InAppBrowser.isAvailable()),
    [handleAsync]
  );

  return {
    open,
    openAuth,
    close,
    closeAuth,
    isAvailable,
    isLoading,
    error,
  };
}
