import Foundation
import SafariServices

final class BrowserWarmupCoordinator {
  private var warmedHosts = Set<String>()
  private let queue = DispatchQueue(label: "com.inappbrowsernitro.warmup", attributes: .concurrent)

  @MainActor
  func prewarm(options: InAppBrowserOptions?) {
    guard #available(iOS 15.0, *), let host = warmupHost(from: options), let url = URL(string: host) else {
      return
    }

    SFSafariViewController.prewarmConnections(to: url)
  }

  private func warmupHost(from options: InAppBrowserOptions?) -> String? {
    guard let target = options?.headers?["warmup"]?.nitroTrimmedNonEmpty else {
      return nil
    }

    var shouldWarmup = false
    queue.sync(flags: .barrier) {
      shouldWarmup = warmedHosts.insert(target).inserted
    }

    return shouldWarmup ? target : nil
  }
}
