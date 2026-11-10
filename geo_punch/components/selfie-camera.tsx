import { Ionicons } from "@expo/vector-icons";
import { requireOptionalNativeModule } from "expo";
import { CameraView, type CameraType } from "expo-camera";
import { File } from "expo-file-system";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text,
  View, useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

type Props = {
  onClose: () => void;
  onUsePhoto: (uri: string) => void;
};

const faceDetector = requireOptionalNativeModule<{ hasFace(uri: string): Promise<boolean> }>("GeoPunchFaceDetection");
const background = "#0d1523";
const panel = "#202d3f";
const foreground = "#f5f8fc";
const muted = "#a8b6c9";
const formatTime = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit", minute: "2-digit", hour12: true,
});

function discardCapture(uri: string | null) {
  if (!uri?.startsWith("file:")) return;
  try {
    new File(uri).delete();
  } catch {
    // The camera cache can also be cleared by the operating system.
  }
}

export default function SelfieCamera({ onClose, onUsePhoto }: Props) {
  const { width, height } = useWindowDimensions();
  const camera = useRef<CameraView>(null);
  const mounted = useRef(true);
  const captureInProgress = useRef(false);
  const draftUri = useRef<string | null>(null);
  const [facing, setFacing] = useState<CameraType>("front");
  const [flash, setFlash] = useState(false);
  const [ready, setReady] = useState(false);
  const [taking, setTaking] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<{ uri: string; faceDetected: boolean | null } | null>(null);
  const [timestamp, setTimestamp] = useState(() => new Date());
  const frameWidth = Math.min(width * 0.66, Math.max(120, (height - 375) * 0.78), 290);
  const screenFlash = taking && !photo && facing === "front" && flash;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      discardCapture(draftUri.current);
    };
  }, []);

  const capture = async () => {
    if (!ready || !camera.current || captureInProgress.current) return;
    captureInProgress.current = true;
    setTaking(true);
    setCameraError(null);
    try {
      if (flash && facing === "front") {
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
      if (!mounted.current) return;
      const captured = await camera.current?.takePictureAsync({
        quality: 0.75,
        skipProcessing: false,
        imageType: "jpg",
      });
      if (!captured?.uri) throw new Error("The camera did not return a photo. Try again.");
      if (!mounted.current) {
        discardCapture(captured.uri);
        return;
      }
      draftUri.current = captured.uri;
      setTimestamp(new Date());
      setPhoto({ uri: captured.uri, faceDetected: null });
      if (faceDetector) {
        const faceDetected = await faceDetector.hasFace(captured.uri).catch(() => null);
        if (mounted.current) setPhoto({ uri: captured.uri, faceDetected });
      }
    } catch (error) {
      if (mounted.current) {
        setCameraError(error instanceof Error ? error.message : "Could not take a selfie. Try again.");
      }
    } finally {
      captureInProgress.current = false;
      if (mounted.current) setTaking(false);
    }
  };

  const retake = () => {
    discardCapture(draftUri.current);
    draftUri.current = null;
    setReady(false);
    setPhoto(null);
    setCameraError(null);
  };

  const faceDetected = photo?.faceDetected;
  const instructions = !photo
    ? "Good lighting · Keep your face visible · Look straight ahead"
    : faceDetected === false
      ? "Try moving into better light and centering your face."
      : "Make sure your face is clear and centered.";

  return (
    <Modal
      animationType="fade"
      navigationBarTranslucent
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <SafeAreaProvider style={styles.screen}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.screen}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <View style={styles.header}>
                <Pressable
                  accessibilityLabel="Close selfie camera"
                  accessibilityRole="button"
                  onPress={onClose}
                  style={({ pressed }) => [styles.back, pressed && styles.dimmed]}
                >
                  <Ionicons name="chevron-back" size={22} color={foreground} />
                </Pressable>
                <Text accessibilityRole="header" style={styles.title}>Take Selfie</Text>
              </View>

              <View style={styles.requiredPill}>
                <Text style={styles.requiredText}>Selfie required to record attendance</Text>
              </View>

              <View style={[styles.frame, { width: frameWidth }]}>
                {photo ? (
                  <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <>
                    <CameraView
                      ref={camera}
                      key={facing}
                      facing={facing}
                      flash={facing === "back" && flash ? "on" : "off"}
                      onCameraReady={() => setReady(true)}
                      onMountError={({ message }) => {
                        setReady(false);
                        setCameraError(message || "Could not open the camera. Close this screen and try again.");
                      }}
                      style={StyleSheet.absoluteFill}
                    />
                    {!ready && (
                      <View pointerEvents="none" style={styles.placeholder}>
                        <View style={styles.placeholderHead} />
                        <View style={styles.placeholderBody} />
                      </View>
                    )}
                  </>
                )}
                <View pointerEvents="none" style={styles.frameOutline} />
              </View>

              <Text accessibilityLiveRegion="polite" style={styles.heading}>
                {photo ? taking ? "Checking your selfie…" : "Review your selfie" : "Position your face inside the frame"}
              </Text>
              <Text style={styles.instructions}>{instructions}</Text>
              <View style={styles.statusRow}>
                {faceDetected != null && (
                  <View style={[styles.statusPill, faceDetected ? styles.faceFound : styles.faceWarning]}>
                    <Text accessibilityLiveRegion="polite" style={[
                      styles.statusText, faceDetected ? styles.faceFoundText : styles.requiredText,
                    ]}>{faceDetected ? "Face detected" : "No face detected"}</Text>
                  </View>
                )}
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>{formatTime.format(timestamp)}</Text>
                </View>
              </View>
              {cameraError && (
                <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{cameraError}</Text>
              )}

              <View style={styles.footer}>
                {photo ? (
                  <View style={styles.reviewActions}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={taking}
                      onPress={retake}
                      style={({ pressed }) => [styles.reviewButton, pressed && styles.dimmed]}
                    >
                      <Text style={styles.reviewButtonText}>Retake</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: taking, busy: taking }}
                      disabled={taking}
                      onPress={() => {
                        draftUri.current = null;
                        onUsePhoto(photo.uri);
                      }}
                      style={({ pressed }) => [styles.reviewButton, styles.acceptButton, (pressed || taking) && styles.dimmed]}
                    >
                      {taking ? <ActivityIndicator color={background} /> : <Text style={styles.acceptButtonText}>Use selfie</Text>}
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.controls}>
                    <Pressable
                      accessibilityLabel="Flash"
                      accessibilityRole="togglebutton"
                      accessibilityState={{ checked: flash }}
                      disabled={taking || (Platform.OS === "web" && facing === "back")}
                      onPress={() => setFlash((enabled) => !enabled)}
                      style={({ pressed }) => [styles.control, flash && styles.controlActive, pressed && styles.dimmed]}
                    >
                      <Text style={[styles.controlText, flash && styles.requiredText]}>Flash</Text>
                    </Pressable>
                    <Pressable
                      accessibilityLabel="Capture selfie"
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !ready || taking, busy: taking }}
                      disabled={!ready || taking}
                      onPress={() => void capture()}
                      style={({ pressed }) => [styles.shutter, (!ready || pressed || taking) && styles.dimmed]}
                    >
                      {taking ? <ActivityIndicator color={foreground} /> : <View style={styles.shutterCenter} />}
                    </Pressable>
                    <Pressable
                      accessibilityLabel="Flip camera"
                      accessibilityRole="button"
                      disabled={taking}
                      onPress={() => {
                        setReady(false);
                        setCameraError(null);
                        setFacing((side) => side === "front" ? "back" : "front");
                      }}
                      style={({ pressed }) => [styles.control, pressed && styles.dimmed]}
                    >
                      <Text style={styles.controlText}>Flip</Text>
                    </Pressable>
                  </View>
                )}
                <Text style={styles.footerNote}>Selfie is mandatory · Gallery uploads are disabled</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
        {screenFlash && <View pointerEvents="none" style={styles.screenFlash} />}
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: background },
  scrollContent: { flexGrow: 1 },
  content: {
    flexGrow: 1, width: "100%", maxWidth: 480, alignSelf: "center",
    alignItems: "center", paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10,
  },
  header: { width: "100%", minHeight: 48, justifyContent: "center", alignItems: "center" },
  back: {
    position: "absolute", left: 0, zIndex: 1, width: 44, height: 44, borderRadius: 22,
    backgroundColor: panel, justifyContent: "center", alignItems: "center",
  },
  title: {
    color: foreground, fontSize: 19, fontWeight: "700",
    textAlign: "center", paddingHorizontal: 54, paddingVertical: 8,
  },
  requiredPill: { marginTop: 10, backgroundColor: panel, borderRadius: 30, paddingVertical: 7, paddingHorizontal: 15 },
  requiredText: { color: "#f9ce69", fontSize: 12, lineHeight: 16, fontWeight: "700", textAlign: "center" },
  frame: { marginTop: 17, aspectRatio: 0.78, borderRadius: 999, overflow: "hidden", backgroundColor: panel },
  frameOutline: {
    ...StyleSheet.absoluteFillObject, borderRadius: 999, borderWidth: 3, borderColor: "#92caff",
  },
  placeholder: { ...StyleSheet.absoluteFillObject, backgroundColor: panel, alignItems: "center" },
  placeholderHead: { width: "43%", aspectRatio: 1, borderRadius: 999, marginTop: "33%", backgroundColor: "#405065" },
  placeholderBody: {
    position: "absolute", top: "67%", width: "91%", aspectRatio: 1, borderRadius: 999, backgroundColor: "#405065",
  },
  heading: { marginTop: 16, color: foreground, fontSize: 16, lineHeight: 22, fontWeight: "700", textAlign: "center" },
  instructions: { color: muted, fontSize: 12, lineHeight: 17, marginTop: 9, textAlign: "center" },
  statusRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 10 },
  statusPill: { backgroundColor: panel, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { color: foreground, fontSize: 12, lineHeight: 16, fontWeight: "600" },
  faceFound: { backgroundColor: "#143728" },
  faceFoundText: { color: "#85e7ab" },
  faceWarning: { backgroundColor: "#3a2d1c" },
  error: { color: "#ffa9a9", fontSize: 13, lineHeight: 18, marginTop: 10, textAlign: "center" },
  footer: { width: "100%", marginTop: "auto", paddingTop: 22, alignItems: "center", gap: 13 },
  controls: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14 },
  control: { width: 48, height: 48, borderRadius: 24, backgroundColor: panel, alignItems: "center", justifyContent: "center" },
  controlActive: { backgroundColor: "#3a2d1c", borderWidth: 1, borderColor: "#b28a47" },
  controlText: { color: foreground, fontSize: 12, fontWeight: "700" },
  shutter: { width: 78, height: 78, borderRadius: 39, borderWidth: 3, borderColor: foreground, alignItems: "center", justifyContent: "center" },
  shutterCenter: { width: 61, height: 61, borderRadius: 31, backgroundColor: foreground },
  footerNote: { color: muted, fontSize: 12, lineHeight: 17, textAlign: "center" },
  reviewActions: { width: "100%", flexDirection: "row", gap: 12 },
  reviewButton: { flex: 1, backgroundColor: panel, minHeight: 50, borderRadius: 14, justifyContent: "center", alignItems: "center", padding: 10 },
  reviewButtonText: { color: foreground, fontSize: 15, fontWeight: "700" },
  acceptButton: { backgroundColor: "#a6d4ff" },
  acceptButtonText: { color: background, fontSize: 15, fontWeight: "700" },
  dimmed: { opacity: 0.62 },
  screenFlash: { ...StyleSheet.absoluteFillObject, backgroundColor: "#fff", opacity: 0.95 },
});
