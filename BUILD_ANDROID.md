# Android Build Guide (Capacitor)

This guide explains how to convert the HTML5 Suika Game clone into a native Android app using Capacitor.

## Prerequisites
- Node.js & npm (Installed)
- Android Studio (For building the APK)

## 1. Initialize Capacitor Project

Run these commands in the terminal inside the project folder:

```bash
# 1. Initialize a new npm project (if not already done)
npm init -y

# 2. Install Capacitor core and CLI
npm install @capacitor/core
npm install -D @capacitor/cli

# 3. Initialize Capacitor (App Name: SuikaClone, ID: com.example.suikaclone)
npx cap init SuikaClone com.example.suikaclone
```

## 2. Configure Web Assets

Capacitor needs to know where your web files are.
Open `capacitor.config.json` and ensure `webDir` is set to the current directory (or wherever index.html is).
*Note: Usually it's better to move `index.html` and `game.js` into a `www` or `dist` folder.*

```json
{
  "appId": "com.example.suikaclone",
  "appName": "SuikaClone",
  "webDir": "www", 
  "bundledWebRuntime": false
}
```

**Action:** Create a `www` folder and move your game files there.
```bash
mkdir www
mv index.html game.js www/
```

## 3. Add Android Platform

```bash
# Install android platform
npm install @capacitor/android

# Add the platform
npx cap add android
```

## 4. Build & Sync

```bash
# Sync your web assets to the native project
npx cap sync
```

## 5. Open in Android Studio

```bash
npx cap open android
```
- Wait for Gradle sync to finish.
- Connect an Android device or use an Emulator.
- Click the **Run** (Play) button.

## Resources
- **Icons/Splash Screen:** Replace files in `android/app/src/main/res/`
- **Permissions:** Edit `android/app/src/main/AndroidManifest.xml`

---
**Contact Mico for:**
- App Icon assets (512x512 png)
- Splash Screen design
- Google Play Store developer account credentials (if publishing)
