import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useSignup } from "@/contexts/signUpContext";
import { useRouter } from "expo-router";
// import { supabase } from "@/lib/supabase";
import { supabase } from "@/libs/initSupabase";

export default function SignUpStep6Country() {
  const { setData, data } = useSignup();
  const [country, setCountry] = useState(data.country || "");
  const [countries, setCountries] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const router = useRouter();

  // Charger les pays depuis Supabase
  useEffect(() => {
    const fetchCountries = async () => {
      const { data, error } = await supabase.from("countries").select("id, name, alpha2").order("name");
      if (error) {
        console.error(error);
      } else {
        setCountries(data);
        setFiltered(data);
      }
    };
    fetchCountries();
  }, []);

  // Filtrer les pays
  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) return setFiltered(countries);
    const filteredData = countries.filter((item) =>
      item.name.toLowerCase().includes(text.toLowerCase())
    );
    setFiltered(filteredData);
  };

  const handleSelect = (selectedCountry: string) => {
    setCountry(selectedCountry);
  };

  const handleNext = () => {
    if (!country) return alert("Veuillez sélectionner un pays");
    setData({ country });
    router.push("/(notAuth)/signupSteps/SignUpStep7Password");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Step 6</Text>
      <Text style={styles.subtitle}>Choisis ton pays</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher un pays..."
        value={search}
        onChangeText={handleSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        style={{ width: "100%", maxHeight: 300 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.countryItem,
              country === item.name && { backgroundColor: "#e9d5ff" },
            ]}
            onPress={() => handleSelect(item.name)}
          >
            <Text style={styles.countryText}>{item.name}</Text>
          </TouchableOpacity>
        )}
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
  subtitle: { fontSize: 16, color: "#555", marginBottom: 16 },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    width: "100%",
    fontSize: 16,
    marginBottom: 12,
  },
  countryItem: {
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  countryText: { fontSize: 16 },
  button: {
    marginTop: 20,
    backgroundColor: "#4c1d95",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
