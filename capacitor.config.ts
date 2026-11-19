import type { CapacitorConfig } from '@capacitor/cli'

const BG = '#0b0614'

/**
 * Native shell (iOS/Android). Portrait lock lives in the native projects once they exist:
 * iOS → Info.plist UISupportedInterfaceOrientations = UIInterfaceOrientationPortrait only;
 * Android → android:screenOrientation="portrait" on MainActivity (see README).
 */
const config: CapacitorConfig = {
  appId: 'app.brindy',
  appName: 'Brindy',
  webDir: 'dist',
  backgroundColor: BG,
  ios: {
    backgroundColor: BG,
    contentInset: 'never',
    scrollEnabled: false,
  },
  android: {
    backgroundColor: BG,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      launchAutoHide: true,
      launchFadeOutDuration: 250,
      backgroundColor: BG,
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: BG,
    },
  },
}

export default config
