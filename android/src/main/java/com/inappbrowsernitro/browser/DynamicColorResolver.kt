package com.inappbrowsernitro.browser

import android.graphics.Color
import com.margelo.nitro.inappbrowsernitro.DynamicColor

internal object DynamicColorResolver {
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
