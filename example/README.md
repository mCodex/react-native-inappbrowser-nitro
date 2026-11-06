# Native example

This workspace app targets React Native 0.88.1 and Nitro 0.37.2. It demonstrates browser options and a configurable authentication session. Install Node 24+, the Android SDK/JDK for Android, and Xcode/Ruby/CocoaPods for iOS.

From the repository root:

```sh
yarn install
yarn codegen
cd example
bundle install
bundle exec pod install --project-directory=ios
```

Skip the Ruby/pod commands when building Android only. Start Metro in one terminal:

```sh
cd example
yarn start
```

Run the app from another terminal:

```sh
cd example
yarn android
# Or, on macOS:
yarn ios
```

## Use your OAuth provider

Set `AUTH_URL` in [App.tsx](./App.tsx) to an authorization URL created by your OAuth client, and register `inappbrowsernitro://callback` with your provider. The example leaves the URL empty until configured. Your OAuth client must create and validate state/PKCE and perform token exchange; the example does not implement those steps.

The app prevents another auth button press while a call is pending. iOS callback-target validation and cancellation/session ownership still have known issues. A successful example build does not establish safe real-provider authentication.

## Android local auth smoke check

The local fixture exercises native callback delivery without an identity provider or credentials. It uses fixed demo code/state values and does not test OAuth token exchange. Use an Android emulator with a Custom Tabs browser installed.

Start the server from the repository root and keep it running:

```sh
node tests/fixtures/auth-server.mjs
```

The server listens on `127.0.0.1:8082`; the emulator reaches it at `10.0.2.2:8082`. This HTTP endpoint is a local test fixture. Use HTTPS authorization endpoints in your app.

Build the fixture as the release entry point from `example/android`:

```sh
cd example/android
ENTRY_FILE=../tests/fixtures/android-auth-smoke.js ./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/release/app-release.apk
adb shell am start -n com.inappbrowsernitroexample/.MainActivity
```

`ENTRY_FILE` is resolved against the React Native project root (`example`), so `../tests` refers to the repository fixtures. Use an ABI matching your emulator; the command above targets arm64. Ensure `adb` is on your PATH.

Run each check after the previous session has finished:

| Button         | Action and expected result                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start auth     | The app shows `pending` while the browser displays a page. Tap **Complete authentication**. The result should be `success` with `inappbrowsernitro://callback?code=demo&state=smoke`. |
| Wrong redirect | The server redirects to an unexpected callback host. It must never produce `success`. Auth Tab can return `dismiss`; a Custom Tabs fallback can remain open until cancellation.       |
| Cancel auth    | The fixture calls `closeAuth()` immediately after `openAuth()` to check call ordering. Expect `cancel`, without completing the page link.                                             |

These are reproducible checks, not a claim that every browser/provider or lifecycle path has passed. For fallback testing, use a provider without Auth Tab and verify host deep-link forwarding. The fixture does not recover pending sessions after process death.

Restore the normal example entry point by building again without the override:

```sh
./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/release/app-release.apk
```

Stop the fixture server with Ctrl+C when finished. See the root [README](../README.md) for installation/API details.
