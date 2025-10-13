import AuthenticationServices
import SafariServices

final class AuthSessionManager: NSObject {
  private var session: AuthenticationSession?

  @MainActor
  func start(urlString: String, redirectUrl: String, options: InAppBrowserOptions?) async -> InAppBrowserAuthResult {
    guard let url = URL(string: urlString) else {
      return InAppBrowserAuthResult(type: .dismiss, url: nil, message: "invalid url")
    }

    let callbackScheme = URL(string: redirectUrl)?.scheme ?? redirectUrl

    return await withCheckedContinuation { continuation in
      if #available(iOS 12.0, *) {
        let session = ASWebAuthenticationSession(url: url, callbackURLScheme: callbackScheme) { [weak self] callbackURL, error in
          continuation.resume(returning: self?.mapAuthResult(callbackURL: callbackURL, error: error) ?? Self.genericFailure)
        }

        if #available(iOS 13.0, *) {
          session.presentationContextProvider = AuthPresentationContextProvider()
          session.prefersEphemeralWebBrowserSession = options?.ephemeralWebSession ?? false
        }

        // iOS Simulator does not fully emulate Secure Enclave behaviour; expect reduced isolation for ephemeral sessions.
        self.session = .asWeb(session)
        session.start()
      } else {
        let session = SFAuthenticationSession(url: url, callbackURLScheme: callbackScheme) { [weak self] callbackURL, error in
          continuation.resume(returning: self?.mapAuthResult(callbackURL: callbackURL, error: error) ?? Self.genericFailure)
        }
        self.session = .sf(session)
        session.start()
      }
    }
  }

  @MainActor
  func cancel() {
    switch session {
    case .asWeb(let session):
      session.cancel()
    case .sf(let session):
      session.cancel()
    case .none:
      break
    }
    session = nil
  }

  private func mapAuthResult(callbackURL: URL?, error: Error?) -> InAppBrowserAuthResult {
    if let error {
      if #available(iOS 12.0, *), let authError = error as? ASWebAuthenticationSessionError, authError.code == .canceledLogin {
        return InAppBrowserAuthResult(type: .cancel, url: nil, message: nil)
      }
      if #available(iOS 11.0, *), let authError = error as? SFAuthenticationError, authError.code == .canceledLogin {
        return InAppBrowserAuthResult(type: .cancel, url: nil, message: nil)
      }
      return InAppBrowserAuthResult(type: .dismiss, url: nil, message: error.localizedDescription)
    }

    if let url = callbackURL?.absoluteString {
      return InAppBrowserAuthResult(type: .success, url: url, message: nil)
    }

    return Self.genericFailure
  }

  private static let genericFailure = InAppBrowserAuthResult(type: .dismiss, url: nil, message: "authentication failed")
}

@available(iOS 13.0, *)
private final class AuthPresentationContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
  func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    UIApplication.shared.nitroTopMostViewController?.view.window ?? UIWindow()
  }
}

private enum AuthenticationSession {
  case asWeb(ASWebAuthenticationSession)
  case sf(SFAuthenticationSession)
}
