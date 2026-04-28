import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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

/**
 * Stateful surface returned by {@link useInAppBrowser}.
 *
 * @example
 * ```tsx
 * const { open, isLoading, error } = useInAppBrowser()
 *
 * const onPress = () => {
 *   open('https://example.com').catch(() => {
 *     // `error` is also populated automatically.
 *   })
 * }
 * ```
 */
export interface UseInAppBrowserReturn {
  /** Present the in-app browser, tracking `isLoading` / `error` on this hook. */
  open: (
    url: string,
    options?: InAppBrowserOptions
  ) => Promise<InAppBrowserResult>
  /** Launch an auth session, tracking `isLoading` / `error` on this hook. */
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
 * React hook that wraps the imperative {@link nativeOpen} / {@link nativeOpenAuth}
 * APIs with loading and error state tracking. `close`, `closeAuth`, and
 * `isAvailable` are direct delegates to the stateless module API.
 *
 * `open`/`openAuth` and the returned object are memoized with `useCallback` /
 * `useMemo` so consumers passing them to `useEffect` deps or `React.memo`
 * children get stable identities — independent of whether the host app has
 * `babel-plugin-react-compiler` enabled.
 */
export const useInAppBrowser = (): UseInAppBrowserReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Guard against "state update on unmounted component" warnings when an
  // in-flight open/openAuth resolves after the consumer unmounts.
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const runTracked = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      if (isMountedRef.current) {
        setIsLoading(true)
        setError(null)
      }
      try {
        return await fn()
      } catch (err) {
        const next = toError(err)
        if (isMountedRef.current) setError(next)
        throw next
      } finally {
        if (isMountedRef.current) setIsLoading(false)
      }
    },
    []
  )

  const open = useCallback(
    (url: string, options?: InAppBrowserOptions) =>
      runTracked(() => nativeOpen(url, options)),
    [runTracked]
  )

  const openAuth = useCallback(
    (url: string, redirectUrl: string, options?: InAppBrowserOptions) =>
      runTracked(() => nativeOpenAuth(url, redirectUrl, options)),
    [runTracked]
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
