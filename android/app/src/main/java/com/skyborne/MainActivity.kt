package com.skyborne.drop

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "skyborne"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    
    // Handle deep link or notification tap
    handleNotificationOrDeepLink(intent)
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Handle initial launch from notification or deep link
    handleNotificationOrDeepLink(intent)
  }

  private fun handleNotificationOrDeepLink(intent: Intent) {
    // Check for direct deep link URI
    val deepLinkUri: Uri? = intent.data
    if (deepLinkUri != null) {
      Log.d("MainActivity", "Deep link received: ${deepLinkUri.toString()}")
      return
    }

    // Check for Firebase notification data in extras
    val extras: Bundle? = intent.extras
    if (extras != null) {
      val classId = extras.getString("classId") ?: extras.getString("meetingId")
      val productId = extras.getString("productId")
      val screen = extras.getString("screen")
      val deeplink = extras.getString("deeplink")

      Log.d(
        "MainActivity",
        "Notification data - classId: $classId, productId: $productId, screen: $screen, deeplink: $deeplink"
      )

      // Construct deep link from notification data
      val constructedUri = when {
        !classId.isNullOrEmpty() -> Uri.parse("skybornedrop://class/$classId")
        !productId.isNullOrEmpty() -> Uri.parse("skybornedrop://product/$productId")
        !deeplink.isNullOrEmpty() -> Uri.parse(deeplink)
        !screen.isNullOrEmpty() -> Uri.parse("skybornedrop://$screen")
        else -> null
      }

      if (constructedUri != null) {
        Log.d("MainActivity", "Constructed URI: ${constructedUri.toString()}")
        val newIntent = Intent(intent).apply {
          action = Intent.ACTION_VIEW
          data = constructedUri
          flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        intent.data = constructedUri
      }
    }
  }
}
