# GWENO Android APK project

This is the Android Studio project for a lightweight GWENO HUB Android app. It opens the live secure website at `https://gweno.business`, so sign-in, tasks, and account actions continue to use the existing web application.

## Build the APK

1. Install Android Studio on a computer and install Android SDK Platform 35 and a compatible Android SDK Build-Tools version.
2. Open Android Studio and choose **Open**, then select this `android-app` folder.
3. Allow Gradle sync to finish.
4. Use **Build > Build Bundle(s) / APK(s) > Build APK(s)** for a test APK.
5. For a client release, use **Build > Generate Signed Bundle / APK > APK** and create/store a signing key securely. Do not share the keystore or its password.
6. Test the APK on a real Android phone, including sign-in, navigation, M-Pesa flows, and external links.
7. Copy the signed release APK to the web project at `public/downloads/GWENO.apk`, then deploy the website. The `/download-app` page will automatically show the APK download button when that file is available.

## Important

- The project source is supplied; this ZIP does not contain a built or signed APK.
- A signed release APK must be generated and tested before distributing it to clients.
- The app requires internet access. It is a secure WebView wrapper, not a standalone offline implementation.
- The APK signing keystore is private and must be backed up safely. Losing it can prevent publishing future updates under the same app identity.
