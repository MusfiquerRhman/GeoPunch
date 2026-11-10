package expo.modules.geopunchfacedetection

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.media.FaceDetector
import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class GeoPunchFaceDetectionModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("GeoPunchFaceDetection")

    AsyncFunction("hasFace") { uri: String ->
      val file = Uri.parse(uri)
      require(file.scheme == "file") { "Expected a local selfie file" }
      hasFace(requireNotNull(file.path))
    }
  }

  private fun hasFace(path: String): Boolean {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(path, bounds)
    require(bounds.outWidth >= 2 && bounds.outHeight >= 2) { "Could not read the selfie" }

    val options = BitmapFactory.Options().apply {
      inSampleSize = Integer.highestOneBit(maxOf(1, maxOf(bounds.outWidth, bounds.outHeight) / 800))
    }
    val decoded = requireNotNull(BitmapFactory.decodeFile(path, options)) { "Could not decode the selfie" }
    try {
      // The platform detector accepts RGB565 images with an even width.
      val image = Bitmap.createBitmap(decoded.width - decoded.width % 2, decoded.height, Bitmap.Config.RGB_565)
      try {
        Canvas(image).drawBitmap(decoded, 0f, 0f, null)
        val faces = arrayOfNulls<FaceDetector.Face>(1)
        FaceDetector(image.width, image.height, faces.size).findFaces(image, faces)
        return (faces[0]?.confidence() ?: 0f) >= FaceDetector.Face.CONFIDENCE_THRESHOLD
      } finally {
        image.recycle()
      }
    } finally {
      decoded.recycle()
    }
  }
}
