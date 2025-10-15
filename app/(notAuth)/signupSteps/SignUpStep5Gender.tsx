// screens/signup/SignUpStep2Username.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useSignup } from "@/contexts/signUpContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SignUpStep5Gender() {
  const { setData, data } = useSignup();
  const [selectedGender, setSelectedGender] = useState<"male" | "female" | null>(null);

  const router = useRouter();

  const handleNext = () => {
    if (!selectedGender) return alert("Veuillez choisir un genre");
    setData({ gender: selectedGender });
    router.push("/(notAuth)/signupSteps/SignUpStep6Country");
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sélectionne ton genre</Text>
      <Text style={styles.subtitle}>Sélectionne une option ci-dessous</Text>

      <View style={styles.genderContainer}>
        {/* ♂️ Male */}
        <TouchableOpacity
          style={[
            styles.genderCard,
            selectedGender === "male" && styles.genderCardSelected,
          ]}
          onPress={() => setSelectedGender("male")}
        >
          <Ionicons
            name="male-outline"
            size={48}
            color={selectedGender === "male" ? "#4c1d95" : "#888"}
            style={styles.icon}
          />
          <Text
            style={[
              styles.genderText,
              selectedGender === "male" && styles.genderTextSelected,
            ]}
          >
            Homme
          </Text>
        </TouchableOpacity>

        {/* ♀️ Female */}
        <TouchableOpacity
          style={[
            styles.genderCard,
            selectedGender === "female" && styles.genderCardSelected,
          ]}
          onPress={() => setSelectedGender("female")}
        >
          <Ionicons
            name="female-outline"
            size={48}
            color={selectedGender === "female" ? "#4c1d95" : "#888"}
            style={styles.icon}
          />
          <Text
            style={[
              styles.genderText,
              selectedGender === "female" && styles.genderTextSelected,
            ]}
          >
            Femme
          </Text>
        </TouchableOpacity>
      </View>

      {selectedGender && (
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Continuer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f7fd",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#4c1d95",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 40,
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  genderCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 30,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  genderCardSelected: {
    borderColor: "#4c1d95",
    shadowColor: "#4c1d95",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: {
    marginBottom: 12,
  },
  genderText: {
    fontSize: 18,
    color: "#555",
    fontWeight: "600",
  },
  genderTextSelected: {
    color: "#4c1d95",
  },
  button: {
    width: "100%",
    backgroundColor: "#4c1d95",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 50,
    shadowColor: "#4c1d95",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
