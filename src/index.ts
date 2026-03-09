export {
  close,
  closeAuth,
  isAvailable,
  open,
  openAuth,
} from './core/native'

export { useInAppBrowser } from './hooks/useInAppBrowser'

export {
  BrowserColorScheme,
  BrowserResultType,
  BrowserShareState,
  DismissButtonStyle,
  ModalPresentationStyle,
  ModalTransitionStyle,
  StatusBarStyle,
  UserInterfaceStyle,
} from './types'

export type {
  BrowserAnimations,
  DynamicColor,
  InAppBrowserAndroidOptions,
  InAppBrowserAuthResult,
  InAppBrowserIOSOptions,
  InAppBrowserOptions,
  InAppBrowserResult,
} from './types'
