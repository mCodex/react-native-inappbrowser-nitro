import SafariServices
import AuthenticationServices
import UIKit
import NitroModules

@available(iOS 11.0, *)
public class InAppBrowserNitroImpl: HybridInAppBrowserNitroSpec {
    private var safariViewController: SFSafariViewController?
    private var authSession: Any? // ASWebAuthenticationSession or SFAuthenticationSession
    
    public func isAvailable() throws -> Promise<Bool> {
        return Promise.resolved(withResult: true)
    }
    
    public func open(url: String, options: InAppBrowserOptions?) throws -> Promise<InAppBrowserResult> {
        return Promise.async {
            return await self.openInAppBrowser(url: url, options: options)
        }
    }
    
    public func openAuth(url: String, redirectUrl: String, options: InAppBrowserOptions?) throws -> Promise<InAppBrowserAuthResult> {
        return Promise.async {
            return await self.openAuthSession(url: url, redirectUrl: redirectUrl, options: options)
        }
    }
    
    public func close() throws -> Promise<Void> {
        return Promise.async {
            await self.closeBrowser()
        }
    }
    
    public func closeAuth() throws -> Promise<Void> {
        return Promise.async {
            await MainActor.run {
                self.closeAuthenticationSession()
            }
        }
    }
    
    // MARK: - Private Methods
    
    @MainActor
    private func openInAppBrowser(url: String, options: InAppBrowserOptions?) async -> InAppBrowserResult {
        guard let urlObj = URL(string: url) else {
            return InAppBrowserResult(type: .dismiss, url: nil, message: "Invalid URL")
        }
        
        let config = SFSafariViewController.Configuration()
        if let ephemeralWebSession = options?.ephemeralWebSession {
            config.entersReaderIfAvailable = ephemeralWebSession
        }
        
        if let readerMode = options?.readerMode {
            config.entersReaderIfAvailable = readerMode
        }
        
        safariViewController = SFSafariViewController(url: urlObj, configuration: config)
        
        // Apply iOS-specific styling options
        if let preferredBarTintColor = options?.preferredBarTintColor {
            safariViewController?.preferredBarTintColor = UIColor(hexString: preferredBarTintColor)
        }
        
        if let preferredControlTintColor = options?.preferredControlTintColor {
            safariViewController?.preferredControlTintColor = UIColor(hexString: preferredControlTintColor)
        }
        
        if let dismissButtonStyle = options?.dismissButtonStyle {
            switch dismissButtonStyle {
            case .done:
                safariViewController?.dismissButtonStyle = .done
            case .close:
                safariViewController?.dismissButtonStyle = .close
            case .cancel:
                safariViewController?.dismissButtonStyle = .cancel
            }
        }
        
        // Handle presentation and transition styles, ensuring partialCurl uses fullScreen
        if let transitionStyle = options?.modalTransitionStyle, transitionStyle == .partialcurl {
            safariViewController?.modalPresentationStyle = .fullScreen
        } else if let presentationStyle = options?.modalPresentationStyle {
            safariViewController?.modalPresentationStyle = getPresentationStyle(from: presentationStyle)
        }
        if let transitionStyle = options?.modalTransitionStyle {
            safariViewController?.modalTransitionStyle = getTransitionStyle(from: transitionStyle)
        }
        
        guard let presentingViewController = getRootViewController() else {
            return InAppBrowserResult(type: .dismiss, url: nil, message: "No presenting view controller found")
        }
        
        // Present the in-app browser and return immediately
        let animated = options?.animated ?? true

        presentingViewController.present(safariViewController!, animated: animated, completion: nil)
        
        // Immediately resolve as success; dismissal events can be handled via close()
        return InAppBrowserResult(type: .success, url: nil, message: nil)
    }
    
