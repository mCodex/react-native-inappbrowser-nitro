import UIKit

extension UIColor {
  static func from(dynamicColor: DynamicColor?) -> UIColor? {
    guard let dynamicColor else { return nil }

    let base = dynamicColor.base?.nitroColor
    let light = dynamicColor.light?.nitroColor
    let dark = dynamicColor.dark?.nitroColor
    let highContrast = dynamicColor.highContrast?.nitroColor

    if #available(iOS 13.0, *), (light != nil || dark != nil || highContrast != nil) {
      return UIColor { traits in
        if traits.accessibilityContrast == .high, let highContrast {
          return highContrast
        }
        switch traits.userInterfaceStyle {
        case .dark:
          return dark ?? base ?? light ?? UIColor.label
        default:
          return light ?? base ?? dark ?? UIColor.label
        }
      }
    }

    return base ?? light ?? dark ?? highContrast
  }
}

private extension String {
  var nitroColor: UIColor? {
    var sanitized = nitroTrimmedNonEmpty ?? ""
    if sanitized.hasPrefix("#") {
      sanitized.removeFirst()
    }

    if sanitized.count == 3 || sanitized.count == 4 {
      sanitized = sanitized.reduce(into: "") { partial, character in
        partial.append(character)
        partial.append(character)
      }
    }

    guard sanitized.count == 6 || sanitized.count == 8 else {
      return nil
    }

    var value: UInt64 = 0
    guard Scanner(string: sanitized).scanHexInt64(&value) else {
      return nil
    }

    let hasAlpha = sanitized.count == 8
    let alpha = hasAlpha ? CGFloat((value & 0xFF000000) >> 24) / 255.0 : 1.0
    let red = CGFloat((value & 0x00FF0000) >> 16) / 255.0
    let green = CGFloat((value & 0x0000FF00) >> 8) / 255.0
    let blue = CGFloat(value & 0x000000FF) / 255.0

    return UIColor(red: red, green: green, blue: blue, alpha: alpha)
  }
}
