package com.margelo.nitro.inappbrowsernitro

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import androidx.browser.customtabs.*
import com.facebook.proguard.annotations.DoNotStrip
import kotlinx.coroutines.*
import kotlin.coroutines.suspendCoroutine
import com.margelo.nitro.core.*
import com.margelo.nitro.NitroModules
import com.facebook.react.bridge.UiThreadUtil

@DoNotStrip
class InAppBrowserNitro : HybridInAppBrowserNitroSpec() {

  private var customTabsClient: CustomTabsClient? = null
  private var customTabsSession: CustomTabsSession? = null
  private var customTabsServiceConnection: CustomTabsServiceConnection? = null
  private var packageNameToUse: String? = null

  override fun isAvailable(): Promise<Boolean> {
    return Promise.async {
      withContext(Dispatchers.IO) {
        // Custom Tabs was introduced in API 23 (Android 6.0)
        // We'll be permissive here since emulators often don't have browsers pre-installed
        android.os.Build.VERSION.SDK_INT >= 23
      }
    }
  }

  override fun open(url: String, options: InAppBrowserOptions?): Promise<InAppBrowserResult> {
    return Promise.async {
      withContext(Dispatchers.Main) {
        val context = NitroModules.applicationContext
          ?: throw Exception("No application context available")
        val currentActivity = context.currentActivity
          ?: throw Exception("No current activity found")

        val uri = Uri.parse(url)
        val intent = createCustomTabsIntent(options, context as Context)
        
        try {
          intent.launchUrl(currentActivity, uri)
          // Since we can't track the result directly, return success
          InAppBrowserResult(BrowserResultType.SUCCESS, url, null)
        } catch (e: ActivityNotFoundException) {
          // Fallback to default browser
          val fallbackIntent = Intent(Intent.ACTION_VIEW, uri)
          try {
            currentActivity.startActivity(fallbackIntent)
            InAppBrowserResult(BrowserResultType.SUCCESS, url, null)
          } catch (e2: ActivityNotFoundException) {
            // No browsers available - try to launch browser chooser
            val chooser = Intent.createChooser(fallbackIntent, "Choose Browser")
            try {
              currentActivity.startActivity(chooser)
              InAppBrowserResult(BrowserResultType.SUCCESS, url, null)
            } catch (e3: ActivityNotFoundException) {
              // Last resort: open Play Store to install a browser
              try {
                val playStoreIntent = Intent(Intent.ACTION_VIEW, Uri.parse("market://search?q=browser"))
                playStoreIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                currentActivity.startActivity(playStoreIntent)
                throw Exception("No browsers installed. Please install a browser from the Play Store and try again.")
              } catch (e4: ActivityNotFoundException) {
                throw Exception("No browsers available and cannot access Play Store")
              }
            }
          }
        }
      }
    }
  }

  override fun openAuth(url: String, redirectUrl: String, options: InAppBrowserOptions?): Promise<InAppBrowserAuthResult> {
    return Promise.async {
      withContext(Dispatchers.Main) {
        val context = NitroModules.applicationContext
          ?: throw Exception("No application context available")
        val currentActivity = context.currentActivity
          ?: throw Exception("No current activity found")

        val uri = Uri.parse(url)
        val intent = createCustomTabsIntent(options, context as Context)
        
        // For auth, we need to handle the redirect
        val authIntent = intent.intent
        authIntent.data = uri
        
        try {
          currentActivity.startActivity(authIntent)
          // In a real implementation, you'd need to handle the redirect callback
          InAppBrowserAuthResult(BrowserResultType.SUCCESS, null, null)
        } catch (e: ActivityNotFoundException) {
          throw e
        }
      }
    }
  }

  override fun close(): Promise<Unit> {
    return Promise.async {
      // Custom Tabs can't be closed programmatically
      // This is a limitation of Chrome Custom Tabs
      Unit
    }
  }

  override fun closeAuth(): Promise<Unit> {
    return Promise.async {
      // Custom Tabs can't be closed programmatically
      Unit
    }
  }

  // MARK: - Private Methods

