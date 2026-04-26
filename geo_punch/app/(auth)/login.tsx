import { View, TextInput, Button, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { useAuth } from "../context/AuthContext";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { Image } from "expo-image";
import { ThemedText } from "@/components/themed-text";
import { useState } from "react";

export default function Login() {
    const { login } = useAuth();

    const [idCard, setIdCard] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        const res = await fetch("http://your-api.com/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "test@mail.com",
                password: "123456",
            }),
        });

        const data = await res.json();

        if (res.ok) {
        await login(data.token); // 🔥 triggers route switch
        }
    };

return (
    <View style={styles.container}>
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.inner}
        >
            {/* CARD */}
            <View style={styles.card}>
            
            {/* LOGO */}
            <Image
                source={require("@/assets/images/Banner.jpeg")} // put your logo here
                style={styles.logo}
                resizeMode="contain"
            />

            {/* TITLE */}
            <ThemedText style={styles.title}>Login to Your Account</ThemedText>

            {/* ID CARD */}
            <ThemedText style={styles.label}>Id Card No</ThemedText>
            <TextInput
                value={idCard}
                onChangeText={setIdCard}
                placeholder="Enter your id card no"
                style={styles.input}
            />

          {/* PASSWORD */}
            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                style={styles.input}
            />

          {/* BUTTON */}
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <ThemedText style={styles.buttonText}>Login</ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
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
    width: 180,
    height: 60,
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