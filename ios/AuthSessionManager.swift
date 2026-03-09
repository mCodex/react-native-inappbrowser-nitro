import AuthenticationServices

final class AuthSessionManager: NSObject {
  private var session: ASWebAuthenticationSession?

  @MainActor
  func start(urlString: String, redirectUrl: String, options: InAppBrowserOptions?) async -> InAppBrowserAuthResult {
    guard let url = URL(string: urlString) else {
      return InAppBrowserAuthResult(type: .dismiss, url: nil, message: "invalid url")
    }

    let callbackScheme = URL(string: redirectUrl)?.scheme ?? redirectUrl

    return await withCheckedContinuation { continuation in
      let session = ASWebAuthenticationSession(url: url, callbackURLScheme: callbackScheme) { [weak self] callbackURL, error in
        continuation.resume(returning: self?.mapAuthResult(callbackURL: callbackURL, error: error) ?? Self.genericFailure)
      }

      session.presentationContextProvider = AuthPresentationContextProvider()
      session.prefersEphemeralWebBrowserSession = options?.ephemeralWebSession ?? false

      // iOS Simulator does not fully emulate Secure Enclave behaviour; expect reduced isolation for ephemeral sessions.
      self.session = session
      session.start()
    }
  }

  @MainActor
  func cancel() {
    session?.cancel()
    session = nil
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
