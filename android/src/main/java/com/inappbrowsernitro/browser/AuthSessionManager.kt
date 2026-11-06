package com.inappbrowsernitro.browser

import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.browser.customtabs.CustomTabsClient
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.margelo.nitro.inappbrowsernitro.BrowserResultType
import com.margelo.nitro.inappbrowsernitro.InAppBrowserAuthResult
import com.margelo.nitro.inappbrowsernitro.InAppBrowserOptions
import java.lang.ref.WeakReference
import java.net.URI
import java.util.UUID
import kotlin.coroutines.Continuation
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

internal object AuthSessionManager {
  internal data class Request(
    val id: String,
    val url: String,
    val redirect: AuthRedirect,
    val options: InAppBrowserOptions?,
    val provider: String,
    val useAuthTab: Boolean,
  )

  private data class Pending(
    val request: Request,
    val context: ReactApplicationContext,
    val listener: BaseActivityEventListener,
    val continuation: Continuation<InAppBrowserAuthResult>,
    var activity: WeakReference<AuthTabActivity>? = null,
  )

  private var pending: Pending? = null
  private val mainHandler = Handler(Looper.getMainLooper())

  suspend fun start(
    context: ReactApplicationContext,
    url: String,
    redirectUrl: String,
    options: InAppBrowserOptions?,
  ): InAppBrowserAuthResult = withContext(Dispatchers.Main.immediate) {
    if (pending != null) return@withContext dismiss("Authentication already in progress")

    val host = context.currentActivity
      ?: return@withContext dismiss("An active Activity is required for authentication")

    val initialUrl = runCatching { URI(url) }.getOrNull()

    if (initialUrl?.scheme?.lowercase() !in setOf("http", "https") ||
      initialUrl?.host == null || initialUrl.rawUserInfo != null) {
      return@withContext dismiss("Authentication URL must use HTTP(S) without credentials")
    }

    val redirect = runCatching { AuthRedirect(redirectUrl) }.getOrNull()
      ?: return@withContext dismiss("Invalid authentication redirect")

    val provider = CustomTabsPackageHelper.resolvePackage(context, options?.browserPackage)
      ?: return@withContext dismiss("No Custom Tabs browser is available for authentication")

    if (options?.ephemeralWebSession == true &&
      !CustomTabsClient.isEphemeralBrowsingSupported(context, provider)) {
      return@withContext dismiss("The selected browser does not support ephemeral authentication")
    }

    val request = Request(
      UUID.randomUUID().toString(), url, redirect, options, provider,
      CustomTabsClient.isAuthTabSupported(context, provider),
    )

    suspendCoroutine { continuation ->
      val listener = object : BaseActivityEventListener() {
        override fun onNewIntent(intent: Intent) {
          // Auth Tab must finish through its verified Activity Result channel.
          if (request.useAuthTab) return

          val callback = intent.dataString ?: return

          if (request.redirect.matches(callback)) {
            complete(request.id, InAppBrowserAuthResult(BrowserResultType.SUCCESS, callback, null), true)
          }
        }
      }

      pending = Pending(request, context, listener, continuation)
      context.addActivityEventListener(listener)

      try {
        host.startActivity(Intent(host, AuthTabActivity::class.java).putExtra(AuthTabActivity.SESSION_ID, request.id))
      } catch (error: RuntimeException) {
        complete(request.id, dismiss("Unable to launch authentication: ${error.javaClass.simpleName}"))
      }
    }
  }

  fun attach(id: String?, activity: AuthTabActivity): Request? {
    val session = pending?.takeIf { it.request.id == id } ?: return null
    session.activity = WeakReference(activity)

    return session.request
  }

  fun complete(id: String?, result: InAppBrowserAuthResult, closeBrowser: Boolean = false) {
    val session = pending?.takeIf { it.request.id == id } ?: return
    pending = null

    session.context.removeActivityEventListener(session.listener)

    val activity = session.activity?.get()

    try {
      if (closeBrowser) {
        activity?.closeBrowser()
      } else {
        activity?.finish()
      }
    } catch (error: RuntimeException) {
      Log.w("InAppBrowserNitro", "Unable to dismiss authentication browser", error)
    } finally {
      session.continuation.resume(result)
    }
  }

  fun cancelAfterReturn(id: String?) {
    // A host singleTask callback can destroy the proxy before onNewIntent is delivered.
    mainHandler.post {
      complete(id, InAppBrowserAuthResult(BrowserResultType.CANCEL, null, null))
    }
  }

  suspend fun cancel() = withContext(Dispatchers.Main.immediate) {
    complete(pending?.request?.id, InAppBrowserAuthResult(BrowserResultType.CANCEL, null, null), true)
  }

  fun dismiss(message: String) = InAppBrowserAuthResult(BrowserResultType.DISMISS, null, message)
}
