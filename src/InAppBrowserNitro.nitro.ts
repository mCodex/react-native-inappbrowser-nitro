import type { HybridObject } from 'react-native-nitro-modules';

// Enum types instead of inline unions (required by Nitro)
export type BrowserResultType = 'cancel' | 'dismiss' | 'success';
export type DismissButtonStyle = 'done' | 'close' | 'cancel';
export type ModalPresentationStyle =
  | 'automatic'
  | 'none'
  | 'fullScreen'
  | 'pageSheet'
  | 'formSheet'
  | 'currentContext'
  | 'custom'
  | 'overFullScreen'
  | 'overCurrentContext'
  | 'popover';
export type ModalTransitionStyle =
  | 'coverVertical'
  | 'flipHorizontal'
  | 'crossDissolve'
  | 'partialCurl';

// Size configuration for form sheet presentation
export interface FormSheetContentSize {
  width: number;
  height: number;
}

// Browser configuration options for iOS
export interface InAppBrowseriOSOptions {
  dismissButtonStyle?: DismissButtonStyle;
  preferredBarTintColor?: string;
  preferredControlTintColor?: string;
  readerMode?: boolean;
  animated?: boolean;
  modalPresentationStyle?: ModalPresentationStyle;
  modalTransitionStyle?: ModalTransitionStyle;
  modalEnabled?: boolean;
  enableBarCollapsing?: boolean;
  ephemeralWebSession?: boolean;
  formSheetPreferredContentSize?: FormSheetContentSize;
}

// Animations configuration for Android
export interface BrowserAnimations {
  startEnter: string;
  startExit: string;
  endEnter: string;
  endExit: string;
}

// Browser configuration options for Android
export interface InAppBrowserAndroidOptions {
  showTitle?: boolean;
  toolbarColor?: string;
  secondaryToolbarColor?: string;
  navigationBarColor?: string;
  navigationBarDividerColor?: string;
  enableUrlBarHiding?: boolean;
  enableDefaultShare?: boolean;
  animations?: BrowserAnimations;
  headers?: Record<string, string>;
  forceCloseOnRedirection?: boolean;
  hasBackButton?: boolean;
  browserPackage?: string;
  showInRecents?: boolean;
  includeReferrer?: boolean;
}

// Combined options interface
export interface InAppBrowserOptions
  extends InAppBrowseriOSOptions,
    InAppBrowserAndroidOptions {}

// Result interface for browser operations
export interface InAppBrowserResult {
  type: BrowserResultType;
  url?: string;
  message?: string;
}

// Authentication result interface (extends base result)
export interface InAppBrowserAuthResult {
  type: BrowserResultType;
  url?: string;
  message?: string;
}

export interface InAppBrowserNitro
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Check if the device supports InAppBrowser
   * @returns Promise<boolean> - true if supported, false otherwise
   */
  isAvailable(): Promise<boolean>;

  /**
   * Open a URL in the in-app browser
   * @param url - The URL to open
   * @param options - Browser configuration options
   * @returns Promise<InAppBrowserResult> - Result of the browser operation
   */
  open(url: string, options?: InAppBrowserOptions): Promise<InAppBrowserResult>;

  /**
   * Open a URL for authentication flow (OAuth, etc.)
   * @param url - The URL to open for authentication
   * @param redirectUrl - The redirect URL scheme to listen for
   * @param options - Browser configuration options
   * @returns Promise<InAppBrowserAuthResult> - Result of the authentication
   */
  openAuth(
    url: string,
    redirectUrl: string,
    options?: InAppBrowserOptions
  ): Promise<InAppBrowserAuthResult>;

  /**
   * Close the currently opened in-app browser
   * @returns Promise<void>
   */
  close(): Promise<void>;

  /**
   * Close the currently opened authentication session
   * @returns Promise<void>
   */
  closeAuth(): Promise<void>;
}
