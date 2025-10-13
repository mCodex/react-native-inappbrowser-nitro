package com.inappbrowsernitro.browser

import android.content.Context
import androidx.browser.customtabs.CustomTabsClient

internal object CustomTabsPackageHelper {
  fun resolvePackage(context: Context, preferred: String?): String? {
    if (!preferred.isNullOrBlank()) {
      return preferred
    }

    return CustomTabsClient.getPackageName(context, null)
  }
}
