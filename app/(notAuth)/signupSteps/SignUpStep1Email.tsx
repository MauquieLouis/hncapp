// screens/signup/SignUpStep1Email.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useSignup } from "@/contexts/signUpContext";
import { useRouter } from "expo-router";

export default function SignUpStep1Email() {
  const { setData, data } = useSignup();
  const [email, setEmail] = useState(data.email || "");
  const [phone, setPhone] = useState(data.phone || "");

  const router = useRouter();

  const handleNext = () => {
    if (!email && !phone) return alert("Veuillez entrer un email ou un téléphone");
    setData({ email: email, phone: phone });
    router.push("/(notAuth)/signupSteps/SignUpStep2Username");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Étape 1</Text>
      <Text style={styles.subtitle}>Entrez votre email ou téléphone</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Téléphone"
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
        keyboardType="phone-pad"
      />

      <TouchableOpacity onPress={handleNext} style={styles.button}>
        <Text style={styles.buttonText}>Suivant</Text>
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
  button: {
    backgroundColor: "#4c1d95",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
