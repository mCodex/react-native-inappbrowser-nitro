/**
 * Babel config used both by the example app (which loads
 * `module:@react-native/babel-preset` via Metro) and by `react-native-builder-bob`
 * when compiling the library output to `lib/`.
 *
 * Bob calls babel directly and sets `caller.supportsStaticESM = true` for the
 * `module` target so we use bob's bundled preset (which honors that caller flag
 * to preserve ESM in `lib/module/`). The example app's Metro pipeline uses the
 * RN preset via its own `babel.config.js`, so this config does NOT need to
 * include the RN preset.
 *
 * `babel-plugin-react-compiler` runs first so subsequent transforms (preset-env,
 * etc.) operate on the compiler-emitted output.
 */
module.exports = {
  presets: ['react-native-builder-bob/babel-preset'],
  plugins: [['babel-plugin-react-compiler', { target: '19' }]],
}
