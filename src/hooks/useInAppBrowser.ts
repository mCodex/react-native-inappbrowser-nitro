import { useCallback, useEffect, useRef, useState } from 'react'

import { InAppBrowser } from '../core/InAppBrowser'
import type {
  InAppBrowserAuthResult,
  InAppBrowserOptions,
  InAppBrowserResult,
} from '../specs/inappbrowser-nitro.nitro'

export interface UseInAppBrowserReturn {
  open: (
    url: string,
    options?: InAppBrowserOptions
  ) => Promise<InAppBrowserResult>
  openAuth: (
    url: string,
    redirectUrl: string,
    options?: InAppBrowserOptions
  ) => Promise<InAppBrowserAuthResult>
  close: () => Promise<void>
  closeAuth: () => Promise<void>
  warmup: (options?: InAppBrowserOptions) => Promise<void>
  isAvailable: () => Promise<boolean>
  isLoading: boolean
  error: Error | null
}

/**
 * React hook that wraps the imperative API with loading/error tracking.
 */
export function useInAppBrowser(): UseInAppBrowserReturn {
  const isMountedRef = useRef(true)

  const [isLoading, setIsLoading] = useState(false)

  const [error, setError] = useState<Error | null>(null)

  const runSafely = useCallback(async <T,>(operation: () => Promise<T>) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await operation()
      
      if (isMountedRef.current) {
        setIsLoading(false)
      }

      return result
    } catch (err) {
      const currentError = err instanceof Error ? err : new Error(String(err))
      if (isMountedRef.current) {
        setError(currentError)
        setIsLoading(false)
      }
      throw currentError
    }
  }, [])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const open = useCallback(
    (url: string, options?: InAppBrowserOptions) =>
      runSafely(() => InAppBrowser.open(url, options)),
    [runSafely]
  )

  const openAuth = useCallback(
    (url: string, redirectUrl: string, options?: InAppBrowserOptions) =>
      runSafely(() => InAppBrowser.openAuth(url, redirectUrl, options)),
    [runSafely]
  )

  const close = useCallback(() => runSafely(() => InAppBrowser.close()), [runSafely])

  const closeAuth = useCallback(
    () => runSafely(() => InAppBrowser.closeAuth()),
    [runSafely]
  )

  const warmup = useCallback(
    (options?: InAppBrowserOptions) =>
      runSafely(() => InAppBrowser.warmup(options)),
    [runSafely]
  )

  const isAvailable = useCallback(
    () => runSafely(() => InAppBrowser.isAvailable()),
    [runSafely]
  )

  return {
    open,
    openAuth,
    close,
    closeAuth,
    warmup,
    isAvailable,
    isLoading,
    error,
  }
}
