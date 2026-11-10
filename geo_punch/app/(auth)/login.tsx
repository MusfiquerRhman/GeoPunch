import { ApiError, apiRequest } from "@/constants/apiRequest";
import { getDeviceDetails } from "@/utils/deviceIdentity";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as SecureStore from "expo-secure-store";
import { useRef, useState } from "react";
import {
  ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View, type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

type Field = "idCard" | "password";
type FormError = { message: string; fields?: Field[]; deviceState?: "pending" | "rejected" };

const blue = "#235fe5";
const linkBlue = "#2055c3";
const mutedIcon = "#66788f";
const errorRed = "#b42318";
const gradient = "linear-gradient(180deg, #d9eaff 0%, #f4f8fd 100%)";
const heroBackground = Platform.select<ViewStyle>({
  web: { backgroundImage: gradient } as ViewStyle,
  default: { experimental_backgroundImage: gradient },
});
const biometricMethod = Platform.OS === "ios" ? "biometrics" : "fingerprint";

export default function Login() {
  const { login, unlock } = useAuth();
  const insets = useSafeAreaInsets();
  const passwordInput = useRef<TextInput>(null);
  const requestInProgress = useRef(false);
  const [idCard, setIdCard] = useState("");
  const [password, setPassword] = useState("");
  const [focused, setFocused] = useState<Field | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<FormError | null>(null);
  const [pending, setPending] = useState<"password" | "biometric" | null>(null);
  const [setupBiometrics, setSetupBiometrics] = useState(false);
  const [biometricMessage, setBiometricMessage] = useState("");
  const [help, setHelp] = useState<"password" | "support" | null>(null);

  const handleLogin = async (resendDeviceTrust = false) => {
    if (requestInProgress.current) return;

    const cardNumber = idCard.trim();
    if (!cardNumber || !password) {
      const fields: Field[] = [];
      if (!cardNumber) fields.push("idCard");
      if (!password) fields.push("password");
      setError({ message: "Enter your ID card number and password.", fields });
      return;
    }

    requestInProgress.current = true;
    Keyboard.dismiss();
    setPending("password");
    setError(null);
    try {
      const result = await apiRequest<{ token?: unknown }>("/auth/geo_punch/login", {
        device: true,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_card_no: cardNumber,
          password,
          device: getDeviceDetails(),
          resend_device_trust: resendDeviceTrust,
        }),
      });
      if (typeof result?.token !== "string" || !result.token.trim()) {
        throw new Error("The server did not return a sign-in token. Please try again.");
      }
      const mode = setupBiometrics ? "biometric" : rememberMe ? "remembered" : "temporary";
      await login(result.token, mode).catch((failure: unknown) => {
        if (mode !== "biometric") throw failure;
        throw new Error("Biometric setup didn’t complete. Try again or cancel setup to sign in.");
      });
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) {
        setError({ message: "Incorrect ID card no or password.", fields: ["idCard", "password"] });
      } else {
        const deviceState = failure instanceof ApiError
          ? failure.code === "DEVICE_PENDING" ? "pending" : failure.code === "DEVICE_REJECTED" ? "rejected" : undefined
          : undefined;
        setError({
          message: failure instanceof Error ? failure.message : "Could not sign in. Please try again.",
          deviceState,
        });
      }
    } finally {
      requestInProgress.current = false;
      setPending(null);
    }
  };

  const handleBiometrics = async () => {
    if (requestInProgress.current) return;
    if (setupBiometrics) {
      setSetupBiometrics(false);
      setBiometricMessage("");
      return;
    }
    if (Platform.OS === "web") {
      setBiometricMessage("Fingerprint unlock is available in the GeoPunch mobile app.");
      return;
    }
    if (!SecureStore.canUseBiometricAuthentication()) {
      setBiometricMessage("Biometric unlock requires a supported device with biometrics enabled in Settings.");
      return;
    }

    requestInProgress.current = true;
    Keyboard.dismiss();
    setPending("biometric");
    setError(null);
    setBiometricMessage("");
    try {
      if (await unlock()) return;
      setRememberMe(false);
      setSetupBiometrics(true);
      setBiometricMessage("Sign in with your password to set up biometric unlock on this device.");
    } catch {
      setBiometricMessage("Biometric unlock didn’t complete. Try again or sign in with your password.");
    } finally {
      requestInProgress.current = false;
      setPending(null);
    }
  };

  const idError = error?.fields?.includes("idCard");
  const passwordError = error?.fields?.includes("password");
  const rememberDisabled = pending !== null || Platform.OS === "web";
  const loginLabel = error?.deviceState === "pending"
    ? "Check approval"
    : error?.deviceState === "rejected" ? "Resend trust request" : "Login";

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, heroBackground, { paddingTop: insets.top + 58 }]}>
          <View pointerEvents="none" style={[styles.circle, styles.circleTop]} />
          <View pointerEvents="none" style={[styles.circle, styles.circleRight]} />
          <View pointerEvents="none" style={[styles.circle, styles.circleOutline]} />
          <View style={styles.logoFrame}>
            <Image source={require("@/assets/images/logo.jpeg")} style={styles.logo} contentFit="contain" />
          </View>
          <Text accessibilityLabel="GeoPunch" style={styles.wordmark}>
            <Text style={styles.wordmarkAccent}>Geo</Text>Punch
          </Text>
          <Text style={styles.tagline}>Track  •  Snap  •  Verify</Text>
        </View>

        <View style={[styles.card, {
          paddingBottom: Math.max(16, insets.bottom + 12),
          paddingLeft: 24 + insets.left,
          paddingRight: 24 + insets.right,
        }]}>
          <Text accessibilityRole="header" style={styles.title}>Login to Your Account</Text>
          <Text style={styles.subtitle}>Sign in to record and review your attendance.</Text>

          <Text style={styles.label}>ID Card No</Text>
          <View style={[styles.field, focused === "idCard" && styles.fieldFocused, idError && styles.fieldError]}>
            <MaterialCommunityIcons name="card-account-details-outline" size={20} color={idError ? errorRed : focused === "idCard" ? blue : mutedIcon} />
            <TextInput
              accessibilityLabel="ID card number"
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
              editable={!pending}
              onBlur={() => setFocused((field) => field === "idCard" ? null : field)}
              onChangeText={(value) => { setIdCard(value); setError(null); }}
              onFocus={() => setFocused("idCard")}
              onSubmitEditing={() => passwordInput.current?.focus()}
              placeholder="Enter your ID card no"
              placeholderTextColor="#65758a"
              returnKeyType="next"
              style={styles.input}
              submitBehavior="submit"
              value={idCard}
            />
          </View>

          <Text style={[styles.label, styles.passwordLabel]}>Password</Text>
          <View style={[styles.field, focused === "password" && styles.fieldFocused, passwordError && styles.fieldError]}>
            <MaterialCommunityIcons name="lock" size={19} color={passwordError ? errorRed : focused === "password" ? blue : mutedIcon} />
            <TextInput
              ref={passwordInput}
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect={false}
              editable={!pending}
              onBlur={() => setFocused((field) => field === "password" ? null : field)}
              onChangeText={(value) => { setPassword(value); setError(null); }}
              onFocus={() => setFocused("password")}
              onSubmitEditing={() => void handleLogin()}
              placeholder="Enter your password"
              placeholderTextColor="#65758a"
              returnKeyType="go"
              secureTextEntry={!showPassword}
              style={styles.input}
              value={password}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              disabled={pending !== null}
              onPress={() => setShowPassword((visible) => !visible)}
              style={styles.visibilityButton}
            >
              <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={21} color={mutedIcon} />
            </Pressable>
          </View>

          {error && (
            <View style={styles.errorRow}>
              <MaterialCommunityIcons
                name={error.deviceState === "pending" ? "information" : "alert-circle"}
                size={17}
                color={error.deviceState === "pending" ? linkBlue : errorRed}
              />
              <Text accessibilityRole="alert" accessibilityLiveRegion="polite"
                style={[styles.errorText, error.deviceState === "pending" && { color: linkBlue }]}>{error.message}</Text>
            </View>
          )}

          <View style={styles.options}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe, disabled: rememberDisabled }}
              accessibilityHint="Keeps you signed in when you reopen the app."
              disabled={rememberDisabled}
              onPress={() => {
                setRememberMe((remembered) => !remembered);
                setSetupBiometrics(false);
                setBiometricMessage("");
              }}
              style={styles.remember}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
              </View>
              <Text style={styles.optionText}>Remember me</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setHelp("password")} style={styles.optionButton}>
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={loginLabel}
            accessibilityState={{ busy: pending === "password", disabled: pending !== null }}
            disabled={pending !== null}
            onPress={() => void handleLogin(error?.deviceState === "rejected")}
            style={({ pressed }) => [styles.button, styles.primaryButton, (pressed || pending) && styles.dimmed]}
          >
            {pending === "password" ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{loginLabel}</Text>}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: pending === "biometric", disabled: pending !== null }}
            disabled={pending !== null}
            onPress={() => void handleBiometrics()}
            style={({ pressed }) => [styles.button, styles.biometricButton, (pressed || pending) && styles.dimmed]}
          >
            {pending === "biometric"
              ? <ActivityIndicator color={linkBlue} />
              : <MaterialCommunityIcons name="fingerprint" size={21} color={linkBlue} />}
            <Text style={styles.biometricText}>{setupBiometrics ? "Cancel biometric setup" : "Unlock with " + biometricMethod}</Text>
          </Pressable>

          {!!biometricMessage && (
            <Text accessibilityLiveRegion="polite" style={styles.biometricMessage}>{biometricMessage}</Text>
          )}

          <View style={styles.footer}>
            <Pressable accessibilityRole="button" onPress={() => setHelp("support")} style={styles.optionButton}>
              <Text style={styles.optionText}>Need help? <Text style={styles.link}>Contact HR or IT support</Text></Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setHelp(null)}
        transparent
        visible={help !== null}
      >
        <View style={styles.modalBackdrop}>
          <View accessibilityViewIsModal style={styles.dialog}>
            <Text accessibilityRole="header" style={styles.dialogTitle}>
              {help === "password" ? "Forgot password?" : "Contact HR or IT support"}
            </Text>
            <Text style={styles.subtitle}>
              {help === "password"
                ? "Ask your organization’s HR or IT support team to reset your GeoPunch password. Have your ID card number ready."
                : "Contact your organization’s HR or IT support team for help with your GeoPunch account. Have your ID card number ready."}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setHelp(null)}
              style={({ pressed }) => [styles.button, styles.primaryButton, pressed && styles.dimmed]}
            >
              <Text style={styles.buttonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f3f6fb" },
  scrollContent: { flexGrow: 1, alignItems: "center" },
  hero: {
    width: "100%",
    maxWidth: 480,
    alignItems: "center",
    paddingBottom: 86,
    backgroundColor: "#e6f0fd",
    overflow: "hidden",
  },
  circle: { position: "absolute", borderRadius: 999 },
  circleTop: { width: 260, height: 260, left: -78, top: -100, backgroundColor: "#c8dffb" },
  circleRight: { width: 192, height: 192, right: -72, top: 43, backgroundColor: "#cce2fd" },
  circleOutline: { width: 122, height: 122, left: -43, top: 150, borderWidth: 1.5, borderColor: "#b3d4f1" },
  logoFrame: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#a9cef6",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 62, height: 62, borderRadius: 31 },
  wordmark: { color: "#52647a", fontSize: 37, lineHeight: 45, fontWeight: "700", marginTop: 10 },
  wordmarkAccent: { color: blue },
  tagline: { color: "#36465a", fontSize: 13, lineHeight: 18, letterSpacing: 0.9, fontWeight: "600", marginTop: 3 },
  card: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 480,
    marginTop: -28,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: "#fff",
    paddingTop: 27,
    boxShadow: "0 -8px 26px rgba(34, 66, 102, 0.07)",
  },
  title: { color: "#111b2d", fontSize: 24, lineHeight: 31, fontWeight: "700" },
  subtitle: { color: "#475569", fontSize: 14, lineHeight: 20, marginTop: 4, marginBottom: 15 },
  label: { color: "#334155", fontSize: 13, lineHeight: 18, fontWeight: "600", marginBottom: 5 },
  passwordLabel: { marginTop: 15 },
  field: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: "#e1e7ef",
    borderRadius: 15,
    backgroundColor: "#f6f8fb",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 15,
  },
  fieldFocused: { backgroundColor: "#fff", borderColor: blue, boxShadow: "0 0 0 2px #dbe8ff" },
  fieldError: { borderColor: errorRed, backgroundColor: "#f6f8fb", boxShadow: "none" },
  input: {
    flex: 1,
    minWidth: 0,
    color: "#111b2d",
    fontSize: 15,
    paddingVertical: 12,
    ...Platform.select({ web: { outlineStyle: "solid" as const, outlineWidth: 0 } }),
  },
  visibilityButton: { width: 44, minHeight: 44, marginRight: -10, justifyContent: "center", alignItems: "center" },
  errorRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 7 },
  errorText: { flex: 1, color: errorRed, fontSize: 13, lineHeight: 18 },
  options: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", columnGap: 10, marginTop: 4 },
  remember: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 42 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1, borderColor: "#8796a9", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: blue, borderColor: blue },
  optionButton: { justifyContent: "center", minHeight: 42 },
  optionText: { color: "#334155", fontSize: 13, lineHeight: 18, textAlign: "center" },
  link: { color: linkBlue, fontSize: 13, lineHeight: 18, fontWeight: "700" },
  button: { alignItems: "center", justifyContent: "center", minHeight: 54, borderRadius: 15, paddingVertical: 12, paddingHorizontal: 12 },
  primaryButton: { backgroundColor: blue, boxShadow: "0 5px 12px rgba(35, 95, 229, 0.25)" },
  buttonText: { color: "#fff", fontSize: 16, lineHeight: 22, fontWeight: "700" },
  biometricButton: { backgroundColor: "#eef3ff", flexDirection: "row", gap: 10, marginTop: 14 },
  biometricText: { color: linkBlue, fontSize: 14, lineHeight: 20, fontWeight: "700", flexShrink: 1 },
  biometricMessage: { color: "#475569", fontSize: 13, lineHeight: 18, marginTop: 8, textAlign: "center" },
  dimmed: { opacity: 0.72 },
  footer: { alignItems: "center", marginTop: "auto", paddingTop: 25 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(16, 29, 48, 0.42)", alignItems: "center", justifyContent: "center", padding: 24 },
  dialog: { width: "100%", maxWidth: 360, borderRadius: 24, backgroundColor: "#fff", padding: 22 },
  dialogTitle: { color: "#111b2d", fontSize: 20, lineHeight: 26, fontWeight: "800" },
});
