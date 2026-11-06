package com.inappbrowsernitro.browser

import android.content.Intent
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class AuthTabActivityTest {
  @Test
  fun staleCloseIntentCannotFinishANewerSession() {
    val initial = Intent().putExtra(AuthTabActivity.SESSION_ID, "current-session")
    val controller = Robolectric.buildActivity(AuthTabActivity::class.java, initial)

    controller.newIntent(Intent().putExtra(AuthTabActivity.SESSION_ID, "old-session"))

    assertFalse(controller.get().isFinishing)
  }

  @Test
  fun matchingCloseIntentFinishesItsOwnSession() {
    val initial = Intent().putExtra(AuthTabActivity.SESSION_ID, "current-session")
    val controller = Robolectric.buildActivity(AuthTabActivity::class.java, initial)

    controller.newIntent(Intent().putExtra(AuthTabActivity.SESSION_ID, "current-session"))

    assertTrue(controller.get().isFinishing)
  }

  @Test
  fun closeIntentWithoutSessionOwnershipCannotFinishTheActivity() {
    val initial = Intent().putExtra(AuthTabActivity.SESSION_ID, "current-session")
    val controller = Robolectric.buildActivity(AuthTabActivity::class.java, initial)

    controller.newIntent(Intent())

    assertFalse(controller.get().isFinishing)
  }
}
