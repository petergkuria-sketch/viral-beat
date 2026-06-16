import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // App identifier — must match your Apple/Google developer account bundle ID
  appId: 'com.viralbeat.app',
  appName: 'ViralBeat',

  // Point Capacitor at the Vite production build output
  webDir: 'dist/public',

  // Server config: use live URL in development, local files in production
  server: {
    // Uncomment for live-reload during native development:
    // url: 'https://YOUR_DEV_SERVER_URL',
    // cleartext: true,
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'viralbeat.app',
  },

  // iOS-specific settings
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    // Minimum iOS version: 14.0 (covers ~97% of active iPhones)
    minVersion: '14.0',
    // Allow camera/microphone for future video content features
    allowsLinkPreview: true,
  },

  // Android-specific settings
  android: {
    backgroundColor: '#ffffff',
    // Minimum Android SDK: 23 (Android 6.0, covers ~99% of active devices)
    minSdkVersion: 23,
    // Enable hardware back button handling
    allowMixedContent: false,
    captureInput: true,
  },

  // Plugins configuration
  plugins: {
    // Push notifications (for Telegram-style proactive alerts)
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    // Local notifications (offline trend alerts)
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#0ea5e9',
      sound: 'beep.wav',
    },
    // Splash screen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#0ea5e9',
    },
    // Status bar
    StatusBar: {
      style: 'Default',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
