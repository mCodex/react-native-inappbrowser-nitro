package com.inappbrowsernitro

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import com.inappbrowsernitro.browser.BrowserFallback
import com.inappbrowsernitro.browser.CustomTabsIntentFactory
import com.inappbrowsernitro.browser.CustomTabsPackageHelper
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import com.margelo.nitro.inappbrowsernitro.BrowserResultType
import com.margelo.nitro.inappbrowsernitro.HybridInappbrowserNitroSpec
import com.margelo.nitro.inappbrowsernitro.InAppBrowserAuthResult
import com.margelo.nitro.inappbrowsernitro.InAppBrowserOptions
import com.margelo.nitro.inappbrowsernitro.InAppBrowserResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class HybridInappbrowserNitro : HybridInappbrowserNitroSpec() {
    private val reactContext get() = NitroModules.applicationContext
    private val applicationContext: Context?
        get() = reactContext ?: NitroModules.applicationContext

    override fun isAvailable(): Promise<Boolean> {
        val context = applicationContext ?: return Promise.resolved(false)
        val customTabsPackage = CustomTabsPackageHelper.resolvePackage(context, null)
        if (customTabsPackage != null) {
            return Promise.resolved(true)
        }

        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(SCHEME_CHECK_URL))
        val canHandle = intent.resolveActivity(context.packageManager) != null
        return Promise.resolved(canHandle)
    }

    override fun open(url: String, options: InAppBrowserOptions?): Promise<InAppBrowserResult> {
        return Promise.async {
            openInternal(url, options)
        }
    }

    override fun openAuth(url: String, redirectUrl: String, options: InAppBrowserOptions?): Promise<InAppBrowserAuthResult> {
        return Promise.async {
            val result = openInternal(url, options)
            InAppBrowserAuthResult(result.type, result.url, result.message)
        }
    }

    override fun close(): Promise<Unit> {
        return Promise.resolved(Unit)
    }

    override fun closeAuth(): Promise<Unit> {
        return Promise.resolved(Unit)
    }

    private suspend fun openInternal(url: String, options: InAppBrowserOptions?): InAppBrowserResult {
        val context = applicationContext ?: return dismiss("React context unavailable")
        val parsedUri = runCatching { Uri.parse(url) }.getOrNull()
            ?: return dismiss("Invalid URL: $url")

        val customTabsPackage = CustomTabsPackageHelper.resolvePackage(context, null)
        val launchContext = reactContext?.currentActivity ?: context

        if (customTabsPackage == "com.android.chrome") {
            val intent = CustomTabsIntentFactory(context, null).create(options)
            intent.intent.setPackage(customTabsPackage)
            val launched = launchCustomTab(intent, launchContext, parsedUri)
            if (launched) {
                return InAppBrowserResult(BrowserResultType.SUCCESS, parsedUri.toString(), null)
            }
        }

        val fallbackLaunched = launchFallback(launchContext, url)
        return if (fallbackLaunched) {
            InAppBrowserResult(BrowserResultType.SUCCESS, parsedUri.toString(), null)
        } else {
            dismiss("No browser available to handle $url")
        }
    }

    private suspend fun launchCustomTab(intent: CustomTabsIntent, context: Context, uri: Uri): Boolean {
        return withContext(Dispatchers.Main) {
            try {
                if (context !is Activity) {
                    intent.intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                intent.launchUrl(context, uri)
                true
            } catch (_: ActivityNotFoundException) {
                false
            }
        }
    }

    private fun launchFallback(context: Context, url: String): Boolean {
        val fallback = BrowserFallback(context)
        if (fallback.openSystemBrowser(url)) return true
        if (fallback.openChooser(url)) return true
        return fallback.redirectToStore()
    }

    private fun dismiss(message: String): InAppBrowserResult {
        return InAppBrowserResult(BrowserResultType.DISMISS, null, message)
    }

    private companion object {
        private const val SCHEME_CHECK_URL = "https://example.com"
    }
}
