package com.inappbrowsernitro.browser

import android.content.Context
import android.content.pm.PackageManager
import androidx.browser.customtabs.CustomTabsClient

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
      context.packageManager.getPackageInfo(packageName, 0)
      true
    } catch (e: PackageManager.NameNotFoundException) {
      false
    }
  }
}