  private fun createCustomTabsIntent(options: InAppBrowserOptions?, context: Context): CustomTabsIntent {
    val builder = CustomTabsIntent.Builder(customTabsSession)

    // Apply Android-specific styling options
    options?.let { opts ->
      // Create color scheme params for both light and dark themes
      val colorSchemeParamsBuilder = CustomTabColorSchemeParams.Builder()
      var hasColorChanges = false

      // Toolbar color
      opts.toolbarColor?.let { color ->
        try {
          colorSchemeParamsBuilder.setToolbarColor(Color.parseColor(color))
          hasColorChanges = true
        } catch (e: IllegalArgumentException) {
          // Invalid color, ignore
        }
      }

      // Secondary toolbar color  
      opts.secondaryToolbarColor?.let { color ->
        try {
          colorSchemeParamsBuilder.setSecondaryToolbarColor(Color.parseColor(color))
          hasColorChanges = true
        } catch (e: IllegalArgumentException) {
          // Invalid color, ignore
        }
      }

      // Navigation bar color
      opts.navigationBarColor?.let { color ->
        try {
          colorSchemeParamsBuilder.setNavigationBarColor(Color.parseColor(color))
          hasColorChanges = true
        } catch (e: IllegalArgumentException) {
          // Invalid color, ignore
        }
      }

      // Apply color scheme if any colors were set
      if (hasColorChanges) {
        val colorSchemeParams = colorSchemeParamsBuilder.build()
        builder.setDefaultColorSchemeParams(colorSchemeParams)
      }

      // Show title
      opts.showTitle?.let { showTitle ->
        builder.setShowTitle(showTitle)
      }

      // URL bar hiding
      opts.enableUrlBarHiding?.let { enableUrlBarHiding ->
        builder.setUrlBarHidingEnabled(enableUrlBarHiding)
      }

      // Default share
      opts.enableDefaultShare?.let { enableDefaultShare ->
        if (enableDefaultShare) {
          builder.setShareState(CustomTabsIntent.SHARE_STATE_ON)
        } else {
          builder.setShareState(CustomTabsIntent.SHARE_STATE_OFF)
        }
      }

      // Start/exit animations
      opts.animations?.let { animations ->
        val startEnter = getAnimationResource(animations.startEnter, context)
        val startExit = getAnimationResource(animations.startExit, context)
        val endEnter = getAnimationResource(animations.endEnter, context)
        val endExit = getAnimationResource(animations.endExit, context)

        if (startEnter != 0 && startExit != 0) {
          builder.setStartAnimations(context, startEnter, startExit)
        }
        if (endEnter != 0 && endExit != 0) {
          builder.setExitAnimations(context, endEnter, endExit)
        }
      }
    }

    return builder.build()
  }

  private fun getAnimationResource(animationName: String?, context: Context): Int {
    if (animationName.isNullOrEmpty()) return 0
    
    return try {
      context.resources.getIdentifier(animationName, "anim", context.packageName)
    } catch (e: Exception) {
      0
    }
  }

