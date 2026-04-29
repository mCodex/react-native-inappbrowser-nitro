// src/types.ts
//
// All enum-like constants below are exported as both a frozen `as const` value
// AND a matching string-literal type. Consumers using only the type
// (`import type { BrowserResultType }`) tree-shake the runtime const out
// thanks to `"sideEffects": false` on the package, while value-style
// consumers (`BrowserResultType.Success`) keep working unchanged.

/**
 * Discrete result types returned by the native browser implementations.
 *
 * @example Value form
 * ```ts
 * if (result.type === BrowserResultType.Success) { … }
 * ```
 * @example Type-only form (smaller bundle)
 * ```ts
 * import type { BrowserResultType } from 'react-native-inappbrowser-nitro'
 * const t: BrowserResultType = 'success'
 * ```
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
 * @platform ios
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
 * @platform ios
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
 * @platform ios
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
 * @platform android
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
 * @platform android
 */
export const BrowserShareState = {
  Default: 'default',
  On: 'on',
  Off: 'off',
} as const

export type BrowserShareState =
  (typeof BrowserShareState)[keyof typeof BrowserShareState]

/**
 * iOS status bar appearance applied while the browser is presented.
 * @platform ios
 */
export const StatusBarStyle = {
  Default: 'default',
  LightContent: 'lightContent',
  DarkContent: 'darkContent',
} as const

export type StatusBarStyle =
  (typeof StatusBarStyle)[keyof typeof StatusBarStyle]

/**
 * iOS user interface style override (light / dark / unspecified).
 * @platform ios
 */
export const UserInterfaceStyle = {
  Unspecified: 'unspecified',
  Light: 'light',
  Dark: 'dark',
} as const

export type UserInterfaceStyle =
  (typeof UserInterfaceStyle)[keyof typeof UserInterfaceStyle]

/**
 * Compact description of a color palette for light/dark/high-contrast modes.
 * Each property accepts a `#RRGGBB` / `#AARRGGBB` string.
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

/** Preferred content size when presenting Safari as a form sheet. */
export interface FormSheetContentSize {
  /** Width in points. */
  width: number
  /** Height in points. */
  height: number
}

/**
 * iOS specific presentation and styling options.
 * @platform ios
 */
export interface InAppBrowserIOSOptions {
  /** Style used for the dismiss button in the Safari toolbar. */
  dismissButtonStyle?: DismissButtonStyle
  /**
   * Tint color of the navigation/toolbar background.
   *
   * @remarks
   * **iOS 26+:** Safari View Controller adopts the system Liquid Glass
   * material for its toolbar, which samples the underlying content rather
   * than rendering a flat fill. As a result this property has reduced or no
   * visible effect on iOS 26 and later. Apple does not currently expose a
   * public API to opt out of the glass material; the value is still
   * forwarded to UIKit for backward compatibility.
   */
  preferredBarTintColor?: DynamicColor
  /**
   * Tint color of the toolbar buttons (e.g. Done, Share).
   *
   * @remarks
   * **iOS 26+:** Control tinting is partially overridden by the Liquid Glass
   * material's adaptive monochrome treatment. Custom tints may render with
   * lower contrast than on iOS 18 and earlier.
   */
  preferredControlTintColor?: DynamicColor
  /** Status bar style while the browser is presented. */
  preferredStatusBarStyle?: StatusBarStyle
  /** Open the URL in Safari Reader Mode if the page supports it. @default false */
  readerMode?: boolean
  /** Animate the present/dismiss transitions. @default true */
  animated?: boolean
  /** Modal presentation style. @default 'automatic' */
  modalPresentationStyle?: ModalPresentationStyle
  /** Modal transition style. @default 'coverVertical' */
  modalTransitionStyle?: ModalTransitionStyle
  /** Present the browser modally rather than pushing onto the navigation stack. @default true */
  modalEnabled?: boolean
  /** Allow the toolbar to collapse on scroll. @default true */
  enableBarCollapsing?: boolean
  /** Use an ephemeral (non-persistent) web session for `openAuth`. @default false */
  ephemeralWebSession?: boolean
  /** Allow swipe-from-edge to dismiss the browser. @default true */
  enableEdgeDismiss?: boolean
  /** Force a specific user interface style for the browser controller. */
  overrideUserInterfaceStyle?: UserInterfaceStyle
  /** Preferred content size when `modalPresentationStyle: 'formSheet'`. */
  formSheetPreferredContentSize?: FormSheetContentSize
}

