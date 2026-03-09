import { useCallback, useEffect, useRef, useState } from 'react'

import {
  close as nativeClose,
  closeAuth as nativeCloseAuth,
  isAvailable as nativeIsAvailable,
  open as nativeOpen,
  openAuth as nativeOpenAuth,
} from '../core/native'
import type {
  InAppBrowserAuthResult,
  InAppBrowserOptions,
  InAppBrowserResult,
} from '../types'

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
  isAvailable: () => Promise<boolean>
  isLoading: boolean
  error: Error | null
}

/**
 * React hook that wraps open/openAuth with loading and error state tracking.
 * close, closeAuth, and isAvailable are direct delegates with no overhead.
 */
export function useInAppBrowser(): UseInAppBrowserReturn {
  const isMountedRef = useRef(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const runSafely = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await operation()
        if (isMountedRef.current) {
          setIsLoading(false)
        }
        return result
      } catch (err) {
        const currentError =
          err instanceof Error ? err : new Error(String(err))
        if (isMountedRef.current) {
          setError(currentError)
          setIsLoading(false)
        }
        throw currentError
      }
    },
    []
  )

  const open = useCallback(
    (url: string, options?: InAppBrowserOptions) =>
      runSafely(() => nativeOpen(url, options)),
    [runSafely]
  )

  const openAuth = useCallback(
    (url: string, redirectUrl: string, options?: InAppBrowserOptions) =>
      runSafely(() => nativeOpenAuth(url, redirectUrl, options)),
    [runSafely]
  )

  const close = useCallback(() => nativeClose(), [])

  const closeAuth = useCallback(() => nativeCloseAuth(), [])

  const isAvailable = useCallback(() => nativeIsAvailable(), [])

  return {
    open,
    openAuth,
    close,
    closeAuth,
    isAvailable,
    isLoading,
    error,
  }
}
