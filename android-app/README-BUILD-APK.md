# GWENO Android APK

The Android project opens `https://gweno.business` inside the GWENO app.

To build and publish the APK, push the updated project to GitHub, then open **Actions → Build GWENO Android APK → Run workflow**. The workflow builds an installable Android APK and places it at `public/downloads/GWENO.apk`; the commit can then trigger a Vercel deployment.

The workflow currently builds a debug-signed APK so it can be installed without release-signing credentials. Before distributing long-term production updates, configure a permanent release keystore through GitHub Actions secrets and use a signed release build. Do not commit a keystore or its passwords to the repository.
