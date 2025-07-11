import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import {
  InAppBrowser,
  useInAppBrowser,
  type InAppBrowserOptions,
} from 'react-native-inappbrowser-nitro';

const EXAMPLE_URL = 'https://github.com/mcodex/react-native-inappbrowser-nitro';
const AUTH_URL =
  'https://github.com/login/oauth/authorize?client_id=your_client_id&redirect_uri=your_redirect_uri';
const REDIRECT_URL = 'your-app://oauth';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const {
    open: openWithHook,
    isLoading: hookLoading,
    error,
  } = useInAppBrowser();

  const handleOpenBrowser = async () => {
    try {
      setIsLoading(true);

      const options: InAppBrowserOptions = {
        // iOS Options
        dismissButtonStyle: 'cancel',
        preferredBarTintColor: '#453AA4',
        preferredControlTintColor: 'white',
        readerMode: false,
        animated: true,
        modalPresentationStyle: 'fullScreen',
        modalTransitionStyle: 'coverVertical',
        modalEnabled: true,
        enableBarCollapsing: false,

        // Android Options
        showTitle: true,
        toolbarColor: '#6200EE',
        secondaryToolbarColor: 'black',
        navigationBarColor: 'black',
        navigationBarDividerColor: 'white',
        enableUrlBarHiding: true,
        enableDefaultShare: true,
        forceCloseOnRedirection: false,
        animations: {
          startEnter: 'slide_in_right',
          startExit: 'slide_out_left',
          endEnter: 'slide_in_left',
          endExit: 'slide_out_right',
        },
        headers: {
          'my-custom-header': 'my custom header value',
        },
      };

      if (await InAppBrowser.isAvailable()) {
        const result = await InAppBrowser.open(EXAMPLE_URL, options);
        console.log('Browser result:', result);
      } else {
        Alert.alert('Error', 'InAppBrowser is not available on this device');
      }
    } catch (err) {
      console.error('Error opening browser:', err);
      Alert.alert('Error', err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAuth = async () => {
    try {
      setIsLoading(true);

      const options: InAppBrowserOptions = {
        // iOS Options - use ephemeral session for auth
        ephemeralWebSession: true,
        preferredBarTintColor: '#453AA4',
        preferredControlTintColor: 'white',

        // Android Options
        showTitle: false,
        enableUrlBarHiding: true,
        enableDefaultShare: false,
      };

      if (await InAppBrowser.isAvailable()) {
        const result = await InAppBrowser.openAuth(
          AUTH_URL,
          REDIRECT_URL,
          options
        );
        console.log('Auth result:', result);
      } else {
        Alert.alert('Error', 'InAppBrowser is not available on this device');
      }
    } catch (err) {
      console.error('Error opening auth:', err);
      Alert.alert('Error', err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenWithHook = async () => {
    try {
      // Check availability first (same as class API)
      if (!(await InAppBrowser.isAvailable())) {
        Alert.alert('Error', 'InAppBrowser is not available on this device');
        return;
      }

      const result = await openWithHook(EXAMPLE_URL, {
        preferredBarTintColor: '#28a745',
        preferredControlTintColor: 'white',
        toolbarColor: '#28a745',
        showTitle: true,
      });
      console.log('Hook result:', result);
    } catch (err) {
      console.error('Error with hook:', err);
      Alert.alert('Error', err instanceof Error ? err.message : String(err));
    }
  };

  const handleClose = async () => {
    try {
      await InAppBrowser.close();
      console.log('Browser closed successfully');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollView}
      >
        <View style={styles.header}>
          <Text style={styles.title}>InAppBrowser Nitro</Text>
          <Text style={styles.subtitle}>
            Fast, modern in-app browser for React Native
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Usage</Text>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleOpenBrowser}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Opening...' : 'Open Browser (Class API)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleOpenWithHook}
            disabled={hookLoading}
          >
            <Text style={styles.buttonText}>
              {hookLoading ? 'Opening...' : 'Open Browser (Hook API)'}
            </Text>
          </TouchableOpacity>

          {error && (
            <Text style={styles.errorText}>Hook Error: {error.message}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication Flow</Text>

          <TouchableOpacity
            style={[styles.button, styles.authButton]}
            onPress={handleOpenAuth}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Open OAuth Flow</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Controls</Text>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleClose}
          >
            <Text style={styles.buttonText}>Close Browser</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Platform: {Platform.OS} {Platform.Version}
          </Text>
          <Text style={styles.footerText}>Built with Nitro Modules ⚡️</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  authButton: {
    backgroundColor: '#28a745',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
});
