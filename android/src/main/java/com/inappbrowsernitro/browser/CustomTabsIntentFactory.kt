package com.inappbrowsernitro.browser

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.customtabs.CustomTabsIntent
import androidx.browser.customtabs.CustomTabsSession
import com.margelo.nitro.inappbrowsernitro.BrowserAnimations
import com.margelo.nitro.inappbrowsernitro.BrowserColorScheme
import com.margelo.nitro.inappbrowsernitro.BrowserShareState
import com.margelo.nitro.inappbrowsernitro.DynamicColor
import com.margelo.nitro.inappbrowsernitro.InAppBrowserOptions

internal class CustomTabsIntentFactory(
  private val context: Context,
  private val session: CustomTabsSession?
) {
  fun create(options: InAppBrowserOptions?): CustomTabsIntent {
    val builder = session?.let { CustomTabsIntent.Builder(it) } ?: CustomTabsIntent.Builder()

    applyColors(builder, options)
    applyBehaviours(builder, options)
    applyNavigation(builder, options)
    applyAnimations(builder, options?.animations)

    val intent = builder.build()

    configureIntent(intent.intent, options)

    options?.browserPackage?.takeIf { it.isNotBlank() }?.let(intent.intent::setPackage)

    return intent
  }

  private fun applyColors(builder: CustomTabsIntent.Builder, options: InAppBrowserOptions?) {
    val toolbarParams = buildColorParams(options?.toolbarColor)
    if (toolbarParams != null) {
      builder.setDefaultColorSchemeParams(toolbarParams.system)
      builder.setColorSchemeParams(CustomTabsIntent.COLOR_SCHEME_LIGHT, toolbarParams.light)
      builder.setColorSchemeParams(CustomTabsIntent.COLOR_SCHEME_DARK, toolbarParams.dark)
    }

    buildColorParams(options?.secondaryToolbarColor)?.systemColor?.let {
      builder.setSecondaryToolbarColor(it)
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      buildColorParams(options?.navigationBarColor)?.systemColor?.let { color ->
        builder.setNavigationBarColor(color)
      }
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      buildColorParams(options?.navigationBarDividerColor)?.systemColor?.let { color ->
        builder.setNavigationBarDividerColor(color)
      }
    }

    options?.colorScheme?.let { scheme ->
      builder.setColorScheme(scheme.toCustomTabsScheme())
    }
  }

  private fun applyBehaviours(builder: CustomTabsIntent.Builder, options: InAppBrowserOptions?) {
    builder.setShowTitle(options?.showTitle ?: true)

    options?.enableUrlBarHiding?.let(builder::setUrlBarHidingEnabled)

    when (options?.shareState) {
      BrowserShareState.ON -> builder.setShareState(CustomTabsIntent.SHARE_STATE_ON)
      BrowserShareState.OFF -> builder.setShareState(CustomTabsIntent.SHARE_STATE_OFF)
      BrowserShareState.DEFAULT, null -> if (options?.enableDefaultShare == false) {
        builder.setShareState(CustomTabsIntent.SHARE_STATE_OFF)
      }
    }

    options?.instantAppsEnabled?.let(builder::setInstantAppsEnabled)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && options?.enablePartialCustomTab == true) {
      val height = (context.resources.displayMetrics.heightPixels * PARTIAL_TAB_RATIO).toInt()
      builder.setInitialActivityHeightPx(height, CustomTabsIntent.ACTIVITY_HEIGHT_ADJUSTABLE)
    }

    // Emulators rely on soft navigation buttons; keeping pull-to-refresh disabled avoids accidental reloads.
    if (options?.enablePullToRefresh == true) {
      builder.setUrlBarHidingEnabled(true)
    }
  }

  private fun applyNavigation(builder: CustomTabsIntent.Builder, options: InAppBrowserOptions?) {
    if (options?.hasBackButton == true) {
      builder.setCloseButtonIcon(createBackArrow())
    }
  }

  private fun applyAnimations(builder: CustomTabsIntent.Builder, animations: BrowserAnimations?) {
    animations ?: return
    val startEnter = resolveAnimation(animations.startEnter)
    val startExit = resolveAnimation(animations.startExit)
    if (startEnter != null && startExit != null) {
      builder.setStartAnimations(context, startEnter, startExit)
    }

    val endEnter = resolveAnimation(animations.endEnter)
    val endExit = resolveAnimation(animations.endExit)
    if (endEnter != null && endExit != null) {
      builder.setExitAnimations(context, endEnter, endExit)
    }
  }

  private fun configureIntent(intent: Intent, options: InAppBrowserOptions?) {
    if (options?.showInRecents == false) {
      intent.addFlags(Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS)
    }

    if (options?.includeReferrer == true) {
      val referrer = Uri.parse("android-app://${context.packageName}")
      intent.putExtra(Intent.EXTRA_REFERRER, referrer)
    }

    options?.headers?.takeIf { it.isNotEmpty() }?.let { headers ->
      val bundle = Bundle()
      headers.forEach { (key, value) ->
        bundle.putString(key, value)
      }
      intent.putExtra(BROWSER_EXTRA_HEADERS, bundle)
    }
  }

  private fun buildColorParams(color: DynamicColor?): ColorSchemeParams? {
    val system = DynamicColorResolver.resolveForScheme(color, DynamicColorResolver.DynamicScheme.SYSTEM)
    val light = DynamicColorResolver.resolveForScheme(color, DynamicColorResolver.DynamicScheme.LIGHT)
    val dark = DynamicColorResolver.resolveForScheme(color, DynamicColorResolver.DynamicScheme.DARK)

    if (system == null && light == null && dark == null) {
      return null
    }

    return ColorSchemeParams(
      system = CustomTabColorSchemeParams.Builder().apply {
        system?.let { setToolbarColor(it) }
      }.build(),
      light = CustomTabColorSchemeParams.Builder().apply {
        light?.let { setToolbarColor(it) }
      }.build(),
      dark = CustomTabColorSchemeParams.Builder().apply {
        dark?.let { setToolbarColor(it) }
      }.build(),
      systemColor = system
    )
  }

  private fun resolveAnimation(name: String?): Int? {
    if (name.isNullOrBlank()) {
      return null
    }

    val identifier = context.resources.getIdentifier(name, "anim", context.packageName)
    return identifier.takeIf { it != 0 }
  }

  private fun createBackArrow(): Bitmap {
    val size = context.resources.displayMetrics.density * 24
    val bitmap = Bitmap.createBitmap(size.toInt(), size.toInt(), Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)

    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = DEFAULT_CLOSE_BUTTON_COLOR
      style = Paint.Style.STROKE
      strokeWidth = context.resources.displayMetrics.density * 2
      strokeCap = Paint.Cap.ROUND
      strokeJoin = Paint.Join.ROUND
    }

    val path = Path().apply {
      moveTo(size * 0.75f, size * 0.2f)
      lineTo(size * 0.35f, size * 0.5f)
      lineTo(size * 0.75f, size * 0.8f)
    }

    canvas.drawPath(path, paint)
    return bitmap
  }

  private data class ColorSchemeParams(
    val system: CustomTabColorSchemeParams,
    val light: CustomTabColorSchemeParams,
    val dark: CustomTabColorSchemeParams,
    val systemColor: Int?,
  )

  private fun BrowserColorScheme.toCustomTabsScheme(): Int {
    return when (this) {
      BrowserColorScheme.LIGHT -> CustomTabsIntent.COLOR_SCHEME_LIGHT
      BrowserColorScheme.DARK -> CustomTabsIntent.COLOR_SCHEME_DARK
      BrowserColorScheme.SYSTEM -> CustomTabsIntent.COLOR_SCHEME_SYSTEM
    }
  }

  private companion object {
    private const val PARTIAL_TAB_RATIO = 0.85f
    private const val BROWSER_EXTRA_HEADERS = "android.support.customtabs.extra.EXTRA_HEADERS"
    private val DEFAULT_CLOSE_BUTTON_COLOR = Color.argb(0xFF, 0x3A, 0x3A, 0x3A)
  }
}
