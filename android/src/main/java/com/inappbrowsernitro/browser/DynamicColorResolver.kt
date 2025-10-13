package com.inappbrowsernitro.browser

import android.content.Context
import android.graphics.Color
import android.view.accessibility.AccessibilityManager
import androidx.core.content.getSystemService
import com.margelo.nitro.inappbrowsernitro.DynamicColor

internal object DynamicColorResolver {
  fun resolve(context: Context, dynamicColor: DynamicColor?): Int? {
    dynamicColor ?: return null

    val accessibilityManager = context.getSystemService<AccessibilityManager>()
    val isHighContrast = accessibilityManager?.let { manager ->
      runCatching {
        val method = AccessibilityManager::class.java.getMethod("isHighTextContrastEnabled")
        (method.invoke(manager) as? Boolean) == true
      }.getOrDefault(false)
    } == true

    val isDark = (context.resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES

    val candidate = when {
      isHighContrast && dynamicColor.highContrast != null -> dynamicColor.highContrast
      isDark && dynamicColor.dark != null -> dynamicColor.dark
      !isDark && dynamicColor.light != null -> dynamicColor.light
      dynamicColor.base != null -> dynamicColor.base
      else -> dynamicColor.dark ?: dynamicColor.light ?: dynamicColor.highContrast
    }

    return candidate?.let(::parseColorSafely)
  }

  fun resolveForScheme(dynamicColor: DynamicColor?, preferred: DynamicScheme): Int? {
    dynamicColor ?: return null
    val hex = when (preferred) {
      DynamicScheme.SYSTEM -> dynamicColor.base ?: dynamicColor.light ?: dynamicColor.dark ?: dynamicColor.highContrast
      DynamicScheme.LIGHT -> dynamicColor.light ?: dynamicColor.base
      DynamicScheme.DARK -> dynamicColor.dark ?: dynamicColor.base
    }
    return hex?.let(::parseColorSafely)
  }

  private fun parseColorSafely(value: String): Int? {
    return try {
      Color.parseColor(value.trim())
    } catch (_: IllegalArgumentException) {
      null
    }
  }

  enum class DynamicScheme { SYSTEM, LIGHT, DARK }
}
