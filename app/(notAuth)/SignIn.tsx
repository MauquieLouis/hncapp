import React, { useState } from "react";
import { supabase } from "@/libs/initSupabase";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const router = useRouter();

  // 🔹 Connexion
  const signInWithEmail = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) {
        Alert.alert(error.message);
        return;
      }
    } catch (error: unknown) {
      console.error("Error in signInWithEmail:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Inscription (placeholder)
  const signUpWithEmail = () => {
    setLoading(true);
    router.push("/(notAuth)/signupSteps/SignUpStep1Email");
    setTimeout(() => setLoading(false), 2000);
  };

  // 🔹 Mot de passe oublié
  const handleForgotPassword = () => {
    setModalVisible(true);
  };

  // 🔹 Envoi du lien de réinitialisation Supabase
  const handlePasswordReset = async () => {
    if (!resetEmail) {
      Alert.alert("Veuillez entrer votre adresse e-mail.");
      return;
    }

    try {
      setResetLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: "https://votreapp.com/reset-password", // 🔸 à personnaliser
      });
      if (error) throw error;
      Alert.alert(
        "E-mail envoyé",
        "Un lien de réinitialisation de mot de passe vous a été envoyé."
      );
      setModalVisible(false);
      setResetEmail("");
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      {/* Champ email */}
      <View style={styles.inputContainer}>
        <TextInput
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="Email Address"
          placeholderTextColor="#aaa"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
      </View>

      {/* Champ mot de passe + bouton afficher/masquer */}
      <View style={[styles.inputContainer, styles.passwordContainer]}>
        <TextInput
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={!showPassword}
          placeholder="Password"
          placeholderTextColor="#aaa"
          autoCapitalize="none"
          style={[styles.input, { flex: 1, marginRight: 8 }]}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.showButton}
        >
          <Text style={styles.showButtonText}>
            {showPassword ? "🙈" : "👁️"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mot de passe oublié */}
      <TouchableOpacity
        onPress={handleForgotPassword}
        style={styles.forgotPasswordButton}
      >
        <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
      </TouchableOpacity>

      {/* Bouton de connexion */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={signInWithEmail}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Signing in..." : "Sign In"}
        </Text>
      </TouchableOpacity>

      {/* Nouveau ici */}
      <View style={styles.newHereContainer}>
        <Text style={styles.newHereText}>Nouveau ici ?</Text>
      </View>

      {/* Bouton inscription */}
      <TouchableOpacity
        style={[styles.secondaryButton, loading && styles.buttonDisabled]}
        onPress={signUpWithEmail}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>
          {loading ? "Loading..." : "Sign Up"}
        </Text>
      </TouchableOpacity>

      {/* 🔹 Modale : Mot de passe oublié */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Réinitialiser le mot de passe</Text>
            <Text style={styles.modalSubtitle}>
              Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
            </Text>

            <TextInput
              style={[styles.input, { width: "100%", marginTop: 16 }]}
              placeholder="Email Address"
              placeholderTextColor="#aaa"
              autoCapitalize="none"
              keyboardType="email-address"
              value={resetEmail}
              onChangeText={setResetEmail}
            />

            <TouchableOpacity
              style={[styles.button, resetLoading && styles.buttonDisabled, { marginTop: 20 }]}
              onPress={handlePasswordReset}
              disabled={resetLoading}
            >
              <Text style={styles.buttonText}>
                {resetLoading ? "Envoi..." : "Envoyer le lien"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f7fd",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#4c1d95",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 32,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  showButton: {
    padding: 8,
  },
  showButtonText: {
    fontSize: 18,
  },
  forgotPasswordButton: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: "#4c1d95",
    fontSize: 14,
    fontWeight: "500",
  },
  button: {
    width: "100%",
    backgroundColor: "#4c1d95",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#4c1d95",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  newHereContainer: {
    marginTop: 24,
  },
  newHereText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
  },
  secondaryButton: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#4c1d95",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#4c1d95",
    fontSize: 18,
    fontWeight: "600",
  },
  // --- Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4c1d95",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  modalCloseButton: {
    marginTop: 16,
  },
  modalCloseText: {
    color: "#4c1d95",
    fontSize: 16,
    fontWeight: "600",
  },
});
