import ExpoModulesCore
import Foundation
import ImageIO
import Vision

public class GeoPunchFaceDetectionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("GeoPunchFaceDetection")

    AsyncFunction("hasFace") { (uri: URL) -> Bool in
      guard uri.isFileURL,
        let source = CGImageSourceCreateWithURL(uri as CFURL, nil)
      else {
        throw Exception(name: "InvalidSelfie", description: "Could not read the selfie")
      }

      let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [String: Any]
      let orientation = (properties?[kCGImagePropertyOrientation as String] as? UInt32)
        .flatMap(CGImagePropertyOrientation.init(rawValue:)) ?? .up
      let request = VNDetectFaceRectanglesRequest()
      try VNImageRequestHandler(url: uri, orientation: orientation, options: [:]).perform([request])
      return request.results?.isEmpty == false
    }
  }
}
