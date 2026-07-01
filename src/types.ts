// src/types.ts
//
// Enum-like constants exported as both frozen `as const` values AND matching
// string-literal types. Type-only imports tree-shake the runtime const out
// thanks to `"sideEffects": false` on the package.

/** Result type from browser close: user dismiss, error, or success. */
export const BrowserResultType = {
  Cancel: 'cancel',
  Dismiss: 'dismiss',
  Success: 'success',
} as const

export type BrowserResultType =
  (typeof BrowserResultType)[keyof typeof BrowserResultType]

/** iOS dismiss button style. @platform ios */
export const DismissButtonStyle = {
  Done: 'done',
  Close: 'close',
  Cancel: 'cancel',
} as const

export type DismissButtonStyle =
  (typeof DismissButtonStyle)[keyof typeof DismissButtonStyle]

/** iOS modal presentation style. @platform ios */
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

/** iOS modal transition style. @platform ios */
export const ModalTransitionStyle = {
  CoverVertical: 'coverVertical',
  FlipHorizontal: 'flipHorizontal',
  CrossDissolve: 'crossDissolve',
  PartialCurl: 'partialCurl',
} as const

export type ModalTransitionStyle =
  (typeof ModalTransitionStyle)[keyof typeof ModalTransitionStyle]

/** Android Custom Tabs color scheme. @platform android */
export const BrowserColorScheme = {
  System: 'system',
  Light: 'light',
  Dark: 'dark',
} as const

export type BrowserColorScheme =
  (typeof BrowserColorScheme)[keyof typeof BrowserColorScheme]

/** Android share menu visibility. @platform android */
export const BrowserShareState = {
  Default: 'default',
  On: 'on',
  Off: 'off',
} as const

export type BrowserShareState =
  (typeof BrowserShareState)[keyof typeof BrowserShareState]

/** iOS status bar style while browser is presented. @platform ios */
export const StatusBarStyle = {
  Default: 'default',
  LightContent: 'lightContent',
  DarkContent: 'darkContent',
} as const

export type StatusBarStyle =
  (typeof StatusBarStyle)[keyof typeof StatusBarStyle]

/** iOS interface style override. @platform ios */
export const UserInterfaceStyle = {
  Unspecified: 'unspecified',
  Light: 'light',
  Dark: 'dark',
} as const

export type UserInterfaceStyle =
  (typeof UserInterfaceStyle)[keyof typeof UserInterfaceStyle]

/** Color hints for platform chrome (`#RRGGBB` or `#AARRGGBB`). */
export interface DynamicColor {
  base?: string
  light?: string
  dark?: string
  highContrast?: string
}

/** Preferred sheet size in points. UIKit may adapt or ignore this on iPhone. */
export interface FormSheetContentSize {
  width: number
  height: number
}

/** iOS-specific options. @platform ios */
export interface InAppBrowserIOSOptions {
  dismissButtonStyle?: DismissButtonStyle
  /**
   * Safari toolbar background hint.
   *
   * iOS 26 Liquid Glass keeps final toolbar rendering system-controlled, so
   * this is not a pixel-exact branding API.
   */
  preferredBarTintColor?: DynamicColor
  /**
   * Safari control tint hint.
   *
   * iOS 26 may adapt this for contrast and Liquid Glass legibility.
   */
  preferredControlTintColor?: DynamicColor
  preferredStatusBarStyle?: StatusBarStyle
  /**
   * Ask Safari to enter Reader Mode when the page supports it.
   *
   * @platform ios
   * @remarks Android Custom Tabs do not expose Reader Mode, so Android ignores
   * this option.
   */
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

/** Android Custom Tabs animations (XML resource names). @platform android */
export interface BrowserAnimations {
  startEnter?: string
  startExit?: string
  endEnter?: string
  endExit?: string
}

/** Android-specific options. @platform android */
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

/** Cross-platform options. iOS-only fields ignored on Android and vice versa. */
export interface InAppBrowserOptions
  extends InAppBrowserIOSOptions,
    InAppBrowserAndroidOptions {}

/** Browser close result. */
export interface InAppBrowserResult {
  type: BrowserResultType
  url?: string
  message?: string
}

/** Auth session result. Identical shape to InAppBrowserResult for Nitro codegen. */
export interface InAppBrowserAuthResult extends InAppBrowserResult {}
