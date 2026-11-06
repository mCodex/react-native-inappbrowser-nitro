package com.inappbrowsernitro.browser

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AuthRedirectTest {
  @Test
  fun acceptsOnlyTheConfiguredEndpoint() {
    val redirect = AuthRedirect("myapp://callback/oauth")

    assertTrue(redirect.matches("myapp://callback/oauth?code=abc&state=xyz#result"))
    assertFalse(redirect.matches("myapp://callback.evil/oauth?code=abc"))
    assertFalse(redirect.matches("myapp://callback/oauth/extra"))
    assertFalse(redirect.matches("other://callback/oauth"))
    assertFalse(redirect.matches("myapp://callback:123/oauth"))
    assertFalse(redirect.matches("myapp://user@callback/oauth"))
    assertFalse(redirect.matches("myapp://callback/%6fauth"))
    assertFalse(redirect.matches("not a URI"))
  }

  @Test
  fun supportsHttpsAndHostlessCustomSchemes() {
    assertTrue(AuthRedirect("https://example.com/oauth").matches("https://example.com/oauth?code=abc"))
    assertTrue(AuthRedirect("https://example.com").matches("https://example.com/?code=abc"))
    assertTrue(AuthRedirect("myapp:/oauth").matches("myapp:/oauth?code=abc"))
  }

  @Test(expected = IllegalArgumentException::class)
  fun rejectsUnsafeSchemes() {
    AuthRedirect("http://example.com/oauth")
  }

  @Test(expected = IllegalArgumentException::class)
  fun rejectsCallbackConfigurationWithQueryParameters() {
    AuthRedirect("myapp://callback?code=fixed")
  }
}
