import NitroModules

final class HybridInappbrowserNitro: NSObject, HybridInappbrowserNitroSpec {
  private let safariPresenter = SafariPresenter()
  private let authManager = AuthSessionManager()
  private let warmupCoordinator = BrowserWarmupCoordinator()

  func isAvailable() throws -> Promise<Bool> {
    Promise.resolved(withResult: true)
  }

  func open(url: String, options: InAppBrowserOptions?) throws -> Promise<InAppBrowserResult> {
    Promise.async { [weak self] in
      guard let self else {
        return InAppBrowserResult(type: .dismiss, url: nil, message: "module released")
      }

      return await MainActor.run {
        self.safariPresenter.present(urlString: url, options: options)
      }
    }
  }

  func openAuth(url: String, redirectUrl: String, options: InAppBrowserOptions?) throws -> Promise<InAppBrowserAuthResult> {
    Promise.async { [weak self] in
      guard let self else {
        return InAppBrowserAuthResult(type: .dismiss, url: nil, message: "module released")
      }

      return await MainActor.run {
        self.authManager.start(urlString: url, redirectUrl: redirectUrl, options: options)
      }
    }
  }

  func close() throws -> Promise<Void> {
    Promise.async { [weak self] in
      guard let self else { return }

      await MainActor.run {
        await self.safariPresenter.dismiss()
      }
    }
  }

  func closeAuth() throws -> Promise<Void> {
    Promise.async { [weak self] in
      guard let self else { return }

      await MainActor.run {
        self.authManager.cancel()
      }
    }
  }

  func warmup(options: InAppBrowserOptions?) throws -> Promise<Void> {
    Promise.async { [weak self] in
      guard let self else { return }

      await MainActor.run {
        self.warmupCoordinator.prewarm(options: options)
      }
    }
  }
