import { View, TextInput, Button, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, TouchableWithoutFeedback, Keyboard, ScrollView } from "react-native";
import { useAuth } from "../context/AuthContext";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { Image } from "expo-image";
import { ThemedText } from "@/components/themed-text";
import { useState } from "react";
import { API_URL } from "@/constants/API_URL";

export default function Login() {
    const { login } = useAuth();

    const [idCard, setIdCard] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleLogin = async () => {
        const res = await fetch(`${API_URL}/auth/geo_punch/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_card_no: idCard,
                password: password,
            }),
        }).catch((error) => {
            console.error("Network error during login:", error);
            alert("Network error. Please check your connection and try again.");
        });

        if (!res) return; // Exit if there was a network error

        const data = await res.json();

        if (res.ok) {
          await login(data.token); // 🔥 triggers route switch
        } else {
          console.error("Login failed:", data.error);
          setErrorMessage(data.error || "An unknown error occurred.");
        }
    };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* dismiss keyboard on tap */}
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

            {errorMessage && (
              <ThemedText style={{ color: "red", marginBottom: 10 }}>
                {errorMessage}
              </ThemedText>
            )}

            <ThemedText style={styles.label}>Id Card No</ThemedText>
            <TextInput
              value={idCard}
              onChangeText={setIdCard}
              placeholder="Enter your id card no"
              style={styles.input}
              returnKeyType="next"
            />

            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              style={styles.input}
              returnKeyType="done"
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <ThemedText style={styles.buttonText}>Login</ThemedText>
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
    backgroundColor: "#f4f6f8",
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
    padding: 25,
    borderRadius: 12,

    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  logo: {
    width: 300,
    height: 150,
    alignSelf: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#000",
  },

  label: {
    fontSize: 14,
    marginBottom: 5,
    color: "#1f2937",
  },

  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
    fontSize: 14,
  },

  button: {
    backgroundColor: "#0d6efd",
    padding: 12,
    borderRadius: 6,
    marginTop: 5,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
});