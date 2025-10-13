package com.inappbrowsernitro.browser

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsServiceConnection
import androidx.browser.customtabs.CustomTabsSession
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

internal class CustomTabsConnection(private val context: Context) {
  private var client: CustomTabsClient? = null
  private var session: CustomTabsSession? = null
  private var connection: CustomTabsServiceConnection? = null

  suspend fun ensureSession(packageName: String?): CustomTabsSession? {
    session?.let { return it }

    val targetPackage = CustomTabsPackageHelper.resolvePackage(context, packageName) ?: return null

    return suspendCancellableCoroutine { continuation ->
      if (connection != null) {
        continuation.resume(session)
        return@suspendCancellableCoroutine
      }

      val serviceConnection = object : CustomTabsServiceConnection() {
        override fun onCustomTabsServiceConnected(name: ComponentName, customTabsClient: CustomTabsClient) {
          client = customTabsClient
          client?.warmup(0L)
          session = client?.newSession(null)
          continuation.resume(session)
        }

        override fun onServiceDisconnected(name: ComponentName) {
          client = null
          session = null
        }
      }

      connection = serviceConnection

      val bound = CustomTabsClient.bindCustomTabsService(context, targetPackage, serviceConnection)
      if (!bound) {
        connection = null
        continuation.resume(null)
      }

      continuation.invokeOnCancellation {
        cleanup()
      }
    }
  }

  fun warmup(packageName: String?) {
    val targetPackage = CustomTabsPackageHelper.resolvePackage(context, packageName) ?: return

    if (client != null) {
      client?.warmup(0L)
      return
    }

    val intent = Intent().apply {
      setPackage(targetPackage)
    }

    context.bindService(intent, object : CustomTabsServiceConnection() {
      override fun onCustomTabsServiceConnected(name: ComponentName, customTabsClient: CustomTabsClient) {
        client = customTabsClient
        client?.warmup(0L)
        context.unbindService(this)
      }

      override fun onServiceDisconnected(name: ComponentName) {
        client = null
      }
    }, Context.BIND_AUTO_CREATE)
  }

  fun cleanup() {
    connection?.let { context.unbindService(it) }
    connection = null
    client = null
    session = null
  }
}