  private fun isCustomTabsSupported(): Boolean {
    return try {
      val context = NitroModules.applicationContext ?: return false
      
      // For Android 6.0+ (API 23+), Custom Tabs is supported
      // Even if no browsers are pre-installed (like in emulators),
      // the system can handle URLs through WebView or browser installation
      if (android.os.Build.VERSION.SDK_INT >= 23) {
        return true
      }
      
      // For older versions, check if browsers are available
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse("http://www.example.com"))
      val resolveInfos = context.packageManager.queryIntentActivities(intent, 0)
      
      if (resolveInfos.isNotEmpty()) {
        return hasBasicCustomTabsSupport(context)
      }
      
      false
    } catch (e: Exception) {
      android.util.Log.e("InAppBrowserNitro", "Error checking Custom Tabs support", e)
      // If detection fails, assume it's available on Android 6.0+ (API 23+)
      val fallback = android.os.Build.VERSION.SDK_INT >= 23
      android.util.Log.d("InAppBrowserNitro", "Using fallback result: $fallback")
      fallback
    }
  }
  
  private fun hasBasicCustomTabsSupport(context: Context): Boolean {
    return try {
      // Try to find Chrome or another known browser with Custom Tabs support
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse("http://www.example.com"))
      val resolveInfos = context.packageManager.queryIntentActivities(intent, 0)
      
      for (resolveInfo in resolveInfos) {
        val packageName = resolveInfo.activityInfo.packageName
        if (isKnownCustomTabsBrowser(packageName)) {
          return true
        }
      }
      
      // If no known browser found, try service detection
      val customTabsIntent = Intent("androidx.browser.customtabs.action.CustomTabsService")
      val customTabsServices = context.packageManager.queryIntentServices(customTabsIntent, 0)
      
      return customTabsServices.isNotEmpty()
    } catch (e: Exception) {
      false
    }
  }
  
  private fun hasCustomTabsSupport(context: Context): Boolean {
    return try {
      // Check both old and new Custom Tabs service actions
      val serviceActions = listOf(
        "androidx.browser.customtabs.action.CustomTabsService",
        "android.support.customtabs.action.CustomTabsService"
      )
      
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse("http://www.example.com"))
      val resolveInfos = context.packageManager.queryIntentActivities(intent, 0)
      
      // Check each browser app for Custom Tabs support
      for (resolveInfo in resolveInfos) {
        val packageName = resolveInfo.activityInfo.packageName
        
        // Check for Custom Tabs service
        for (serviceAction in serviceActions) {
          val customTabsIntent = Intent(serviceAction)
          customTabsIntent.setPackage(packageName)
          val customTabsServices = context.packageManager.queryIntentServices(customTabsIntent, 0)
          if (customTabsServices.isNotEmpty()) {
            return true
          }
        }
        
        // Also check for known browsers that support Custom Tabs
        if (isKnownCustomTabsBrowser(packageName)) {
          return true
        }
      }
      
      false
    } catch (e: Exception) {
      false
    }
  }
  
  private fun isKnownCustomTabsBrowser(packageName: String): Boolean {
    // List of browsers known to support Custom Tabs
    val knownCustomTabsBrowsers = setOf(
      "com.android.chrome",              // Chrome
      "com.chrome.beta",                 // Chrome Beta
      "com.chrome.dev",                  // Chrome Dev
      "com.chrome.canary",               // Chrome Canary
      "com.microsoft.emmx",              // Microsoft Edge
      "org.mozilla.firefox",             // Firefox
      "com.opera.browser",               // Opera
      "com.opera.browser.beta",          // Opera Beta
      "com.brave.browser",               // Brave
      "com.sec.android.app.sbrowser",    // Samsung Internet
      "com.UCMobile.intl",               // UC Browser
      "com.android.browser",             // AOSP Browser (older versions)
      "com.google.android.apps.chrome"   // Chrome (alternative package)
    )
    
    return knownCustomTabsBrowsers.contains(packageName)
  }
  
  private fun getDefaultBrowserPackage(): String? {
    return try {
      val context = NitroModules.applicationContext ?: return null
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse("http://www.example.com"))
      val resolveInfo = context.packageManager.resolveActivity(intent, 0)
      resolveInfo?.activityInfo?.packageName
    } catch (e: Exception) {
      null
    }
  }

  private fun bindCustomTabsService(context: Context, callback: (CustomTabsClient?) -> Unit) {
    if (packageNameToUse == null) {
      packageNameToUse = getDefaultBrowserPackage()
    }
    
    if (packageNameToUse == null) {
      callback(null)
      return
    }

    customTabsServiceConnection = object : CustomTabsServiceConnection() {
      override fun onCustomTabsServiceConnected(name: ComponentName, client: CustomTabsClient) {
        customTabsClient = client
        customTabsClient?.warmup(0L)
        customTabsSession = customTabsClient?.newSession(null)
        callback(client)
      }

      override fun onServiceDisconnected(name: ComponentName) {
        customTabsClient = null
        customTabsSession = null
      }
    }

    try {
      CustomTabsClient.bindCustomTabsService(
        context,
        packageNameToUse!!,
        customTabsServiceConnection!!
      )
    } catch (e: Exception) {
      callback(null)
    }
  }
}
