package com.inappbrowsernitro.browser

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.net.toUri

internal class BrowserFallback(private val context: Context) {
  fun openSystemBrowser(url: String): Boolean {
    val uri = url.toUri()
    val fallbackIntent = Intent(Intent.ACTION_VIEW, uri)
    return launchSafely(fallbackIntent)
  }

  fun openChooser(url: String): Boolean {
    val uri = url.toUri()
    val intent = Intent(Intent.ACTION_VIEW, uri)
    val chooser = Intent.createChooser(intent, "Choose browser")
    return launchSafely(chooser)
  }

  fun redirectToStore(): Boolean {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("market://search?q=browser"))
    return launchSafely(intent)
  }

  private fun launchSafely(intent: Intent): Boolean {
    if (context !is Activity) {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }

    return try {
      context.startActivity(intent)
      true
    } catch (_: ActivityNotFoundException) {
      false
    }
  }
}
