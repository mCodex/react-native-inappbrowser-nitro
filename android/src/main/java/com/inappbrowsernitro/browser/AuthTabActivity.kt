package com.inappbrowsernitro.browser

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.browser.auth.AuthTabIntent
import androidx.browser.customtabs.CustomTabsIntent
import com.margelo.nitro.inappbrowsernitro.BrowserResultType
import com.margelo.nitro.inappbrowsernitro.InAppBrowserAuthResult

internal class AuthTabActivity : ComponentActivity() {
  private val sessionId get() = intent.getStringExtra(SESSION_ID)

  private val launcher = AuthTabIntent.registerActivityResultLauncher(this) { result ->
    val request = AuthSessionManager.attach(sessionId, this)
    val callback = result.resultUri?.toString()

    when (result.resultCode) {
      AuthTabIntent.RESULT_OK -> {
        val outcome = if (callback != null && request?.redirect?.matches(callback) == true) {
          InAppBrowserAuthResult(BrowserResultType.SUCCESS, callback, null)
        } else {
          AuthSessionManager.dismiss("Authentication returned an unexpected redirect")
        }

        AuthSessionManager.complete(sessionId, outcome)
      }
      AuthTabIntent.RESULT_CANCELED -> AuthSessionManager.cancelAfterReturn(sessionId)
      else -> AuthSessionManager.complete(
        sessionId,
        AuthSessionManager.dismiss("Authentication failed or redirect verification was unsuccessful"),
      )
    }

    finish()
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val request = AuthSessionManager.attach(sessionId, this)

    if (request == null) {
      finish()
      return
    }

    if (savedInstanceState != null) return

    try {
      val tab = AuthTabIntent.Builder()
        .setEphemeralBrowsingEnabled(request.options?.ephemeralWebSession == true)
        .build()

      tab.intent.setPackage(request.provider)

      if (request.useAuthTab) {
        val redirect = request.redirect.uri

        if (redirect.scheme.equals("https", ignoreCase = true)) {
          tab.launch(launcher, Uri.parse(request.url), redirect.host, redirect.rawPath.ifEmpty { "/" })
        } else {
          tab.launch(launcher, Uri.parse(request.url), redirect.scheme)
        }
      } else {
        val customTab = CustomTabsIntentFactory(this).create(request.options)
        customTab.intent.setPackage(request.provider)
        customTab.intent.data = Uri.parse(request.url)

        if (request.options?.ephemeralWebSession == true) {
          customTab.intent.putExtra(CustomTabsIntent.EXTRA_ENABLE_EPHEMERAL_BROWSING, true)
        }

        launcher.launch(customTab.intent)
      }
    } catch (error: RuntimeException) {
      AuthSessionManager.complete(sessionId, AuthSessionManager.dismiss("Unable to launch authentication: ${error.javaClass.simpleName}"))
      finish()
    }
  }

  fun closeBrowser() {
    if (isFinishing || isDestroyed) return

    startActivity(Intent(this, AuthTabActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      putExtra(SESSION_ID, sessionId)
    })
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)

    val closingSessionId = intent.getStringExtra(SESSION_ID) ?: return

    if (closingSessionId == sessionId) {
      finish()
    }
  }

  override fun onDestroy() {
    super.onDestroy()

    if (!isChangingConfigurations) {
      AuthSessionManager.cancelAfterReturn(sessionId)
    }
  }

  companion object {
    const val SESSION_ID = "com.inappbrowsernitro.AUTH_SESSION_ID"
  }
}
