/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React
import ReactAppDependencyProvider
import React_RCTAppDelegate
import UIKit
import AppTrackingTransparency
import FirebaseCore
import GoogleSignIn

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  private var hasStartedReactNative = false
  private var pendingLaunchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
    }

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    #if DEBUG
    let devMenuConfiguration = RCTDevMenuConfiguration(
      devMenuEnabled: true,
      shakeGestureEnabled: true,
      keyboardShortcutsEnabled: true
    )
    reactNativeFactory?.devMenuConfiguration = devMenuConfiguration
    #endif

    window = UIWindow(frame: UIScreen.main.bounds)
    pendingLaunchOptions = launchOptions

    // Defer React Native startup until the app is active so ATT can appear
    // on a visible screen and App Review can reliably locate it.

    return true
  }

  func applicationDidBecomeActive(_ application: UIApplication) {
    requestAppTrackingAuthorizationIfNeeded { [weak self] in
      self?.startReactNativeIfNeeded(launchOptions: self?.pendingLaunchOptions)
      self?.pendingLaunchOptions = nil
    }
  }

  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey : Any] = [:]
  ) -> Bool {
    if GIDSignIn.sharedInstance.handle(url) {
      return true
    }

    forwardDeepLink(url)
    return true
  }

  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    if let webpageURL = userActivity.webpageURL {
      forwardDeepLink(webpageURL)
      return true
    }

    return false
  }

  private func forwardDeepLink(_ url: URL) {
    NotificationCenter.default.post(
      name: Notification.Name("RCTOpenURLNotification"),
      object: self,
      userInfo: ["url": url.absoluteString]
    )
  }

  private func startReactNativeIfNeeded(launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) {
    guard !hasStartedReactNative else {
      return
    }

    hasStartedReactNative = true
    reactNativeFactory?.startReactNative(
      withModuleName: "skyborne",
      in: window,
      launchOptions: launchOptions
    )
  }

  private func requestAppTrackingAuthorizationIfNeeded(completion: @escaping () -> Void = {}) {
    guard #available(iOS 14, *) else {
      completion()
      return
    }

    guard ATTrackingManager.trackingAuthorizationStatus == .notDetermined else {
      completion()
      return
    }

    // Trigger the sheet once the app is active so App Review can reliably
    // observe it on the review device.
    ATTrackingManager.requestTrackingAuthorization { _ in
      DispatchQueue.main.async {
        completion()
      }
    }
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
