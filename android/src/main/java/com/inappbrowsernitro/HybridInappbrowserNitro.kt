package com.inappbrowsernitro

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import com.inappbrowsernitro.browser.AuthSessionManager
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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class HybridInappbrowserNitro : HybridInappbrowserNitroSpec() {
    private val applicationContext get() = NitroModules.applicationContext
    private val authScope = CoroutineScope(Dispatchers.Main.immediate)

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
        return onAuthThread {
            val context = applicationContext
                ?: return@onAuthThread AuthSessionManager.dismiss("React context unavailable")

            AuthSessionManager.start(context, url, redirectUrl, options)
        }
    }

    override fun close(): Promise<Unit> {
        // Custom Tabs runs in a separate Activity; close is handled by the user navigating back.
        return Promise.resolved(Unit)
    }

    override fun closeAuth(): Promise<Unit> {
        return onAuthThread {
            AuthSessionManager.cancel()
        }
    }

    private fun <T> onAuthThread(block: suspend () -> T): Promise<T> {
        val promise = Promise<T>()

        // Queue start and cancel in call order without a background dispatcher hop.
        authScope.launch {
            try {
                promise.resolve(block())
            } catch (error: Exception) {
                promise.reject(error)
            }
        }

        return promise
    }

    private suspend fun openInternal(url: String, options: InAppBrowserOptions?): InAppBrowserResult {
        val context = applicationContext ?: return dismiss("React context unavailable")
        val parsedUri = runCatching { Uri.parse(url) }.getOrNull()
            ?: return dismiss("Invalid browser URL")

        if (parsedUri.scheme?.lowercase() !in setOf("http", "https") ||
            parsedUri.host.isNullOrEmpty() || parsedUri.userInfo != null) {
            return dismiss("Browser URL must use HTTP(S) without credentials")
        }

        val customTabsPackage = CustomTabsPackageHelper.resolvePackage(context, options?.browserPackage)
        val launchContext = applicationContext?.currentActivity ?: context

        if (!options?.browserPackage.isNullOrBlank() && customTabsPackage == null) {
            return dismiss("The selected Custom Tabs browser is unavailable")
        }

        if (customTabsPackage != null) {
            val intent = CustomTabsIntentFactory(context).create(options)
            intent.intent.setPackage(customTabsPackage)

            val launched = launchCustomTab(intent, launchContext, parsedUri)

            if (launched) {
                return InAppBrowserResult(BrowserResultType.SUCCESS, parsedUri.toString(), null)
            }
        }

        val fallbackLaunched = launchFallback(launchContext, parsedUri)

        return if (fallbackLaunched) {
            InAppBrowserResult(BrowserResultType.SUCCESS, parsedUri.toString(), null)
        } else {
            dismiss("No browser available to handle this URL")
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
            } catch (_: SecurityException) {
                false
            }
        }
    }

    private suspend fun launchFallback(context: Context, uri: Uri): Boolean {
        return withContext(Dispatchers.Main) {
            val intent = Intent(Intent.ACTION_VIEW, uri)

            if (context !is Activity) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            try {
                context.startActivity(intent)
                true
            } catch (_: ActivityNotFoundException) {
                false
            } catch (_: SecurityException) {
                false
            }
        }
    }

    private fun dismiss(message: String): InAppBrowserResult {
        return InAppBrowserResult(BrowserResultType.DISMISS, null, message)
    }

    private companion object {
        // Probe URL to check if any browser can handle HTTP intents.
        // Domain is irrelevant; example.com is RFC 2606-reserved.
        private const val SCHEME_CHECK_URL = "https://example.com"
    }
}
