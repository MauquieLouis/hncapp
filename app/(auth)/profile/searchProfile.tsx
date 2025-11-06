import { useUserContext } from "@/contexts/userContext";
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
// import { debounce } from 'lodash';
import { supabase } from '@/libs/initSupabase'; // ⚠️ adapte le chemin à ton projet
import Avatar from "@/components/profile/avatar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Center } from "@/components/ui/center";
import { HStack } from "@/components/ui/hstack";

const SearchProfile = () => {

    const [query, setQuery] = useState('');
    const [profiles, setProfiles] = useState([]);
    const [profilesHistory, setProfilesHistory] = useState<{ user_id: string; username: string; firstname: string; lastname: string; }[]>([]);
    const [loading, setLoading] = useState(false);
    const [tError, setTError] = useState<string | null>(null);

    const { theme, profile } = useUserContext();
    const router = useRouter();

    useEffect(() => {
        getProfilesHistory();
        searchProfiles(query);
    }, [query]);

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
        try{

        if (!text || text.length < 2) {
        setProfiles([]);
        return;
        }

        setLoading(true);
        setTError(null);

        const { data, error } = await supabase
        .rpc('search_profiles_fulltext_unaccent', { q: text });
        // .from('profiles')
        // .select('user_id, username, firstname, lastname, profile_picture_url')
        // .or(`username.ilike.%${text}%, firstname.ilike.%${text}%, lastname.ilike.%${text}%`)
        // .limit(20);

        if (error) {
        console.error("Error when trying to searc \
             profiles with rpc function search_profile_fulltext_unaccent in searchProfile function in searchProfile.tsx",error);
        setTError('Erreur lors de la recherche.');
        } else {
            console.log("DATA", data);
        setProfiles(data || []);
        }
        }catch(error: unknown){
            console.error("Error in searchProfile usecallback in searchProfile.tsx", error);
        }finally{
            setLoading(false);
        }
    }, 400),
    []
    );

    const addToHistory = async(visited_user_id: string) => {
        try{
            const { data, error } = await supabase.from('profiles_history')
            .upsert([{
                user_id:profile.user_id,
                visited_profile_user_id:visited_user_id,
                updated_at: new Date().toISOString(),
            }], {
                onConflict: 'user_id,visited_profile_user_id' // colonne(s) uniques définies
            }).select();
            if(error){
                console.error("Error when inserting new history in profile in addToHistory Function in searchProfile.tsx", error);
            }
        }catch(error: unknown){
            console.error('Error adding history, in addToHistory function in searchProfile.tsx', error);
        }
    }

    const flattenProfileHistory = (history: any[]) => {
        return history.map(item => ({
            user_id: item.visited_profile_user_id,
            username: item.visited_profile.username,
            firstname: item.visited_profile.firstname,
            lastname: item.visited_profile.lastname
        }));
    }

    const getProfilesHistory = async() => {
        try{
            //Enregistrer en local le profile history, et faire seulement un fetch des IDs pour comparer avec
            // ceux en local et éviter de refetch tous les profiles tout le temps.
            const { data, error } = await supabase.from('profiles_history')
                .select(`
                    id,
                    user_id,
                    visited_profile_user_id,
                    created_at,
                    visited_profile:visited_profile_user_id (
                    username,
                    firstname,
                    lastname
                    )
                `)
                .eq('user_id', profile.user_id)
                .order('updated_at', { ascending: false });
            if(error){
                console.error("Error when fetching profiles_history in supabase in getProfilesHistory function in searchProfile.tsx", error);
            }else{
                console.log("GET PROFILE HISTORY :", data);
                setProfilesHistory(flattenProfileHistory(data) || []);
            }
        }catch(error: unknown){
            console.error("Error when getting profiles history in getProfilehistory function in searchProfile.tsx", error);
        }
    }

    const deleteFromHistory = async (visited_user_id: string) => {
        try{
            const { data, error } = await supabase.from('profiles_history')
            .delete().eq('visited_profile_user_id', visited_user_id);

            if(error){
                console.error("Error when deleting from profiles_history in deleteFromHistory in searchProfile.tsx", error);
            }else{
                setProfilesHistory(prevHistory =>
                    prevHistory.filter(profile => profile.user_id !== visited_user_id)
                );
            }

        }catch(error: unknown){
            console.error("Error deleting history in deleteFromHistory in searchProfile.tsx", error);
        }
    }

    // --- Render a single profile row
    const renderItem = ({ item }) => (
    <TouchableOpacity
        style={[styles.profileCard, { backgroundColor: theme.backgroundColor2, borderColor: theme.borderColorDark }]}
        onPress={() => {
        console.log("PUSH :",item);
        addToHistory(item.user_id);
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
        {query.length == 0 || query.trim().length == 0 ?
            <TouchableOpacity onPress={() => {
                deleteFromHistory(item.user_id);
            }}>
                <View style={{flexDirection:"row-reverse", position:"absolute", right:10, bottom:12, justifyContent:"center", alignItems:"center"}}>
                        <Ionicons name="close" size={24} color={theme.iconColor}/>
                </View>
            </TouchableOpacity>
            :
            <></>
        }
        </View>
    </TouchableOpacity>
    );

    return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor1 }]}>
        <Text style={[styles.title, { color: theme.textColor1 }]}>Search a profile</Text>

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

        {tError && !loading && (
        <Text style={[styles.errorText, { color: theme.dangerColor }]}>{tError}</Text>
        )}

        {!loading && profiles.length === 0 && query.length >= 2 && !tError && (
        <Text style={[styles.noResultText, { color: theme.textColor2 }]}>
            Aucun profil trouvé.
        </Text>
        )}
        {query.trim().length == 0 || query.length == 0 ? 
            <FlatList
            data={profilesHistory}
            keyExtractor={(item) => item.user_id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 10 }}
            />
        :
            <FlatList
            data={profiles}
            keyExtractor={(item) => item.user_id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 10 }}
            />
        }
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