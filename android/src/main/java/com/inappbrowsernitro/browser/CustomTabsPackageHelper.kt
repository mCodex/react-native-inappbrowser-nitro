package com.inappbrowsernitro.browser

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsClient

internal object CustomTabsPackageHelper {
  fun resolvePackage(context: Context, preferred: String?): String? {
    if (!preferred.isNullOrBlank()) {
      return preferred
    }

    return CustomTabsClient.getPackageName(context, buildIntent())
  }

  private fun buildIntent(): Intent {
    return Intent(Intent.ACTION_VIEW, Uri.parse("http://www.example.com"))
  }
}
