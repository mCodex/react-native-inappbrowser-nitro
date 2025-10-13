import { InAppBrowser } from './core/InAppBrowser'
import { useInAppBrowser } from './hooks/useInAppBrowser'

import type {
  InAppBrowserAuthResult,
  InAppBrowserOptions,
  InAppBrowserResult,
  InAppBrowserAndroidOptions,
  InAppBrowserIOSOptions,
  BrowserAnimations,
  DynamicColor,
} from './specs/inappbrowser-nitro.nitro'
import {
  BrowserColorScheme,
  BrowserResultType,
  BrowserShareState,
  DismissButtonStyle,
  ModalPresentationStyle,
  ModalTransitionStyle,
  StatusBarStyle,
  UserInterfaceStyle,
} from './specs/inappbrowser-nitro.nitro'

InAppBrowser.useInAppBrowser = useInAppBrowser

export { InAppBrowser, useInAppBrowser }
export {
  BrowserColorScheme,
  BrowserResultType,
  BrowserShareState,
  DismissButtonStyle,
  ModalPresentationStyle,
  ModalTransitionStyle,
  StatusBarStyle,
  UserInterfaceStyle,
}
export type {
  InAppBrowserAuthResult,
  InAppBrowserOptions,
  InAppBrowserResult,
  InAppBrowserAndroidOptions,
  InAppBrowserIOSOptions,
  BrowserAnimations,
  DynamicColor,
}