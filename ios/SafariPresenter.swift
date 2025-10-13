import SafariServices
import UIKit

final class SafariPresenter: NSObject {
  private var controller: NitroSafariViewController?
  private var delegate: SafariDismissDelegate?

  @MainActor
  func present(urlString: String, options: InAppBrowserOptions?) -> InAppBrowserResult {
    guard let url = URL(string: urlString) else {
      return InAppBrowserResult(type: .dismiss, url: nil, message: "invalid url")
    }

    let configuration = SFSafariViewController.Configuration()
    configuration.entersReaderIfAvailable = options?.readerMode ?? false
    configuration.barCollapsingEnabled = options?.enableBarCollapsing ?? false

    let controller = NitroSafariViewController(
      url: url,
      configuration: configuration,
      statusBarStyle: SafariStyleMapper.statusBarStyle(from: options?.preferredStatusBarStyle),
      userInterfaceStyle: SafariStyleMapper.interfaceStyle(from: options?.overrideUserInterfaceStyle)
    )

    apply(options: options, to: controller)

    let delegate = SafariDismissDelegate { [weak self] in
      self?.controller = nil
      self?.delegate = nil
    }

    controller.delegate = delegate
    controller.isModalInPresentation = !(options?.enableEdgeDismiss ?? true)

    guard let presenter = UIApplication.shared.nitroTopMostViewController else {
      return InAppBrowserResult(type: .dismiss, url: nil, message: "missing presenter")
    }

    self.controller = controller
    self.delegate = delegate

    let animated = options?.animated ?? true

    if options?.modalEnabled == false,
       let navigation = (presenter as? UINavigationController) ?? presenter.navigationController {
      navigation.pushViewController(controller, animated: animated)
    } else {
      presenter.present(controller, animated: animated)
    }

    return InAppBrowserResult(type: .success, url: url.absoluteString, message: nil)
  }

  @MainActor
  func dismiss() async {
    guard let controller else { return }

    if let navigation = controller.navigationController,
       navigation.viewControllers.contains(where: { $0 === controller }) {
      if navigation.topViewController === controller {
        navigation.popViewController(animated: true)
      } else {
        navigation.viewControllers.removeAll { $0 === controller }
      }
    } else if controller.presentingViewController != nil {
      await withCheckedContinuation { continuation in
        controller.dismiss(animated: true) {
          continuation.resume(returning: ())
        }
      }
    }

    self.controller = nil
    self.delegate = nil
  }

  @MainActor
  func warmup(options: InAppBrowserOptions?) {
    // No-op here; handled by BrowserWarmupCoordinator to avoid multiple presenters racing.
  }

  private func apply(options: InAppBrowserOptions?, to controller: SFSafariViewController) {
    if let barColor = UIColor.from(dynamicColor: options?.preferredBarTintColor) {
      controller.preferredBarTintColor = barColor
    }

    if let controlColor = UIColor.from(dynamicColor: options?.preferredControlTintColor) {
      controller.preferredControlTintColor = controlColor
    }

    if let dismissStyle = options?.dismissButtonStyle {
      controller.dismissButtonStyle = SafariStyleMapper.dismissButtonStyle(from: dismissStyle)
    }

    if let formSize = options?.formSheetPreferredContentSize {
      controller.preferredContentSize = CGSize(width: CGFloat(formSize.width), height: CGFloat(formSize.height))
    }

    if let presentation = options?.modalPresentationStyle {
      controller.modalPresentationStyle = SafariStyleMapper.presentationStyle(from: presentation)
    }

    if let transition = options?.modalTransitionStyle {
      controller.modalTransitionStyle = SafariStyleMapper.transitionStyle(from: transition)
      if transition == .partialcurl {
        controller.modalPresentationStyle = .fullScreen
      }
    }
  }
}

private final class NitroSafariViewController: SFSafariViewController {
  private let resolvedStatusBarStyle: UIStatusBarStyle?

  init(url: URL, configuration: SFSafariViewController.Configuration, statusBarStyle: UIStatusBarStyle?, userInterfaceStyle: UIUserInterfaceStyle?) {
    resolvedStatusBarStyle = statusBarStyle
    super.init(url: url, configuration: configuration)

    if let userInterfaceStyle, #available(iOS 13.0, *) {
      overrideUserInterfaceStyle = userInterfaceStyle
    }
  }

  override var preferredStatusBarStyle: UIStatusBarStyle {
    resolvedStatusBarStyle ?? super.preferredStatusBarStyle
  }
}

private final class SafariDismissDelegate: NSObject, SFSafariViewControllerDelegate {
  private let onDismiss: () -> Void

  init(onDismiss: @escaping () -> Void) {
    self.onDismiss = onDismiss
  }

  func safariViewControllerDidFinish(_ controller: SFSafariViewController) {
    // iOS Simulator (and hardware without biometric setup) dismisses immediately for some auth flows.
    onDismiss()
  }
}

private enum SafariStyleMapper {
  static func dismissButtonStyle(from style: DismissButtonStyle) -> SFSafariViewController.DismissButtonStyle {
    switch style {
    case .cancel:
      return .cancel
    case .done:
      return .done
    case .close:
      return .close
    @unknown default:
      return .done
    }
  }

  static func presentationStyle(from style: ModalPresentationStyle) -> UIModalPresentationStyle {
    switch style {
    case .automatic:
      if #available(iOS 13.0, *) {
        return .automatic
      }
      return .fullScreen
    case .none:
      return .none
    case .fullscreen:
      return .fullScreen
    case .pagesheet:
      if #available(iOS 13.0, *) {
        return .pageSheet
      }
      return .formSheet
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
    @unknown default:
      return .automatic
    }
  }

  static func transitionStyle(from style: ModalTransitionStyle) -> UIModalTransitionStyle {
    switch style {
    case .coververtical:
      return .coverVertical
    case .fliphorizontal:
      return .flipHorizontal
    case .crossdissolve:
      return .crossDissolve
    case .partialcurl:
      return .partialCurl
    @unknown default:
      return .coverVertical
    }
  }

  static func statusBarStyle(from style: StatusBarStyle?) -> UIStatusBarStyle? {
    guard let style else { return nil }
    switch style {
    case .default:
      return .default
    case .lightcontent:
      return .lightContent
    case .darkcontent:
      if #available(iOS 13.0, *) {
        return .darkContent
      }
      return .default
    @unknown default:
      return nil
    }
  }

  static func interfaceStyle(from style: UserInterfaceStyle?) -> UIUserInterfaceStyle? {
    guard let style, #available(iOS 13.0, *) else { return nil }
    switch style {
    case .unspecified:
      return .unspecified
    case .light:
      return .light
    case .dark:
      return .dark
    @unknown default:
      return nil
    }
  }
}
