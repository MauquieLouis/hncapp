import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView 
} from "react-native";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signInWithEmail = () => {
    setLoading(true);
    // Add your sign-in logic here
    setTimeout(() => setLoading(false), 2000);
  };

  const signUpWithEmail = () => {
    setLoading(true);
    // Add your sign-up logic here
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

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

      <View style={styles.inputContainer}>
        <TextInput
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry
          placeholder="Password"
          placeholderTextColor="#aaa"
          autoCapitalize="none"
          style={styles.input}
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={signInWithEmail}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Signing in..." : "Sign In"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.secondaryButton, loading && styles.buttonDisabled]} 
        onPress={signUpWithEmail}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>
          {loading ? "Loading..." : "Sign Up"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
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
  button: {
    width: "100%",
    backgroundColor: "#4c1d95",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
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
  secondaryButton: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#4c1d95",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  secondaryButtonText: {
    color: "#4c1d95",
    fontSize: 18,
    fontWeight: "600",
  },
});
