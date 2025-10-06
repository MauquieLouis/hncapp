// screens/signup/SignUpStep2Username.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useSignup } from "@/contexts/signUpContext";
import { useRouter } from "expo-router";

export default function SignUpSummary() {
  const { setData, data } = useSignup();
  const [country, setCountry] = useState(data.country || "");

  const router = useRouter();

  const handleNext = () => {
    if (!country) return alert("Summary");
    setData({ country: country });
    // router.push("/(notAuth)/signupSteps/SignUpSummary");
  };

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Here is a summary</Text>
        <Text style={styles.subtitle}>SUMMARY</Text>


        <Text>SUMMARY</Text>

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
