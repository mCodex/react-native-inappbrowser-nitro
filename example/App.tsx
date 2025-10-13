import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  InAppBrowser,
  useInAppBrowser,
  BrowserShareState,
} from 'react-native-inappbrowser-nitro'

import type { InAppBrowserResult } from 'react-native-inappbrowser-nitro'

const DOCS_URL = 'https://nitro.margelo.com'
const REPO_URL = 'https://github.com/mCodex/react-native-inappbrowser-nitro'
const AUTH_REDIRECT_URL = 'inappbrowsernitro://callback'
const AUTH_URL = `https://httpbin.org/redirect-to?url=${encodeURIComponent(AUTH_REDIRECT_URL)}`

const toolbarPalette = {
  base: '#2563EB',
  dark: '#1E3A8A',
  highContrast: '#1D4ED8',
}

const controlPalette = {
  base: '#FFFFFF',
  highContrast: '#FFD700',
}

type ExampleButtonProps = {
  label: string
  onPress: () => Promise<void> | void
  disabled?: boolean
  tone?: 'primary' | 'secondary'
}

const ExampleButton = ({ label, onPress, disabled, tone = 'primary' }: ExampleButtonProps) => {
  const backgroundStyle = useMemo(() => {
    if (disabled) {
      return styles.buttonDisabled
    }
    return tone === 'primary' ? styles.buttonPrimary : styles.buttonSecondary
  }, [disabled, tone])

  return (
    <TouchableOpacity style={[styles.button, backgroundStyle]} onPress={onPress} disabled={disabled}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  )
}

const formatResult = (result: InAppBrowserResult) => {
  const parts = [`type: ${result.type}`]
  if (result.url) {
    parts.push(`url: ${result.url}`)
  }
  if (result.message) {
    parts.push(`message: ${result.message}`)
  }
  return parts.join(' • ')
}

const formatError = (err: unknown) => {
  if (err instanceof Error) {
    return `error: ${err.message}`
  }
  return `error: ${String(err)}`
}

function App(): React.JSX.Element {
  const { open, openAuth, close, isLoading, error } = useInAppBrowser()
  const [isSupported, setIsSupported] = useState<boolean | null>(null)
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    InAppBrowser.isAvailable()
      .then(setIsSupported)
      .catch(() => setIsSupported(false))
  }, [])

  useEffect(() => {
    InAppBrowser.warmup({
      toolbarColor: toolbarPalette,
      includeReferrer: true,
      enablePartialCustomTab: true,
    }).catch(console.warn)
  }, [])

  const pushLog = useCallback((message: string) => {
    setLog(current => [message, ...current].slice(0, 6))
  }, [])

  const handleOpenDocs = useCallback(async () => {
    try {
      const result = await open(DOCS_URL, {
        preferredBarTintColor: toolbarPalette,
        preferredControlTintColor: controlPalette,
        preferredStatusBarStyle: 'lightContent',
        overrideUserInterfaceStyle: 'dark',
        toolbarColor: toolbarPalette,
        secondaryToolbarColor: { base: '#111827' },
        navigationBarColor: { base: '#111827' },
        enablePartialCustomTab: true,
        enablePullToRefresh: true,
        includeReferrer: true,
        shareState: BrowserShareState.Off,
      })

      pushLog(formatResult(result))
    } catch (err) {
      pushLog(formatError(err))
    }
  }, [open, pushLog])

  const handleOpenReader = useCallback(async () => {
    try {
      const result = await open(REPO_URL, {
        readerMode: true,
        enableBarCollapsing: true,
        dismissButtonStyle: 'close',
        preferredBarTintColor: { base: '#FFFFFF', dark: '#111827' },
        preferredControlTintColor: controlPalette,
        enableEdgeDismiss: true,
      })

      pushLog(formatResult(result))
    } catch (err) {
      pushLog(formatError(err))
    }
  }, [open, pushLog])

  const handleAuth = useCallback(async () => {
    try {
      const result = await openAuth(AUTH_URL, AUTH_REDIRECT_URL, {
        ephemeralWebSession: true,
        enableEdgeDismiss: false,
        preferredBarTintColor: toolbarPalette,
        toolbarColor: toolbarPalette,
        includeReferrer: true,
      })

      pushLog(formatResult(result))
    } catch (err) {
      pushLog(formatError(err))
    }
  }, [openAuth, pushLog])

  const handleClose = useCallback(async () => {
    try {
      await close()
      pushLog('close(): requested dismissal')
    } catch (err) {
      pushLog(formatError(err))
    }
  }, [close, pushLog])

  const supportCopy = useMemo(() => {
    if (isSupported === null) {
      return 'Checking native availability…'
    }
    if (!isSupported) {
      return 'Native browser support is unavailable on this device/emulator.'
    }
    return 'Native browser support detected.'
  }, [isSupported])

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>react-native-inappbrowser-nitro</Text>
        <Text style={styles.subtitle}>Nitro-powered in-app browser with iOS 26 & Android 16 features.</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Status</Text>
          <Text style={styles.paragraph}>{supportCopy}</Text>
          <Text style={styles.paragraph}>Loading: {isLoading ? 'yes' : 'no'}</Text>
          {error && <Text style={[styles.paragraph, styles.errorText]}>Last error: {error.message}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Try the Features</Text>
          <ExampleButton label="Open docs with dynamic palette" onPress={handleOpenDocs} disabled={isSupported === false} />
          <ExampleButton
            label="Open repo in reader mode"
            onPress={handleOpenReader}
            disabled={isSupported === false}
            tone="secondary"
          />
          <ExampleButton
            label="Launch auth session (demo)"
            onPress={handleAuth}
            disabled={isSupported === false}
          />
          <ExampleButton label="Force close" onPress={handleClose} disabled={isSupported === false} tone="secondary" />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Security Notes</Text>
          <Text style={styles.paragraph}>
            iOS 26 allows blocking swipe-to-dismiss during sensitive auth flows via <Text style={styles.code}>enableEdgeDismiss</Text>. Android
            16 adds dynamic contrast colors and partial custom tabs; emulators without gesture navigation may require the hardware back
            button to exit.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Results</Text>
          {log.length === 0 ? (
            <Text style={styles.paragraph}>Interact with the buttons above to populate the log.</Text>
          ) : (
            log.map((entry, index) => (
              <Text key={`${entry}-${index}`} style={styles.logLine}>
                {index + 1}. {entry}
              </Text>
            ))
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Update <Text style={styles.code}>AUTH_URL</Text> in <Text style={styles.code}>example/App.tsx</Text> with your provider&apos;s authorize endpoint and
            register <Text style={styles.code}>{AUTH_REDIRECT_URL}</Text> in your native projects to test redirect-based flows.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 24,
    gap: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 14,
    color: '#CBD5F5',
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  paragraph: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 20,
  },
  errorText: {
    color: '#F87171',
  },
  button: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#2563EB',
  },
  buttonSecondary: {
    backgroundColor: '#334155',
  },
  buttonDisabled: {
    backgroundColor: '#1E293B',
    opacity: 0.6,
  },
  buttonText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  logLine: {
    fontSize: 13,
    color: '#94A3B8',
  },
  footer: {
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 13,
    color: '#CBD5F5',
    lineHeight: 18,
  },
  code: {
    fontFamily: 'Courier',
    color: '#38BDF8',
  },
})

export default App