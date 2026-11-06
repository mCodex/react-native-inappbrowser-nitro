package com.inappbrowsernitro.browser

import android.content.Context
import android.content.Intent
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsService

internal object CustomTabsPackageHelper {
  fun resolvePackage(context: Context, preferred: String?): String? {
    if (!preferred.isNullOrBlank()) {
      return CustomTabsClient.getPackageName(context, listOf(preferred), true)
    }

    val serviceIntent = Intent(CustomTabsService.ACTION_CUSTOM_TABS_CONNECTION)
    val providers = context.packageManager.queryIntentServices(serviceIntent, 0)
      .mapNotNull { it.serviceInfo?.packageName }
      .distinct()

    return CustomTabsClient.getPackageName(context, providers)
  }
}
