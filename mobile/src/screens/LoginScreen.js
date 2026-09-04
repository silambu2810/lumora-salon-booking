import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { login as loginApi } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert(
        "Missing information",
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const data = await loginApi(
        email.trim(),
        password
      );

      if (data.user?.role !== "customer") {
        Alert.alert(
          "Customer account required",
          "The mobile application is for customers."
        );
        return;
      }

      login(data.access_token, data.user);

      navigation.replace("Salons");
    } catch (error) {
      Alert.alert(
        "Login failed",
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>
          LUMORA
        </Text>

        <Text style={styles.title}>
          Beauty, booked simply.
        </Text>

        <Text style={styles.subtitle}>
          Sign in to discover salons and
          manage your appointments.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Signing in..." : "Sign in"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f3ee",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
  },

  eyebrow: {
    fontSize: 13,
    letterSpacing: 3,
    color: "#9b7650",
    marginBottom: 14,
    fontWeight: "700",
  },

  title: {
    fontSize: 38,
    lineHeight: 44,
    color: "#282522",
    fontWeight: "700",
    marginBottom: 14,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#766b61",
    marginBottom: 30,
  },

  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ddd4cb",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    marginBottom: 14,
  },

  button: {
    backgroundColor: "#282522",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});