/**
 * Declarative animation configuration for Android Custom Tabs.
 * Each value is the resource name of an XML animation in the host app
 * (e.g. `'slide_in_right'`).
 * @platform android
 */
export interface BrowserAnimations {
  /** Enter animation when the Custom Tab is launched. */
  startEnter?: string
  /** Exit animation applied to the previous activity when launching. */
  startExit?: string
  /** Enter animation applied to the previous activity on close. */
  endEnter?: string
  /** Exit animation when the Custom Tab is dismissed. */
  endExit?: string
}

/**
 * Android specific presentation and styling options.
 * @platform android
 */
export interface InAppBrowserAndroidOptions {
  /** Show the page title beneath the URL bar. @default false */
  showTitle?: boolean
  /** Color of the toolbar background. */
  toolbarColor?: DynamicColor
  /** Color of the secondary (bottom) toolbar background. */
  secondaryToolbarColor?: DynamicColor
  /** Color of the system navigation bar. */
  navigationBarColor?: DynamicColor
  /** Color of the divider between content and navigation bar. */
  navigationBarDividerColor?: DynamicColor
  /** Hide the URL bar on scroll. @default false */
  enableUrlBarHiding?: boolean
  /** Show the system Share menu item. @default false */
  enableDefaultShare?: boolean
  /** Override the default share menu visibility. */
  shareState?: BrowserShareState
  /** Color scheme applied to the Custom Tab. */
  colorScheme?: BrowserColorScheme
  /** Custom HTTP headers forwarded to the initial request. */
  headers?: Record<string, string>
  /** Force-close the tab when the redirect URL is matched (auth flows). @default false */
  forceCloseOnRedirection?: boolean
  /** Show a back arrow instead of an "X" close button. @default false */
  hasBackButton?: boolean
  /** Explicit browser package name (e.g. `'com.android.chrome'`). */
  browserPackage?: string
  /** Keep the Custom Tab in Recents after closing. @default true */
  showInRecents?: boolean
  /** Send the host app's package name as Referrer. @default false */
  includeReferrer?: boolean
  /** Allow Instant Apps to handle the URL when supported. @default true */
  instantAppsEnabled?: boolean
  /** Enable swipe-down pull-to-refresh inside the tab. @default false */
  enablePullToRefresh?: boolean
  /** Show the tab as a partial bottom sheet (Android 13+). @default false */
  enablePartialCustomTab?: boolean
  /** Custom enter/exit animations. */
  animations?: BrowserAnimations
}

/**
 * Aggregated cross-platform options. iOS-only fields are ignored on Android
 * and vice versa.
 *
 * @example
 * ```ts
 * await open('https://example.com', {
 *   preferredBarTintColor: { light: '#FFFFFF', dark: '#000000' },
 *   toolbarColor:          { light: '#FFFFFF', dark: '#000000' },
 *   readerMode: true,
 * })
 * ```
 */
export interface InAppBrowserOptions
  extends InAppBrowserIOSOptions,
    InAppBrowserAndroidOptions {}

/** Result payload returned by imperative API calls. */
export interface InAppBrowserResult {
  /** Discriminator describing how the browser was closed. */
  type: BrowserResultType
  /** Final URL captured from the browser session, when applicable. */
  url?: string
  /** Optional human-readable reason (e.g. error message on `dismiss`). */
  message?: string
}

/**
 * Authentication result payload.
 *
 * Semantically identical to {@link InAppBrowserResult}, but declared as a
 * distinct interface so Nitrogen emits a dedicated Swift/Kotlin type and
 * call sites read as `InAppBrowserAuthResult` in IDE tooltips.
 */
export interface InAppBrowserAuthResult extends InAppBrowserResult {}
