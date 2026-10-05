import { View, TextInput, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, TouchableWithoutFeedback, Keyboard, ScrollView, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Image } from "expo-image";
import { ThemedText } from "@/components/themed-text";
import { useState } from "react";
import { apiRequest } from "@/constants/apiRequest";

export default function Login() {
    const { login } = useAuth();

    const [idCard, setIdCard] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async () => {
        if (isSubmitting) return;
        if (!idCard.trim() || !password) {
          setErrorMessage("Enter your ID card number and password.");
          return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);
        try {
          const result = await apiRequest<{ token: string }>("/auth/geo_punch/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_card_no: idCard.trim(), password }),
          });
          await login(result.token);
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Could not sign in. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
    };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Image
              source={require("@/assets/images/Banner.jpeg")}
              style={styles.logo}
              resizeMode="contain"
            />

            <ThemedText style={styles.title}>Login to Your Account</ThemedText>
            <ThemedText style={styles.helperText}>Sign in to record and review your attendance.</ThemedText>

            {errorMessage && (
              <ThemedText accessibilityRole="alert" style={styles.errorMessage}>
                {errorMessage}
              </ThemedText>
            )}

            <ThemedText style={styles.label}>Id Card No</ThemedText>
            <TextInput
              value={idCard}
              onChangeText={(value) => { setIdCard(value); setErrorMessage(null); }}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="ID card number"
              placeholder="Enter your id card no"
              style={styles.input}
              returnKeyType="next"
            />

            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              value={password}
              onChangeText={(value) => { setPassword(value); setErrorMessage(null); }}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={() => void handleLogin()}
            />

            <TouchableOpacity accessibilityRole="button" style={[styles.button, isSubmitting && { opacity: 0.7 }]} onPress={() => void handleLogin()} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Login</ThemedText>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7faf9",
    justifyContent: "center",
    alignItems: "center",
  },

  inner: {
    width: "100%",
    alignItems: "center",
  },

  card: {
    width: "90%",
    maxWidth: 380,
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e5ece9",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },

  logo: {
    width: 300,
    height: 150,
    alignSelf: "center",
    marginBottom: 6,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
    color: "#172522",
  },

  helperText: {
    textAlign: "center",
    color: "#66736f",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    marginBottom: 6,
    color: "#394944",
    fontWeight: "600",
  },

  input: {
    borderWidth: 1,
    borderColor: "#d6e0dc",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 14,
    color: "#172522",
    backgroundColor: "#fff",
  },

  button: {
    backgroundColor: "#0f766e",
    paddingVertical: 14,
    borderRadius: 13,
    marginTop: 4,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
  },

  errorMessage: {
    color: "#b42318",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
    padding: 11,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
  },
});
