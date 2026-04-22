import AuthenticationServices

final class AuthSessionManager: NSObject {
  private var session: ASWebAuthenticationSession?
  // `ASWebAuthenticationSession.presentationContextProvider` is a `weak` reference,
  // so we must retain the provider ourselves for the lifetime of the session.
  // Without this, the provider is deallocated immediately after assignment and
  // iOS can't present the auth UI (the session silently fails).
  private var presentationProvider: AuthPresentationContextProvider?

  @MainActor
  func start(urlString: String, redirectUrl: String, options: InAppBrowserOptions?) async -> InAppBrowserAuthResult {
    guard let url = URL(string: urlString) else {
      return InAppBrowserAuthResult(type: .dismiss, url: nil, message: "invalid url")
    }

    let callbackScheme = URL(string: redirectUrl)?.scheme ?? redirectUrl

    return await withCheckedContinuation { continuation in
      let provider = AuthPresentationContextProvider()
      let session = ASWebAuthenticationSession(url: url, callbackURLScheme: callbackScheme) { [weak self] callbackURL, error in
        let result = self?.mapAuthResult(callbackURL: callbackURL, error: error) ?? Self.genericFailure
        // Release retained refs once the session completes.
        self?.session = nil
        self?.presentationProvider = nil
        continuation.resume(returning: result)
      }

      session.presentationContextProvider = provider
      session.prefersEphemeralWebBrowserSession = options?.ephemeralWebSession ?? false

      // iOS Simulator does not fully emulate Secure Enclave behaviour; expect reduced isolation for ephemeral sessions.
      self.presentationProvider = provider
      self.session = session
      session.start()
    }
  }

  @MainActor
  func cancel() {
    session?.cancel()
    session = nil
    presentationProvider = nil
  }

  private func mapAuthResult(callbackURL: URL?, error: Error?) -> InAppBrowserAuthResult {
    if let error {
      if let authError = error as? ASWebAuthenticationSessionError, authError.code == .canceledLogin {
        return InAppBrowserAuthResult(type: .cancel, url: nil, message: nil)
      }
      return InAppBrowserAuthResult(type: .dismiss, url: nil, message: error.localizedDescription)
    }

    if let url = callbackURL?.absoluteString {
      return InAppBrowserAuthResult(type: .success, url: url, message: nil)
    }

    return Self.genericFailure
  }

  private static let genericFailure = InAppBrowserAuthResult(
    type: .dismiss, url: nil, message: "authentication failed"
  )
}

private final class AuthPresentationContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
  func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    UIApplication.shared.nitroTopMostViewController?.view.window ?? UIWindow()
  }
}
