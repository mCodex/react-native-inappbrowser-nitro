# 🚀 react-native-inappbrowser-nitro

**Lightning-fast, modern in-app browser for React Native powered by Nitro Modules ⚡**

Experience the next generation of React Native performance with direct JSI bindings, zero bridge overhead, and beautiful native browser experiences on both iOS and Android.

## ✨ Why Nitro Modules?

### 🏎️ **Unmatched Performance**
- **Direct JSI Communication**: Bypass the React Native bridge entirely for instant native calls
- **Zero Serialization Overhead**: No JSON marshalling between JavaScript and native code
- **Native-Speed Execution**: Execute at native performance levels, not bridge speeds
- **Optimal Memory Usage**: Minimal memory footprint with efficient resource management

### 🔧 **Modern Developer Experience**
- **Auto-Generated Types**: TypeScript definitions generated directly from native code
- **Compile-Time Safety**: Catch interface mismatches before runtime
- **Intellisense Support**: Full IDE autocompletion for all native methods and properties
- **Future-Proof Architecture**: Built for React Native's New Architecture from day one

### 🏗️ **Enterprise-Ready Architecture**
- **Hermes Optimized**: Designed specifically for Hermes JavaScript engine
- **Fabric Compatible**: Seamlessly works with the new Fabric renderer
- **TurboModule Ready**: Native support for TurboModules ecosystem
- **Concurrent Features**: Safe to use with React 18's concurrent features

## ✨ Features

- **⚡ Lightning Fast**: Nitro modules with direct JSI bindings
- **🎯 Modern API**: Clean TypeScript interface with React hooks support
- **🔐 Authentication**: Full OAuth/SSO flow support with deep linking
- **🎨 Customizable**: Extensive styling options for iOS and Android
- **📱 Native Feel**: Uses SafariViewController (iOS) and Chrome Custom Tabs (Android)
- **🔒 Secure**: Supports incognito mode and ephemeral sessions
- **🌟 Simple & Elegant**: Intuitive API designed for modern React Native apps

## � System Requirements

### iOS
- **Minimum iOS Version**: 11.0+
- **Xcode**: 14.0+
- **React Native**: 0.70+
- **Frameworks**: SafariServices, AuthenticationServices

### Android
- **Minimum API Level**: 23 (Android 6.0+)
- **Target API Level**: 33+
- **React Native**: 0.70+
- **Dependencies**: androidx.browser:browser:1.8.0

### React Native
- **Version**: 0.70.0+
- **New Architecture**: ✅ Fully supported
- **Hermes**: ✅ Recommended
- **Expo**: ❌ Not compatible (requires native modules)

## Installation

```sh
npm install react-native-inappbrowser-nitro react-native-nitro-modules
```

> **Note**: `react-native-nitro-modules` is required as this library leverages the powerful Nitro framework.

### iOS Setup

Add to your `ios/Podfile`:

```ruby
pod 'InAppBrowserNitro', :path => '../node_modules/react-native-inappbrowser-nitro'
```

Then run:

```sh
cd ios && pod install
```

### Android Setup

No additional setup required - uses autolinking magic ✨

## 🚀 Quick Start

### Class-based API (Imperative)

```tsx
import { InAppBrowser } from 'react-native-inappbrowser-nitro';

const openBrowser = async () => {
  try {
    if (await InAppBrowser.isAvailable()) {
      const result = await InAppBrowser.open('https://github.com', {
        // iOS options
        preferredBarTintColor: '#453AA4',
        preferredControlTintColor: 'white',
        
        // Android options
        toolbarColor: '#6200EE',
        showTitle: true,
      });
      console.log('🎉 Success:', result);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
};
```

### React Hook API (Recommended)

```tsx
import { useInAppBrowser } from 'react-native-inappbrowser-nitro';

function MyComponent() {
  const { open, isLoading, error } = useInAppBrowser();

  const handleOpenBrowser = async () => {
    try {
      const result = await open('https://github.com', {
        preferredBarTintColor: '#453AA4',
        toolbarColor: '#6200EE',
      });
      console.log('🎉 Browser opened:', result);
    } catch (err) {
      console.error('❌ Failed to open browser:', err);
    }
  };

  return (
    <Button 
      title={isLoading ? "Opening..." : "Open Browser"} 
      onPress={handleOpenBrowser}
      disabled={isLoading}
    />
  );
}
```

### 🔐 Authentication Flow (OAuth/SSO)

