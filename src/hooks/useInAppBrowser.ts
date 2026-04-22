import { useCallback, useMemo, useState } from 'react'

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
  /**
   * Present the in-app browser, tracking `isLoading` / `error` on this hook.
   */
  open: (
    url: string,
    options?: InAppBrowserOptions
  ) => Promise<InAppBrowserResult>
  /**
   * Launch an auth session, tracking `isLoading` / `error` on this hook.
   */
  openAuth: (
    url: string,
    redirectUrl: string,
    options?: InAppBrowserOptions
  ) => Promise<InAppBrowserAuthResult>
  /** Stateless passthrough to the native `close`. */
  close: () => Promise<void>
  /** Stateless passthrough to the native `closeAuth`. */
  closeAuth: () => Promise<void>
  /** Stateless passthrough to the native `isAvailable`. */
  isAvailable: () => Promise<boolean>
  /** `true` while an `open` / `openAuth` call is in flight. */
  isLoading: boolean
  /** Last error thrown by `open` / `openAuth`, cleared when a new call starts. */
  error: Error | null
}

const toError = (err: unknown): Error =>
  err instanceof Error ? err : new Error(String(err))

/**
 * React hook that wraps {@link nativeOpen} / {@link nativeOpenAuth} with
 * loading and error state tracking. `close`, `closeAuth`, and `isAvailable`
 * are direct delegates to the stateless module API.
 */
export const useInAppBrowser = (): UseInAppBrowserReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const open = useCallback(
    async (url: string, options?: InAppBrowserOptions) => {
      setIsLoading(true)
      setError(null)
      try {
        return await nativeOpen(url, options)
      } catch (err) {
        const next = toError(err)
        setError(next)
        throw next
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const openAuth = useCallback(
    async (url: string, redirectUrl: string, options?: InAppBrowserOptions) => {
      setIsLoading(true)
      setError(null)
      try {
        return await nativeOpenAuth(url, redirectUrl, options)
      } catch (err) {
        const next = toError(err)
        setError(next)
        throw next
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return useMemo<UseInAppBrowserReturn>(
    () => ({
      open,
      openAuth,
      close: nativeClose,
      closeAuth: nativeCloseAuth,
      isAvailable: nativeIsAvailable,
      isLoading,
      error,
    }),
    [open, openAuth, isLoading, error]
  )
}
