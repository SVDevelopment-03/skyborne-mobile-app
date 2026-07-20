# Physical iPhone Deployment Guide

## Prerequisites

### 1. **Connect iPhone to Mac**
   - Use original USB cable
   - Trust the computer on your iPhone (when prompted)
   - Keep iPhone unlocked during build

### 2. **Xcode & Signing Configuration**
   - Development Team: `9Z76233K33` (already configured)
   - Code Sign Identity: `iPhone Developer`
   - Provisioning Profile: Automatic (recommended)

### 3. **Trust Developer Certificate on iPhone**
   Go to: **Settings → General → VPN & Device Management**
   - Find your developer certificate
   - Tap it and select **Trust**

---

## Deployment Commands

### **Option 1: Automatic Device Detection (Recommended)**
```bash
cd /Users/vignesh/Downloads/SkyBorne-Drop/Skyborne-source-code

# Clean build cache
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ios/Pods
rm -rf ios/Podfile.lock

# Reinstall pods
cd ios && pod install && cd ..

# Run on connected device
npx react-native run-ios --device
```

### **Option 2: Specify Device by Name**
```bash
# First, get your device name:
xcrun xcode-select -p
instruments -s devices

# Then run:
npx react-native run-ios --device "Your Device Name"
# Example: npx react-native run-ios --device "Sonali iPhone"
```

### **Option 3: Full Build with xcodebuild**
```bash
cd /Users/vignesh/Downloads/SkyBorne-Drop/Skyborne-source-code/ios

# For Release build:
xcodebuild -workspace skyborne.xcworkspace \
  -scheme skyborne \
  -configuration Release \
  -destination generic/platform=iOS \
  -derivedDataPath build

# For Debug build:
xcodebuild -workspace skyborne.xcworkspace \
  -scheme skyborne \
  -configuration Debug \
  -destination generic/platform=iOS \
  -derivedDataPath build
```

### **Option 4: Using Xcode GUI**
```bash
open /Users/vignesh/Downloads/SkyBorne-Drop/Skyborne-source-code/ios/skyborne.xcworkspace
```
Then:
1. Select the **skyborne** scheme
2. Select your **iPhone** as the target device
3. Click **Build & Run** (▶️)

---

## Troubleshooting

### **❌ "No development team"**
```bash
# Check current team:
grep -r "DEVELOPMENT_TEAM" ios/skyborne.xcodeproj/project.pbxproj

# Should show: DEVELOPMENT_TEAM = 9Z76233K33;
```

### **❌ "App crashes on launch"**
1. Check device trust settings (Settings → General → VPN & Device Management)
2. Clean build: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`
3. Reinstall pods: `cd ios && pod install --repo-update && cd ..`

### **❌ "Device not found"**
1. Disconnect and reconnect the USB cable
2. Unlock the iPhone
3. Run: `xcrun xcode-select -p` to verify Xcode path
4. List devices: `instruments -s devices`

### **❌ "Build fails with code signing error"**
1. Go to Xcode: **Window → Devices and Simulators**
2. Check if device shows as "Paired"
3. Disconnect and reconnect device

### **❌ "Pod install keeps failing"**
```bash
cd ios
rm -rf Podfile.lock Pods/
pod repo update
pod install --repo-update
cd ..
```

---

## Metro Server Troubleshooting

If port 8081 is already in use:
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or use a different port
npx react-native run-ios --device --port 8082
```

---

## Post-Installation

### Test the App
1. App should launch on your iPhone
2. Check network connectivity (API_BASE_URL should load)
3. Test Google Sign-In flow
4. Verify Firebase is initialized

### View Logs
```bash
# Stream device logs
xcrun simctl spawn booted log stream --predicate 'command == "skyborne"' --level debug

# Or use Xcode: Window → Devices and Simulators → Select device
```

### Debugging
```bash
# Enable debug menu on device: Shake device or Cmd+Ctrl+Z
# Or from terminal for physical device:
# Use Xcode Console to see logs
```

---

## Device Information

**Found Device:** Sonali iPhone
**Project ID:** skyborne-bb7ad
**App Bundle ID:** org.skybornedrop.tech
**Team ID:** 9Z76233K33

---

## Quick Reference Commands

```bash
# Check connected devices
xcrun xcode-select -p
instruments -s devices

# Build and run
cd /Users/vignesh/Downloads/SkyBorne-Drop/Skyborne-source-code
npx react-native run-ios --device

# Reset cache
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf node_modules ios/Pods
npm install && cd ios && pod install && cd ..

# Check logs
sudo log stream --level debug --predicate 'process == "skyborne"'
```

---

## Next Steps

1. ✅ Connect iPhone with USB cable
2. ✅ Trust the Mac on iPhone
3. ✅ Run: `npx react-native run-ios --device`
4. ✅ Wait for build completion (~5-10 minutes first time)
5. ✅ App should launch automatically on device
6. ✅ Check console for any errors

---

**Last Updated:** 26 March 2026
