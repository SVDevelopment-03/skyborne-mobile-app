# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# ============ Axios & HTTP Libraries ============
-keep class axios.** { *; }
-keep interface axios.** { *; }
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# ============ Firebase ============
-keep class com.google.firebase.** { *; }
-keep interface com.google.firebase.** { *; }

# ============ React Native ============
-keep class com.facebook.react.** { *; }
-keep interface com.facebook.react.** { *; }

# ============ Socket.io ============
-keep class io.socket.** { *; }
-keep interface io.socket.** { *; }

# ============ Keep all native methods ============
-keepclasseswithmembernames class * {
    native <methods>;
}

# ============ Keep custom models & enums ============
-keep class * extends java.lang.Enum { *; }
-keep class com.skyborne.drop.** { *; }

# ============ Keep all interfaces ============
-keep interface * { *; }

# ============ Google Play Services & Auth ============
-keep class com.google.android.gms.** { *; }
-keep interface com.google.android.gms.** { *; }
-keep class com.google.api.** { *; }
