package com.inappbrowsernitro.browser

import android.app.Activity
import android.content.Intent
import android.content.IntentFilter
import androidx.browser.customtabs.CustomTabsService
import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.content.pm.ServiceInfo
import android.net.Uri
import android.os.Looper
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.margelo.nitro.inappbrowsernitro.BrowserResultType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.runBlocking
import com.margelo.nitro.inappbrowsernitro.InAppBrowserAuthResult
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentMatchers.anyInt
import org.mockito.Mockito.doAnswer
import org.mockito.Mockito.doThrow
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class AuthSessionManagerTest {
  private val scope = CoroutineScope(Dispatchers.Unconfined)
  private lateinit var context: ReactApplicationContext
  private lateinit var host: Activity
  private lateinit var packages: PackageManager
  private lateinit var listener: BaseActivityEventListener

  @Before
  fun setUp() {
    context = mock(ReactApplicationContext::class.java)
    host = mock(Activity::class.java)
    packages = mock(PackageManager::class.java)
    val provider = ResolveInfo().apply {
      activityInfo = ActivityInfo().apply { packageName = "browser.test" }
      serviceInfo = ServiceInfo().apply { packageName = "browser.test" }
    }

    `when`(context.currentActivity).thenReturn(host)
    `when`(context.packageManager).thenReturn(packages)
    `when`(packages.resolveActivity(any(Intent::class.java), anyInt())).thenReturn(provider)
    `when`(packages.resolveService(any(Intent::class.java), anyInt())).thenReturn(provider)
    `when`(packages.queryIntentServices(any(Intent::class.java), anyInt())).thenReturn(emptyList())

    doAnswer {
      listener = it.getArgument(0)
      null
    }.`when`(context).addActivityEventListener(any())
  }

  @After
  fun tearDown() {
    scope.launch { AuthSessionManager.cancel() }
    shadowOf(Looper.getMainLooper()).idle()
  }

  private fun start() = scope.async {
    AuthSessionManager.start(context, "https://example.com/login", "myapp://callback/oauth", null)
  }.also { shadowOf(Looper.getMainLooper()).idle() }

  private fun callback(url: String) {
    listener.onNewIntent(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
  }

  private fun assertResult(result: Deferred<InAppBrowserAuthResult>, type: BrowserResultType) {
    shadowOf(Looper.getMainLooper()).idle()

    assertTrue("Authentication must settle", result.isCompleted)
    assertEquals(type, runBlocking { result.await() }.type)
  }

  @Test
  fun launchDoesNotAuthenticateAndOnlyMatchingRedirectCompletes() {
    val result = start()

    assertFalse(result.isCompleted)
    callback("myapp://callback.evil/oauth?code=wrong")
    assertFalse(result.isCompleted)
    callback("myapp://callback/oauth?code=valid&state=123")

    assertResult(result, BrowserResultType.SUCCESS)
    assertEquals("myapp://callback/oauth?code=valid&state=123", runBlocking { result.await() }.url)

    verify(context).removeActivityEventListener(listener)
    callback("myapp://callback/oauth?code=late")
  }

  @Test
  fun overlappingStartDoesNotReplaceTheActiveSessionAndCancelSettlesIt() {
    val first = start()
    val second = start()

    assertResult(second, BrowserResultType.DISMISS)
    assertFalse(first.isCompleted)

    scope.launch { AuthSessionManager.cancel() }
    shadowOf(Looper.getMainLooper()).idle()

    assertResult(first, BrowserResultType.CANCEL)
    callback("myapp://callback/oauth?code=late")
  }

  @Test
  fun callbackWinsWhenHostDeliveryFollowsProxyDestruction() {
    val result = start()
    val activity = mock(AuthTabActivity::class.java)
    val launched = org.mockito.ArgumentCaptor.forClass(Intent::class.java)
    verify(host).startActivity(launched.capture())
    val id = launched.value.getStringExtra(AuthTabActivity.SESSION_ID)

    AuthSessionManager.attach(id, activity)
    AuthSessionManager.cancelAfterReturn(id)
    callback("myapp://callback/oauth?code=valid")
    shadowOf(Looper.getMainLooper()).idle()

    assertResult(result, BrowserResultType.SUCCESS)
  }

  @Test
  fun authTabDoesNotAcceptAnUnverifiedHostIntent() {
    val provider = ResolveInfo().apply {
      serviceInfo = ServiceInfo().apply { packageName = "browser.test" }
      filter = IntentFilter().apply { addCategory(CustomTabsService.CATEGORY_AUTH_TAB) }
    }

    `when`(packages.queryIntentServices(any(Intent::class.java), anyInt())).thenReturn(listOf(provider))

    val result = start()
    callback("myapp://callback/oauth?code=forged")

    assertFalse(result.isCompleted)
  }

  @Test
  fun cleanupFailureStillSettlesTheSession() {
    val result = start()
    val activity = mock(AuthTabActivity::class.java)
    val launched = org.mockito.ArgumentCaptor.forClass(Intent::class.java)
    verify(host).startActivity(launched.capture())
    AuthSessionManager.attach(launched.value.getStringExtra(AuthTabActivity.SESSION_ID), activity)
    doThrow(SecurityException("blocked")).`when`(activity).closeBrowser()

    callback("myapp://callback/oauth?code=valid")

    assertResult(result, BrowserResultType.SUCCESS)
  }

  @Test
  fun staleCallbackCannotCompleteANewerSessionAtTheSameEndpoint() {
    val first = start()
    val staleListener = listener

    scope.launch { AuthSessionManager.cancel() }
    assertResult(first, BrowserResultType.CANCEL)

    val next = start()

    staleListener.onNewIntent(Intent(Intent.ACTION_VIEW, Uri.parse("myapp://callback/oauth?code=stale")))

    assertFalse(next.isCompleted)

    callback("myapp://callback/oauth?code=current")

    assertResult(next, BrowserResultType.SUCCESS)
    assertEquals("myapp://callback/oauth?code=current", runBlocking { next.await() }.url)
  }

  @Test
  fun launchFailureSettlesAndRemovesTheListener() {
    doThrow(SecurityException("blocked")).`when`(host).startActivity(any(Intent::class.java))

    val result = start()

    assertResult(result, BrowserResultType.DISMISS)
    verify(context).removeActivityEventListener(listener)
  }
}
