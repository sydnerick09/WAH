# GWENO PWA and Android app setup

## Website changes included
- `public/manifest.webmanifest`: installable web app metadata.
- `public/sw.js`: service worker that caches only public static assets and never caches API/account pages.
- `public/offline.html`: offline fallback page.
- `public/icons/`: generated GWENO app icons.
- `components/RegisterServiceWorker.js`: safely registers the service worker.
- `components/InstallGwenoButton.js`: browser install prompt and manual-install guidance.
- `pages/download-app.js`: public download page with both installation options.
- `pages/index.js`: adds the app download link to the home page and footer.
- `pages/_app.js`, `pages/_document.js`, `next.config.js`: PWA registration and metadata/headers.

## Apply the website files
Copy the files in this ZIP into the matching paths in your existing `GWENO` project, replacing files when prompted. Do not replace your `.env` files or other project files.

Commit and push:
```powershell
git add pages/index.js pages/download-app.js pages/_app.js pages/_document.js next.config.js components/RegisterServiceWorker.js components/InstallGwenoButton.js public/manifest.webmanifest public/sw.js public/offline.html public/icons PWA-ANDROID-SETUP.md android-app pages/api/mpesa/premium.js
git commit -m "Add GWENO installable web app and Android project"
git push origin main
```

After Vercel deployment, open `https://gweno.business/download-app`. The PWA install option can be used without publishing to an app store, provided the domain is serving HTTPS and the deployment is live.

## Android APK
The `android-app` folder is an Android Studio project that wraps the secure website and supports file picking for task uploads. It is source code, not a built APK. To make the APK available to clients:
1. Open `android-app` in Android Studio and let Gradle sync.
2. Build and test a debug APK.
3. Generate a signed release APK from Android Studio. Keep the signing key and password private.
4. Test the signed APK on a real phone, especially sign-in, task uploads, M-Pesa payment steps, and navigation.
5. Copy the signed APK to the website project as `public/downloads/GWENO.apk`.
6. Commit and deploy that APK. The download page checks for the file and will show the APK download button once it exists.

Do not distribute an unsigned/debug build as the official public release. The signed APK is not included in this ZIP because it must be built and signed using your release key.
