import UIKit

extension UIApplication {
  @MainActor
  var nitroTopMostViewController: UIViewController? {
    let windowScene = connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }

    guard let root = windowScene?.rootViewController else {
      return nil
    }

    var candidate: UIViewController? = root
    while let presented = candidate?.presentedViewController {
      candidate = presented
    }

    return candidate
  }
}
