import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useSignup } from "@/contexts/signUpContext";
import { useRouter } from "expo-router";

export default function SignUpStep7Password() {
  const { setData, data } = useSignup();
  const [password, setPassword] = useState(data.password || "");
  const [password2, setPassword2] = useState(data.password2 || "");
  const [error, setError] = useState("");

  const router = useRouter();

  // Vérification en direct
  useEffect(() => {
    if (password2.length > 0 && password !== password2 || password.length < 6) {
      setError("Les mots de passe ne correspondent pas et doivent contenir au moins 6 caractères");
    } else {
      setError("");
    }
  }, [password, password2]);

  const handleNext = () => {
    if (!password || !password2) return alert("Veuillez entrer et confirmer votre mot de passe");
    if (password !== password2) return alert("Les mots de passe ne correspondent pas");
    if (password.length < 6) return alert("Le mot de passe doit contenir au moins 6 caractères");
    setData({ password, password2 });
    router.push("/(notAuth)/signupSteps/SignUpSummary");
  };

  const isValid = password.length > 0 && password2.length > 0 && password === password2;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Step 7</Text>
      <Text style={styles.subtitle}>Enter your password</Text>

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        autoCorrect={false}
        secureTextEntry={true}
      />

      <TextInput
        placeholder="Confirm Password"
        value={password2}
        onChangeText={setPassword2}
        style={styles.input}
        autoCorrect={false}
        secureTextEntry={true}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        onPress={handleNext}
        style={[styles.button, !isValid && { backgroundColor: "#aaa" }]}
        disabled={!isValid}
      >
        <Text style={styles.buttonText}>Next Step</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#f9f7fd" },
  title: { fontSize: 28, fontWeight: "700", color: "#4c1d95", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#555", marginBottom: 24 },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 16,
    width: "100%",
  },
  error: {
    color: "red",
    marginBottom: 12,
    fontSize: 14,
  },
  button: {
    backgroundColor: "#4c1d95",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
