import { useState } from 'react';
import React, { View, StyleSheet, Text, FlatList, TouchableOpacity } from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { useUserContext } from '@/contexts/userContext';
import { useEffect } from 'react';
import { Box } from '@/components/ui/box';
import Avatar from '@/components/profile/avatar';
import { HStack } from '@/components/ui/hstack';
import { supabase } from '@/libs/initSupabase';
import { Spinner } from '@/components/ui/spinner';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileList() {

  
  const [ profileList, setProfileList ] = useState<any[]>([]);
  const [ loading, setLoading ] = useState<boolean>(false);

  const router = useRouter();
  const { profile } = useUserContext();
  const { type } = useLocalSearchParams();

  useEffect(() => {
      console.log("Profile List: ", profile);
      if(type === "all"){
        console.log("Fetching all profiles");
        getAllProfiles();
      }else if(type === "follower_id" || type === "following_id"){
        console.log("Type: ", type);
        getFollowProfiles();
        //Fetch follower or following
      }if(type === "friends"){
        console.log("Fetching friends list");
        getFriendsList();
      }
  }, []);

  const getAllProfiles = async () => {
    try{
      setLoading(true);
      const { data: profiles, error: profiles_error } = await supabase.from("profiles").select("*").not("id", "eq", profile.id);
      if(profiles_error){
        console.log("Error whent fetching profiles in getAllProfiles Function in profileList.tsx :", profiles_error);
      }else{
        console.log("Profiles: ", profiles);
        setProfileList(profiles);
      }
    }catch(e){
      console.log("Error fetching profiles in profileList.tsx :", e);
    }finally{
      setLoading(false);
    }
  }

  const getFollowProfiles = async () => {
    try{
      setLoading(true);
      const { data, error } = await supabase.rpc('get_follow_profiles', {
        input_user_id: profile.user_id,
        follow_type: type // or 'following'
      });
      if (error) {
        console.error('Error when fetching followers in getFollowProfiles in profileList.tsx:', error);
      } else {
        console.log('Followers with profile data:', data);
        setProfileList(data);
      }
    }catch(e){
      console.error("Error in getFollowProfiles function", e);
    }finally{
      setLoading(false);
    }
  }

  const getFriendsList = async () => {
    try{
      setLoading(true);
      const { data, error } = await supabase.rpc('get_friends_profiles', {
        input_user_id: profile.user_id,
      });

      if (error){
        console.error('Error when fetching friends in getFriendsList function in profileList.tsx', error);
      }else{
        console.log("Friends :",data);
        setProfileList(data);
      } 
    }catch(e){
      console.error("Error in getFriendsList function", e);
    }finally{
      setLoading(false);
    }
  }

  return (
    <>
      <Box style={[styles.container, {/*borderColor:"blue", borderWidth:1*/}]}>

        <Box style={{/*borderColor:"green", borderWidth:1,*/ flex:10, width:"100%"}}>
          {loading ? <Spinner/> :
          <FlatList
          data={profileList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => router.push(`/profile/${item.user_id}`)}
              style={{/*borderColor:"red", borderWidth:1,*/ flexDirection:"row", alignItems:"center", justifyContent:"flex-start", padding:10, borderBottomColor:"white", borderBottomWidth:1, width:"90%", marginLeft:"5%"}}>
                <Avatar/>
                <Text style={{color:"white", paddingLeft:15, fontSize:20}}>
                  {item.username} - {item.firstname} {item.lastname}
                </Text>
                {type === "follower_id" || type === "following_id" ? <TouchableOpacity>
                  <Ionicons name="trash-outline" size={24} color="rgba(180,60,60,0.6)" style={{marginLeft:20}}/>
                </TouchableOpacity>:<></>}
              </TouchableOpacity>
            )}
            />
          }
        </Box>
        <Box style={{/*borderColor:"red", borderWidth:1,*/ flex:1, alignItems:"center", justifyContent:"center"}}>
          <Text style={{color:"white"}}>Profile List here .</Text>
          <Link href="/" style={styles.button}>
          {/* <Link href="/conversations/conversationsList" style={styles.button}> */}
            Go back to index!
          </Link> 
        </Box>
      </Box>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },

  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
});
