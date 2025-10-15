import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useSignup } from "@/contexts/signUpContext";
import { useRouter } from "expo-router";
import * as Localization from "expo-localization";
import { supabase } from "@/libs/initSupabase";
import {
  Toast,
  ToastTitle,
  ToastDescription,
  useToast,
} from '@/components/ui/toast';
import { Spinner } from "@/components/ui/spinner";

export default function SignUpSummary() {
  const { data } = useSignup();
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const toast = useToast();

  const handleConfirm = async() => {
    try{
      setLoading(true);
      // alert("Inscription terminée avec succès !");
      const { data: signUpData, error: signUpError}  = await supabase.auth.signUp({
        email: data.email!,
        password: data.password!,
      });
      if(signUpError){
        console.error("Error when Signing up in handleConfirm function in SignUpSummary.tsx:", signUpError.message);
        alert("Error when signUp: " + signUpError.message);
        return;
      }else{
        // showToastValidation();
      }
      const { data: profileData, error: profileError} = await supabase.from("profiles").insert([
        {
          user_id: signUpData?.user?.id,
          username: data.username,
          firstname: data.firstName,
          lastname: data.lastName,
          birthdate: data.birthDate,
          gender: data.gender,
          country: data.country,
          private: false,
          theme:"light",
        }]);
        if(profileError){
        console.error("Error when inserting profile in handleConfirm function in SignUpSummary.tsx:", profileError.message);
        alert("Erreur lors de la création du profil: " + profileError.message);
        return;
      }else{
        
      }
    }catch(error: unknown){
      console.error("Error during sign up in handleConfirm function in SignUpSummary.tsx:", error);
    }finally{
      showToastValidation();
      setLoading(false);
      router.dismissTo('/')
    }
  };

  const showToastValidation = () => {
    const newId = Math.random().toString(36).substring(7);
    // setToastId(newId);
    toast.show({
      id: newId,
      placement: "top",
      duration: 9000,
      render: ({id}) => {
        const uniqueToastId = 'toast-' + id;
        return(
          <Toast nativeID={uniqueToastId} action="muted" variant="solid">
            <ToastTitle>Account Created !</ToastTitle>
            <ToastDescription>
              Confirm your email to SignIn to the App now !
            </ToastDescription>
          </Toast>
        );
      }
    })
  }

  const infoItems = [
    { label: "Email", value: data.email },
    { label: "Username", value: data.username },
    { label: "First Name", value: data.firstName },
    { label: "Last Name", value: data.lastName },
    { label: "Birthday", value: data.birthDate },
    { label: "Gender", value: data.gender },
    { label: "Country", value: data.country },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Almost there 🎉</Text>
      <Text style={styles.subtitle}>Here’s a quick summary before you confirm</Text>

      <View style={styles.card}>
        {infoItems.map((item, index) => {
          let displayValue = item.value;

          // 🔹 Si c’est la date de naissance, on la formate joliment
          if (item.label === "Birthday" && item.value) {
            try {
              const date = new Date(item.value);
              displayValue = date.toLocaleDateString(Localization.locale || "fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
            } catch (e) {
              console.warn("Invalid date format:", item.value);
            }
          }

          return (
            <View key={index} style={styles.row}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={[styles.value, !displayValue && { color: "#999" }]}>
                {displayValue || "Not provided"}
              </Text>
            </View>
          );
        })}
      </View>
      { loading ? 
        <Spinner />
      :
        <>
        <TouchableOpacity onPress={handleConfirm} style={styles.button}>
          <Text style={styles.buttonText}>Confirm & Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
        </>
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f9f7fd",
  },
  title: { fontSize: 28, fontWeight: "700", color: "#4c1d95", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, color: "#555", marginBottom: 24, textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 30,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: { fontSize: 16, color: "#666", fontWeight: "500" },
  value: { fontSize: 16, color: "#333", fontWeight: "600" },
  button: {
    backgroundColor: "#4c1d95",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  backButton: { marginTop: 12 },
  backButtonText: { color: "#4c1d95", fontSize: 16, fontWeight: "500" },
});
