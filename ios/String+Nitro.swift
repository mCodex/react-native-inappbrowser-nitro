import Foundation

extension String {
  var nitroTrimmedNonEmpty: String? {
    let result = trimmingCharacters(in: .whitespacesAndNewlines)
    return result.isEmpty ? nil : result
  }
}
