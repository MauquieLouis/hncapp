import { useUserContext } from "@/contexts/userContext";
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
// import { debounce } from 'lodash';
import { supabase } from '@/libs/initSupabase'; // ⚠️ adapte le chemin à ton projet
import Avatar from "@/components/profile/avatar";
import { useRouter } from "expo-router";

const SearchProfile = () => {

  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { theme } = useUserContext();
  const router = useRouter();

  const debounce = (func: (text: string | any[]) => Promise<void>, delay: number | undefined) => {
      let debounceTimer: string | number | NodeJS.Timeout | undefined;
      return function(...args: any) {
          const context = this;
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => func.apply(context, args), delay);
      }
  }

  // --- Débounced search function
  const searchProfiles = useCallback(
    debounce(async (text: string | any[]) => {
      if (!text || text.length < 2) {
        setProfiles([]);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('search_profiles_fulltext_unaccent', { q: text });
        // .from('profiles')
        // .select('user_id, username, firstname, lastname, profile_picture_url')
        // .or(`username.ilike.%${text}%, firstname.ilike.%${text}%, lastname.ilike.%${text}%`)
        // .limit(20);

      if (error) {
        console.error(error);
        setError('Erreur lors de la recherche.');
      } else {
        setProfiles(data || []);
      }

      setLoading(false);
    }, 400),
    []
  );

  useEffect(() => {
    searchProfiles(query);
  }, [query]);

  // --- Render a single profile row
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.profileCard, { backgroundColor: theme.backgroundColor2, borderColor: theme.borderColorDark }]}
      onPress={() => {
        console.log("PUSH :",item);
        router.push(`/profile/${item.user_id}`)}}
    >
      <Avatar user_id={item.user_id} width={54} height={54}/>
      <View style={styles.profileInfo}>
        <Text style={[styles.username, { color: theme.textColor1 }]}>
          {item.username}
        </Text>
        <Text style={[styles.fullname, { color: theme.textColor2 }]}>
          {item.firstname} {item.lastname}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor1 }]}>
      <Text style={[styles.title, { color: theme.textColor1 }]}>Search a profil</Text>

      <TextInput
        placeholder="Nom, prénom, ou pseudo..."
        placeholderTextColor={theme.inputPlaceholderColor}
        style={[
          styles.input,
          { 
            backgroundColor: theme.inputBGColor,
            color: theme.inputTextColor,
            borderColor: theme.inputBorderColor 
          },
        ]}
        value={query}
        onChangeText={setQuery}
      />

      {loading && (
        <ActivityIndicator
          size="large"
          color={theme.spinnerColor}
          style={{ marginTop: 20 }}
        />
      )}

      {error && !loading && (
        <Text style={[styles.errorText, { color: theme.dangerColor }]}>{error}</Text>
      )}

      {!loading && profiles.length === 0 && query.length >= 2 && !error && (
        <Text style={[styles.noResultText, { color: theme.textColor2 }]}>
          Aucun profil trouvé.
        </Text>
      )}

      <FlatList
        data={profiles}
        keyExtractor={(item) => item.user_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 10 }}
      />
    </View>
  );

}

export default SearchProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderRadius: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
    marginLeft:12,
  },
  username: {
    fontSize: 17,
    fontWeight: '600',
  },
  fullname: {
    fontSize: 14,
    marginTop: 2,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
  },
  noResultText: {
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});