```tsx
import { InAppBrowser } from 'react-native-inappbrowser-nitro';

const authenticateUser = async () => {
  try {
    const result = await InAppBrowser.openAuth(
      'https://provider.com/oauth/authorize?client_id=...',
      'your-app://oauth', // redirect URL scheme
      {
        ephemeralWebSession: true, // 🕵️ iOS incognito mode
        showTitle: false,
      }
    );
    
    if (result.type === 'success' && result.url) {
      console.log('🎉 Auth successful:', result.url);
      // Handle successful authentication
    }
  } catch (error) {
    console.error('❌ Auth failed:', error);
  }
};
```

## 📖 API Reference

### Core Methods

| Method | Description | Platform | Performance |
|--------|-------------|----------|-------------|
| `isAvailable()` | Check if InAppBrowser is supported | iOS, Android | ⚡ Instant |
| `open(url, options?)` | Open URL in in-app browser | iOS, Android | ⚡ Native speed |
| `openAuth(url, redirectUrl, options?)` | Open URL for authentication | iOS, Android | ⚡ Native speed |
| `close()` | Close the browser | iOS, Android | ⚡ Instant |
| `closeAuth()` | Close authentication session | iOS, Android | ⚡ Instant |

### Configuration Options

#### 🍎 iOS Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `dismissButtonStyle` | `'done' \| 'close' \| 'cancel'` | Style of dismiss button | `'done'` |
| `preferredBarTintColor` | `string` | Navigation bar background color | System default |
| `preferredControlTintColor` | `string` | Control elements color | System default |
| `readerMode` | `boolean` | Enable Reader mode if available | `false` |
| `animated` | `boolean` | Animate presentation | `true` |
| `modalPresentationStyle` | `string` | Modal presentation style | `'automatic'` |
| `modalTransitionStyle` | `string` | Modal transition style | `'coverVertical'` |
| `modalEnabled` | `boolean` | Present modally vs push | `true` |
| `enableBarCollapsing` | `boolean` | Allow toolbar collapsing | `false` |
| `ephemeralWebSession` | `boolean` | Use incognito mode (auth only) | `false` |

#### 🤖 Android Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `showTitle` | `boolean` | Show page title in toolbar | `true` |
| `toolbarColor` | `string` | Toolbar background color | System default |
| `secondaryToolbarColor` | `string` | Secondary toolbar color | System default |
| `navigationBarColor` | `string` | Navigation bar color | System default |
| `enableUrlBarHiding` | `boolean` | Hide URL bar on scroll | `false` |
| `enableDefaultShare` | `boolean` | Show share button | `false` |
| `animations` | `object` | Custom enter/exit animations | System default |
| `headers` | `object` | Additional HTTP headers | `{}` |
| `forceCloseOnRedirection` | `boolean` | Close on redirect | `false` |
| `hasBackButton` | `boolean` | Show back arrow instead of X | `false` |
| `showInRecents` | `boolean` | Show in Android recents | `true` |

##  Troubleshooting

### 🤖 Android Emulator: "InAppBrowser is not available"

Android emulators often lack pre-installed browsers. The library handles this gracefully:

1. **🥇 First**: Attempts Chrome Custom Tabs
2. **🥈 Fallback**: Uses system browser chooser
3. **🥉 Last resort**: Directs to Play Store for browser installation

**For Development:**
- Install Chrome on your emulator via Play Store
- Use a real device (recommended)
- Use the Web Browser app that comes with some emulators

### 🍎 iOS Simulator Limitations

Safari View Controller has limited functionality on iOS Simulator:
- Use a real iOS device for full testing
- Some features like Reader mode may not work on simulator

## 🎯 Performance Tips

Since this library uses Nitro modules, you get optimal performance out of the box! But here are some additional tips:

```tsx
// 📱 Check availability once and cache the result
const [isSupported, setIsSupported] = useState<boolean>();

useEffect(() => {
  InAppBrowser.isAvailable().then(setIsSupported);
}, []);

// 🎨 Reuse options objects to avoid recreating them
const browserOptions = useMemo(() => ({
  preferredBarTintColor: '#453AA4',
  toolbarColor: '#6200EE',
}), []);
```

## 🤝 Contributing

We welcome contributions! See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and development workflow.

## 📄 License

MIT

---

**Built with ❤️ using [Nitro Modules](https://nitro.margelo.com/) for the React Native community**

*Experience the future of React Native performance today! 🚀*
