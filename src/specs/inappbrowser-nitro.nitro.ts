import { type HybridObject } from 'react-native-nitro-modules'

/**
 * Discrete result types returned by the native browser implementations.
 */
export const BrowserResultType = {
  /** User actively dismissed the browser (tap on Done/Close/back). */
  Cancel: 'cancel',
  /** Browser closed due to an error or system level interruption. */
  Dismiss: 'dismiss',
  /** Browser launched successfully. */
  Success: 'success',
} as const

export type BrowserResultType =
  (typeof BrowserResultType)[keyof typeof BrowserResultType]

/**
 * iOS dismiss button appearance options.
 */
export const DismissButtonStyle = {
  Done: 'done',
  Close: 'close',
  Cancel: 'cancel',
} as const

export type DismissButtonStyle =
  (typeof DismissButtonStyle)[keyof typeof DismissButtonStyle]

/**
 * iOS presentation styles exposed by Safari Services.
 */
export const ModalPresentationStyle = {
  Automatic: 'automatic',
  None: 'none',
  FullScreen: 'fullScreen',
  PageSheet: 'pageSheet',
  FormSheet: 'formSheet',
  CurrentContext: 'currentContext',
  Custom: 'custom',
  OverFullScreen: 'overFullScreen',
  OverCurrentContext: 'overCurrentContext',
  Popover: 'popover',
} as const

export type ModalPresentationStyle =
  (typeof ModalPresentationStyle)[keyof typeof ModalPresentationStyle]

/**
 * iOS transition styles available when presenting Safari.
 */
export const ModalTransitionStyle = {
  CoverVertical: 'coverVertical',
  FlipHorizontal: 'flipHorizontal',
  CrossDissolve: 'crossDissolve',
  PartialCurl: 'partialCurl',
} as const

export type ModalTransitionStyle =
  (typeof ModalTransitionStyle)[keyof typeof ModalTransitionStyle]

/**
 * Android Custom Tabs color scheme modes.
 */
export const BrowserColorScheme = {
  System: 'system',
  Light: 'light',
  Dark: 'dark',
} as const

export type BrowserColorScheme =
  (typeof BrowserColorScheme)[keyof typeof BrowserColorScheme]

/**
 * Android Custom Tabs share state visibility.
 */
export const BrowserShareState = {
  Default: 'default',
  On: 'on',
  Off: 'off',
} as const

export type BrowserShareState =
  (typeof BrowserShareState)[keyof typeof BrowserShareState]

export const StatusBarStyle = {
  Default: 'default',
  LightContent: 'lightContent',
  DarkContent: 'darkContent',
} as const

export type StatusBarStyle =
  (typeof StatusBarStyle)[keyof typeof StatusBarStyle]

export const UserInterfaceStyle = {
  Unspecified: 'unspecified',
  Light: 'light',
  Dark: 'dark',
} as const

export type UserInterfaceStyle =
  (typeof UserInterfaceStyle)[keyof typeof UserInterfaceStyle]

/**
 * Compact description of a color palette for light/dark/high-contrast modes.
 * When provided, native layers pick the most appropriate value per platform.
 */
export interface DynamicColor {
  /** Primary color used regardless of theme (fallback). */
  base?: string
  /** Primary color used for light interfaces. */
  light?: string
  /** Primary color used for dark interfaces. */
  dark?: string
  /** High contrast override applied when available (iOS 26+, Android 16+). */
  highContrast?: string
}

/**
 * Reader mode result sizing used when presenting as a form sheet.
 */
export interface FormSheetContentSize {
  width: number
  height: number
}

/**
 * iOS specific presentation and styling options.
 */
export interface InAppBrowserIOSOptions {
  dismissButtonStyle?: DismissButtonStyle
  preferredBarTintColor?: DynamicColor
  preferredControlTintColor?: DynamicColor
  /**
   * Tint color applied to the status bar buttons when supported (iOS 15+).
   */
  preferredStatusBarStyle?: StatusBarStyle
  readerMode?: boolean
  animated?: boolean
  modalPresentationStyle?: ModalPresentationStyle
  modalTransitionStyle?: ModalTransitionStyle
  modalEnabled?: boolean
  enableBarCollapsing?: boolean
  ephemeralWebSession?: boolean
  enableEdgeDismiss?: boolean
  overrideUserInterfaceStyle?: UserInterfaceStyle
  formSheetPreferredContentSize?: FormSheetContentSize
}

/**
 * Android specific presentation and styling options.
 */
export interface InAppBrowserAndroidOptions {
  showTitle?: boolean
  toolbarColor?: DynamicColor
  secondaryToolbarColor?: DynamicColor
  navigationBarColor?: DynamicColor
  navigationBarDividerColor?: DynamicColor
  enableUrlBarHiding?: boolean
  enableDefaultShare?: boolean
  shareState?: BrowserShareState
  colorScheme?: BrowserColorScheme
  headers?: Record<string, string>
  forceCloseOnRedirection?: boolean
  hasBackButton?: boolean
  browserPackage?: string
  showInRecents?: boolean
  includeReferrer?: boolean
  instantAppsEnabled?: boolean
  enablePullToRefresh?: boolean
  enablePartialCustomTab?: boolean
  animations?: BrowserAnimations
}

/**
 * Declarative animation configuration for Android Custom Tabs.
 */
export interface BrowserAnimations {
  startEnter?: string
  startExit?: string
  endEnter?: string
  endExit?: string
}

/**
 * Aggregated cross-platform options.
 */
export interface InAppBrowserOptions
  extends InAppBrowserIOSOptions,
    InAppBrowserAndroidOptions {
  headers?: Record<string, string>
}

/**
 * Result payload returned by imperative API calls.
 */
export interface InAppBrowserResult {
  type: BrowserResultType
  url?: string
  message?: string
}

/**
 * Authentication result payload (mirrors regular result semantics).
 */
export interface InAppBrowserAuthResult extends InAppBrowserResult {}

export interface InappbrowserNitro
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Report whether the Native runtime can present an in-app browser.
   */
  isAvailable(): Promise<boolean>

  /**
   * Present an in-app browser with the supplied configuration.
   */
  open(url: string, options?: InAppBrowserOptions): Promise<InAppBrowserResult>

  /**
   * Launch an authentication flow and resolve with the redirect payload.
   */
  openAuth(
    url: string,
    redirectUrl: string,
    options?: InAppBrowserOptions
  ): Promise<InAppBrowserAuthResult>

  /**
   * Close any visible browser session.
   */
  close(): Promise<void>

  /**
   * Dismiss an ongoing authentication session.
   */
  closeAuth(): Promise<void>

  /**
   * Warm-up native resources without opening the browser, improving TTI.
   */
  warmup(options?: InAppBrowserOptions): Promise<void>
}