    @MainActor
    private func openAuthSession(url: String, redirectUrl: String, options: InAppBrowserOptions?) async -> InAppBrowserAuthResult {
        guard let urlObj = URL(string: url) else {
            return InAppBrowserAuthResult(type: .dismiss, url: nil, message: "Invalid URL")
        }
        
        return await withCheckedContinuation { continuation in
            if #available(iOS 12.0, *) {
                let session = ASWebAuthenticationSession(url: urlObj, callbackURLScheme: redirectUrl) { callbackURL, error in
                    if let error = error {
                        if let authError = error as? ASWebAuthenticationSessionError,
                           authError.code == ASWebAuthenticationSessionError.canceledLogin {
                            continuation.resume(returning: InAppBrowserAuthResult(type: .cancel, url: nil, message: nil))
                        } else {
                            continuation.resume(returning: InAppBrowserAuthResult(type: .dismiss, url: nil, message: error.localizedDescription))
                        }
                    } else if let callbackURL = callbackURL {
                        continuation.resume(returning: InAppBrowserAuthResult(type: .success, url: callbackURL.absoluteString, message: nil))
                    } else {
                        continuation.resume(returning: InAppBrowserAuthResult(type: .dismiss, url: nil, message: nil))
                    }
                }
                
                if #available(iOS 13.0, *) {
                    session.presentationContextProvider = AuthPresentationContextProvider()
                    if let ephemeralWebSession = options?.ephemeralWebSession {
                        session.prefersEphemeralWebBrowserSession = ephemeralWebSession
                    }
                }
                
                authSession = session
                session.start()
            } else {
                // Fallback for iOS 11
                let session = SFAuthenticationSession(url: urlObj, callbackURLScheme: redirectUrl) { callbackURL, error in
                    if let error = error {
                        if let authError = error as? SFAuthenticationError,
                           authError.code == SFAuthenticationError.canceledLogin {
                            continuation.resume(returning: InAppBrowserAuthResult(type: .cancel, url: nil, message: nil))
                        } else {
                            continuation.resume(returning: InAppBrowserAuthResult(type: .dismiss, url: nil, message: error.localizedDescription))
                        }
                    } else if let callbackURL = callbackURL {
                        continuation.resume(returning: InAppBrowserAuthResult(type: .success, url: callbackURL.absoluteString, message: nil))
                    } else {
                        continuation.resume(returning: InAppBrowserAuthResult(type: .dismiss, url: nil, message: nil))
                    }
                }
                
                authSession = session
                session.start()
            }
        }
    }
    
    @MainActor
    private func closeBrowser() async {
        await withCheckedContinuation { continuation in
            safariViewController?.dismiss(animated: true) {
                continuation.resume()
            }
            safariViewController = nil
        }
    }
    
    @MainActor
    private func closeAuthenticationSession() {
        if #available(iOS 12.0, *), let session = authSession as? ASWebAuthenticationSession {
            session.cancel()
        } else if #available(iOS 11.0, *), let session = authSession as? SFAuthenticationSession {
            session.cancel()
        }
        authSession = nil
    }
    
    private func getRootViewController() -> UIViewController? {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first else {
            return nil
        }
        
        var rootViewController = window.rootViewController
        while let presentedViewController = rootViewController?.presentedViewController {
            rootViewController = presentedViewController
        }
        
        return rootViewController
    }
    
    private func getPresentationStyle(from style: ModalPresentationStyle) -> UIModalPresentationStyle {
        switch style {
        case .automatic:
            if #available(iOS 13.0, *) {
                return .automatic
            } else {
                return .fullScreen
            }
        case .none:
            return .none
        case .fullscreen:
            return .fullScreen
        case .pagesheet:
            if #available(iOS 13.0, *) {
                return .pageSheet
            } else {
                return .formSheet
            }
        case .formsheet:
            return .formSheet
        case .currentcontext:
            return .currentContext
        case .custom:
            return .custom
        case .overfullscreen:
            return .overFullScreen
        case .overcurrentcontext:
            return .overCurrentContext
        case .popover:
            return .popover
        }
    }
    
    private func getTransitionStyle(from style: ModalTransitionStyle) -> UIModalTransitionStyle {
        switch style {
        case .coververtical:
            return .coverVertical
        case .fliphorizontal:
            return .flipHorizontal
        case .crossdissolve:
            return .crossDissolve
        case .partialcurl:
            return .partialCurl
        }
    }
}

// MARK: - Helper Classes

class SafariViewControllerDelegate: NSObject, SFSafariViewControllerDelegate {
    private let completion: (InAppBrowserResult) -> Void
    
    init(completion: @escaping (InAppBrowserResult) -> Void) {
        self.completion = completion
    }
    
    func safariViewControllerDidFinish(_ controller: SFSafariViewController) {
        completion(InAppBrowserResult(type: .cancel, url: nil, message: nil))
    }
    
    func safariViewController(_ controller: SFSafariViewController, didCompleteInitialLoad didLoadSuccessfully: Bool) {
        if !didLoadSuccessfully {
            completion(InAppBrowserResult(type: .dismiss, url: nil, message: "Failed to load"))
        }
    }
}

@available(iOS 13.0, *)
class AuthPresentationContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first else {
            return UIWindow()
        }
        return window
    }
}

// MARK: - Extensions

extension UIColor {
    convenience init?(hexString: String) {
        let r, g, b, a: CGFloat
        
        var hexSanitized = hexString.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")
        
        var hexValue: UInt64 = 0
        
        guard Scanner(string: hexSanitized).scanHexInt64(&hexValue) else {
            return nil
        }
        
        switch hexSanitized.count {
        case 6:
            (a, r, g, b) = (1.0, CGFloat((hexValue & 0xFF0000) >> 16) / 255.0, CGFloat((hexValue & 0x00FF00) >> 8) / 255.0, CGFloat(hexValue & 0x0000FF) / 255.0)
        case 8:
            (a, r, g, b) = (CGFloat((hexValue & 0xFF000000) >> 24) / 255.0, CGFloat((hexValue & 0x00FF0000) >> 16) / 255.0, CGFloat((hexValue & 0x0000FF00) >> 8) / 255.0, CGFloat(hexValue & 0x000000FF) / 255.0)
        default:
            return nil
        }
        
        self.init(red: r, green: g, blue: b, alpha: a)
    }
}
