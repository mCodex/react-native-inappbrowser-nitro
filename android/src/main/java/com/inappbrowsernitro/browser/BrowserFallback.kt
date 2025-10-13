package com.inappbrowsernitro.browser

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import androidx.core.net.toUri

internal class BrowserFallback(private val activity: Activity) {
  fun openSystemBrowser(url: String): Boolean {
    val uri = url.toUri()

    return try {
      val fallbackIntent = Intent(Intent.ACTION_VIEW, uri)
      activity.startActivity(fallbackIntent)
      true
    } catch (_: ActivityNotFoundException) {
      false
    }
  }

  fun openChooser(url: String): Boolean {
    val uri = url.toUri()
    val intent = Intent(Intent.ACTION_VIEW, uri)
    val chooser = Intent.createChooser(intent, "Choose browser")

    return try {
      activity.startActivity(chooser)
      true
    } catch (_: ActivityNotFoundException) {
      false
    }
  }

  fun redirectToStore(): Boolean {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("market://search?q=browser"))
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

    return try {
      activity.startActivity(intent)
      true
    } catch (_: ActivityNotFoundException) {
      false
    }
  }
}
