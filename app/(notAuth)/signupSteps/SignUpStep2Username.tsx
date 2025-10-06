// screens/signup/SignUpStep2Username.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useSignup } from "@/contexts/signUpContext";
import { useRouter } from "expo-router";

export default function SignUpStep2Username() {
  const { setData, data } = useSignup();
  const [username, setUsername] = useState(data.username || "");

  const router = useRouter();

  const handleNext = () => {
    if (!username) return alert("Veuillez entrer un username");
    setData({ username: username });
    router.push("/(notAuth)/signupSteps/SignUpStep3Name");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Step 2</Text>
      <Text style={styles.subtitle}>Pick a Username</Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        autoCapitalize="words"
        autoCorrect={false}
        
      />


      <TouchableOpacity onPress={handleNext} style={styles.button}>
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
  button: {
    backgroundColor: "#4c1d95",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
