# AgriConnect Android APK

## Current delivery status

The production application is a Next.js web app. This repository now contains the mobile-first UI redesign on branch `ui-redesign-and-apk`.

## APK packaging

The APK should package the deployed AgriConnect web application using a supported Android WebView wrapper (Capacitor or Trusted Web Activity). The production URL must be configured before generating a signed release APK.

Recommended release flow:

1. Deploy the `ui-redesign-and-apk` branch to the production Vercel project.
2. Verify `/`, `/farmer`, `/fpo`, `/buyer`, `/matching`, `/price-prediction`, and `/logistics`.
3. Create an Android wrapper pointing at the verified HTTPS production URL.
4. Run the Android release build with the configured application ID and signing key.
5. Install the generated APK on a physical Android device and smoke-test login, navigation, listing, matching, price prediction, logistics and settlement.

Do not call an APK complete until the release artifact has been built and installed successfully.
