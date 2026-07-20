# iOS Setup & Configuration Guide

## ✅ Firebase Configuration Status

### GoogleService-Info.plist (iOS)
Located at: `ios/skyborne/GoogleService-Info.plist`

| Configuration | Value |
|---|---|
| **Project ID** | `skyborne-bb7ad` |
| **Bundle ID** | `org.skybornedrop.tech` |
| **Google App ID** | `1:398904495705:ios:ef8a7c86b5a5212c1f6b48` |
| **Client ID** | `398904495705-5sfusc2amh3d00j4nmno4iqmth1o68kr` |
| **API Key** | `AIzaSyAJn-xWS_2Ro7uZK4P6Gj_TJI_vaMyg9ng` |
| **GCM Sender ID** | `398904495705` |
| **Storage Bucket** | `skyborne-bb7ad.firebasestorage.app` |

---

## 🔧 Environment Configuration

### `.env` File
Located at: `.env` (root)

```
API_BASE_URL=https://svdevelopment-03-skyborne-backend.onrender.com/api/v1
GOOGLE_KEY=847915544190-6qotha0e5p97dhh13e9gjv0eanp2nrgt.apps.googleusercontent.com
GOOGLE_APP_ID=847915544190-1eafinm1bhfrt5o8b9ljgfc55v4m8pfh.apps.googleusercontent.com
```

### `.env.local` File
Located at: `.env.local` (root) - Local overrides (not committed)

```
API_URL=https://svdevelopment-03-skyborne-backend.onrender.com/api/v1
GOOGLE_KEY=847915544190-6qotha0e5p97dhh13e9gjv0eanp2nrgt.apps.googleusercontent.com
GOOGLE_APP_ID=847915544190-1eafinm1bhfrt5o8b9ljgfc55v4m8pfh.apps.googleusercontent.com
```

### Type Declarations
Located at: `env.d.ts`

Declares TypeScript types for:
- `API_BASE_URL`
- `GOOGLE_KEY`
- `GOOGLE_APP_ID`

---

## 📱 Info.plist Configuration

### URL Schemes
```xml
<CFBundleURLSchemes>
  <string>skybornedrop</string>
  <string>com.googleusercontent.apps.847915544190-6qotha0e5p97dhh13e9gjv0eanp2nrgt</string>
</CFBundleURLSchemes>
```

### Application Queries Schemes (for Google Sign-In)
```xml
<LSApplicationQueriesSchemes>
  <string>googlechromes</string>
  <string>googlehap</string>
  <string>gplus</string>
</LSApplicationQueriesSchemes>
```

### Network Configuration
- **NSAllowsArbitraryLoads**: `false` (secure)
- **NSAllowsLocalNetworking**: `true`

---

## 🚀 Babel & Module Configuration

### babel.config.js
Configured to load environment variables from `.env`:

```javascript
plugins: [
  [
    'module:react-native-dotenv',
    {
      moduleName: '@env',
      path: '.env',
      allowUndefined: true,
    },
  ],
]
```

---

## 📦 Dependencies

### Firebase-related packages:
- `@react-native-google-signin/google-signin@^16.1.1` - Google Sign-In

### Other key packages:
- `@react-native-async-storage/async-storage` - Secure token storage
- `axios` - API calls
- `socket.io-client` - Real-time connections
- `@react-navigation/*` - Navigation
- `react-native-dotenv` - Environment variables

---

## ✅ Checklist Before Running iOS

- [x] `.env` file exists with correct variables
- [x] `.env.local` has been reviewed
- [x] `env.d.ts` declares all environment variables
- [x] `GoogleService-Info.plist` is present
- [x] `Info.plist` has URL schemes configured
- [x] `AppDelegate.swift` handles URL callbacks
- [x] Dependencies are installed (`pod install`)

---

## 🔑 Key IDs Reference

### Firebase Project
- **Project ID**: `skyborne-bb7ad`
- **GCM Sender ID**: `398904495705`

### Google OAuth Credentials
- **Web Client ID**: `847915544190-6qotha0e5p97dhh13e9gjv0eanp2nrgt.apps.googleusercontent.com`
- **iOS Client ID**: `398904495705-5sfusc2amh3d00j4nmno4iqmth1o68kr.apps.googleusercontent.com`
- **Android Client ID**: `398904495705-717jlpl5pujk9647l4n7t5sln975oj11.apps.googleusercontent.com`

### App Configuration
- **App Bundle ID**: `org.skybornedrop.tech`
- **URL Scheme**: `skybornedrop://`
- **Custom Domain**: (if applicable)

---

## 🐛 Troubleshooting

### If Google Sign-In fails:
1. Verify `URL Schemes` in Info.plist includes reversed client ID
2. Check `LSApplicationQueriesSchemes` includes `googlechromes`
3. Verify `GoogleService-Info.plist` is linked to the target

### If environment variables don't load:
1. Ensure `.env` file exists (NOT `.env.local`)
2. Run `npx react-native start --reset-cache`
3. Verify `env.d.ts` has all required variables declared

### If iOS build fails:
1. Run `cd ios && pod install && cd ..`
2. Clear iOS build cache: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`
3. Clean build folder in Xcode: `Cmd+Shift+K`

---

## 📝 Last Updated
Generated: 26 March 2026
