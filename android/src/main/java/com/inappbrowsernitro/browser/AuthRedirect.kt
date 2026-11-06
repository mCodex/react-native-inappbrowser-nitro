package com.inappbrowsernitro.browser

import java.net.URI

internal class AuthRedirect(redirectUrl: String) {
  val uri = URI(redirectUrl)

  init {
    require(!uri.isOpaque && uri.scheme != null) { "Redirect must be an absolute hierarchical URI" }
    require(uri.scheme.lowercase() !in setOf("http", "javascript", "data", "vbscript", "file", "intent")) {
      "Redirect must use HTTPS or an app-owned custom scheme"
    }
    require(uri.rawUserInfo == null && uri.rawQuery == null && uri.rawFragment == null) {
      "Redirect must not contain credentials, query parameters or fragments"
    }
    require(uri.host != null || !uri.rawPath.isNullOrEmpty()) { "Redirect must have a host or path" }
    require(!uri.scheme.equals("https", ignoreCase = true) || uri.host != null) {
      "HTTPS redirect must have a host"
    }
  }

  fun matches(callbackUrl: String): Boolean {
    val callback = runCatching { URI(callbackUrl) }.getOrNull() ?: return false

    return uri.scheme.equals(callback.scheme, ignoreCase = true) &&
      uri.host.equals(callback.host, ignoreCase = true) &&
      uri.port == callback.port &&
      path(uri) == path(callback) &&
      callback.rawUserInfo == null &&
      uri.rawAuthority.equals(callback.rawAuthority, ignoreCase = true)
  }

  private fun path(url: URI): String =
    if (url.scheme.equals("https", ignoreCase = true)) url.rawPath.ifEmpty { "/" } else url.rawPath
}
