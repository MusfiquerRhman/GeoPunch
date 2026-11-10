Pod::Spec.new do |s|
  s.name = 'GeoPunchFaceDetection'
  s.version = '1.0.0'
  s.summary = 'On-device face detection for GeoPunch selfies'
  s.author = 'GeoPunch'
  s.license = { :type => 'UNLICENSED' }
  s.homepage = 'https://expo.dev'
  s.source = { :git => '' }
  s.platforms = { :ios => '15.1' }
  s.source_files = '**/*.swift'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
end
