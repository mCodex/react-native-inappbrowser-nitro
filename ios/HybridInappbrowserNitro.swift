import NitroModules

final class HybridInappbrowserNitro: HybridInappbrowserNitroSpec {
  private let safariPresenter = SafariPresenter()
  private let authManager = AuthSessionManager()

  func isAvailable() throws -> Promise<Bool> {
    Promise.resolved(withResult: true)
  }

  func open(url: String, options: InAppBrowserOptions?) throws -> Promise<InAppBrowserResult> {
    Promise.async { [weak self] in
      guard let self else {
        return InAppBrowserResult(type: .dismiss, url: nil, message: "module released")
      }

      return await self.safariPresenter.present(urlString: url, options: options)
    }
  }

  func openAuth(url: String, redirectUrl: String, options: InAppBrowserOptions?) throws -> Promise<InAppBrowserAuthResult> {
    Promise.async { [weak self] in
      guard let self else {
        return InAppBrowserAuthResult(type: .dismiss, url: nil, message: "module released")
      }

      return await self.authManager.start(urlString: url, redirectUrl: redirectUrl, options: options)
    }
  }

  func close() throws -> Promise<Void> {
    Promise.async { [weak self] in
      guard let self else { return }

      await self.safariPresenter.dismiss()
    }
  }

  func closeAuth() throws -> Promise<Void> {
    Promise.async { [weak self] in
      guard let self else { return }

      await self.authManager.cancel()
    }
  }

}
