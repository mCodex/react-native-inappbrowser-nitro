package com.inappbrowsernitro.browser

import android.content.Context
import androidx.browser.customtabs.CustomTabsClient
import androidx.core.content.pm.PackageInfoCompat

internal object CustomTabsPackageHelper {
  fun resolvePackage(context: Context, preferred: String?): String? {
    if (!preferred.isNullOrBlank()) {
      return preferred
    }

    val chromePackage = "com.android.chrome"
    if (isPackageInstalled(context, chromePackage)) {
      return chromePackage
    }

    return CustomTabsClient.getPackageName(context, null)
  }

  private fun isPackageInstalled(context: Context, packageName: String): Boolean {
    return try {
      PackageInfoCompat.getPackageInfo(context.packageManager, packageName, 0L)
      true
    } catch (_: Exception) {
      false
    }
  }
}
