// screens/signup/SignUpStep2Username.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useSignup } from "@/contexts/signUpContext";
import { useRouter } from "expo-router";
import RNDateTimePicker from "@react-native-community/datetimepicker";
import CustomDatePicker from "@/components/date/datePicker";

export default function SignUpStep4BirthDay() {
  const { setData, data } = useSignup();
  const [birthDate, setbirthDate] = useState(data.birthDate || "");
  const [ showNext, setShowNext ] = useState(false);

  const router = useRouter();

    const handleNext = () => {
        if (!birthDate) return alert("Veuillez entrer une date de naissance");
        setData({ birthDate: birthDate });
        router.push("/(notAuth)/signupSteps/SignUpStep5Gender");
    };

    const validateNewDate = (date: Date) => {
        setbirthDate(date.toISOString());
        setShowNext(true);
    }

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Step 4</Text>
        <Text style={styles.subtitle}>Pick your birthdate</Text>

        {/* <RNDateTimePicker
          mode="date"
          display="spinner"
          value={birthDate ? new Date(birthDate) : new Date()}
          onChange={(_, selectedDate) => {
            if (selectedDate) setbirthDate(selectedDate.toISOString());
          }}
        /> */}
        <CustomDatePicker onDateChange={(date) => validateNewDate(date)} />


        <Text style={styles.selectedDateText}>
            Selected Date: {birthDate ? new Date(birthDate).toLocaleDateString() : "None"}
        </Text>
        
        { showNext ? 

            <TouchableOpacity onPress={handleNext} style={styles.button}>
                <Text style={styles.buttonText}>Next Step</Text>
            </TouchableOpacity>
            : <></>
        }
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
  selectedDateText: {
    fontSize: 16,
    padding:10
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
