import { useState } from 'react';
import React, { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useUserContext } from '@/contexts/userContext';
import { useEffect } from 'react';
import { Box } from '@/components/ui/box';
import Avatar from '@/components/profile/avatar';
import { HStack } from '@/components/ui/hstack';
import { supabase } from '@/libs/initSupabase';
import { Spinner } from '@/components/ui/spinner';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileId() {

    const [profileDisplayed, setProfileDisplayed] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [ friendsNumber, setFriendsNumber ] = useState<number>(0);
    const [ followersNumber, setFollowersNumber ] = useState<number>(0);
    const [ areFiends, setAreFriends ] = useState<boolean>(false);

    const { profile } = useUserContext();
    const { profileId } = useLocalSearchParams();

    const ICON_SIZE = 32;

    useEffect(() => {
      if(profile.user_id == profileId){
        setProfileDisplayed(profile);
        setAreFriends(true);
      }else{
        getRemoteProfile();
        checkFriendship(profileId);
        //Fetch the profile from the database
      }
    }, []);

    const getRemoteProfile = async () => {
      try{
        setLoading(true);
        const { data: profiles, error: profiles_error } = await supabase.from("profiles").select("*").eq("user_id", profileId);
        if(profiles_error){
          console.log("Error whent fetching profiles in getAllProfiles Function in profileList.tsx :", profiles_error);
        }else{
          console.log("Profiles: ", profiles);
          setProfileDisplayed(profiles[0]);

        }
      }catch(e){
        console.log("Error fetching profiles in profileList.tsx :", e);
      }finally{
        setLoading(false);
      }
    }

    const getFriendsAndFollowerNumber = async () => {
      try{
        setLoading(true);
        const { data: friends, error: friends_error } = await supabase
          .from('friends')
          .select(`
            *,
            friend: user_id_1 (username, id), 
            friend_alt: user_id_2 (username, id)
          `)
          .or(`user_id_1.eq.${profileDisplayed.user_id},user_id_2.eq.${profileDisplayed.user_id}`)
          .eq('status', 'accepted');
        if(friends_error){
          console.log("Error whent fetching friends in getFriendsAndFollowerNumber Function in profileList.tsx :", friends_error);
        }else{
          console.log("Friends: ", friends);
          setFriendsNumber(friends.length);
        }
        const { data: followers, error: followers_error } = await supabase.from("followers").select("*").eq("following", profileDisplayed.user_id);
        if(followers_error){
          console.log("Error whent fetching followers in getFriendsAndFollowerNumber Function in profileList.tsx :", followers_error);
        }else{
          console.log("Followers: ", followers);
          setFollowersNumber(followers.length);
        }
      }catch(e){
        console.log("Error fetching friends and followers in profileList.tsx :", e);
      }
      finally{
        setLoading(false);
      }
    }
  
    const checkFriendship = async (profile_to_check: any) => {
      try{
        if(profile.user_id == profile_to_check.user_id || profile_to_check == null) return;

        const { data, error } = await supabase
          .from('friends')
          .select('*')
          .or(`and(user_id_1.eq.${profile.user_id},user_id_2.eq.${profile_to_check.user_id}),and(user_id_1.eq.${profile_to_check.user_id},user_id_2.eq.${profile.user_id})`)
          .eq('status', 'accepted')
          .maybeSingle(); // or .maybeSingle() if it might not exist | originally .single()
          console.log("Check friendship data: ", data);
        if(data){
          setAreFriends(true);
        }else{
          setAreFriends(false);
        } 
      }catch(error: unknown){
        console.error("Error in checkFriendship function in profileId.tsx", error);
      }finally{

      }
    }

  return (
    <>
      {loading ? <Spinner/> :
      <Box style={[styles.container, {/*borderColor:"blue", borderWidth:1*/}]}>

        <Box style={{/*borderColor:"red", borderWidth:1,*/ flex:3, alignItems:"center", justifyContent:"center"}}>
          <HStack >
            <Box style={{/*borderColor:"orange", borderWidth:1,*/ justifyContent:"flex-end", flex:3, alignItems:"center"}}>
              <Text style={{color:"white"}}> {friendsNumber}</Text>
              <Text style={{color:"white"}}> FRIENDS</Text>
            </Box>
            <Box style={{/*borderColor:"orange", borderWidth:1,*/ flex:4, alignItems:"center", justifyContent:"center"}}>
              <Avatar width={150} height={150}/>
            </Box>
            <Box style={{/*borderColor:"orange", borderWidth:1,*/ justifyContent:"flex-end", flex:3, alignItems:"center"}}>
              <Text style={{color:"white"}}> {followersNumber}</Text>
              <Text style={{color:"white"}}>FOLLOWERS</Text>
            </Box>
          </HStack>
          <Box style={{/*borderColor:"cyan", borderWidth:1*/}}>
            <Text style={{color:"white", fontSize:22}}>{profileDisplayed ? profileDisplayed.username: "..."}</Text>
          </Box>
          <Box style={{borderBottomColor:"white", borderBottomWidth:1, width:"340"}}></Box>
        </Box>
        <Box style={{/*borderColor:"green", borderWidth:1,*/ flex:7, alignItems:"center", justifyContent:"center", width:"100%"}}>
          {areFiends ? <></>:
          <>
            <HStack style={{
              /*borderColor:"red", borderWidth:1, */
              flex:2, 
              alignItems:"center", 
              justifyContent:"space-around",
              width:"100%",
              backgroundColor:"#25292e",
            }}
            space="sm"
            >
              <Box style={{/*borderColor:"cyan", borderWidth:1*/}}>
                <TouchableOpacity 
                  style={{borderColor:"grey", borderWidth:2, padding:15, borderRadius:10}} 
                  onPress={() => {
                  }}>
                  {/* <Text style={{color:"white"}}>Ask Friend</Text> */}
                  <Ionicons name="person-add-outline" size={ICON_SIZE} color="white" />
                </TouchableOpacity>
              </Box>
              <Box style={{/*borderColor:"cyan", borderWidth:1*/}}>
                <TouchableOpacity 
                  style={{borderColor:"grey", borderWidth:2, padding:15, borderRadius:10}}
                  onPress={() => {
                  }}>
                  {/* <Text style={{color:"white"}}>Follow request</Text> */}
                  <Ionicons name="people-outline" size={ICON_SIZE} color="white" />
                </TouchableOpacity>
              </Box>
              <Box style={{/*borderColor:"cyan", borderWidth:1*/}}>
                <TouchableOpacity 
                  style={{borderColor:"grey", borderWidth:2, padding:15, borderRadius:10}}
                  onPress={() => {
                  }}>
                  <Ionicons name="chatbubbles-outline" size={ICON_SIZE} color="white" />
                  {/* <Text style={{color:"white"}}>3</Text> */}
                </TouchableOpacity>
              </Box>
            </HStack>
            <Box style={{/*borderColor:"green", borderWidth:1, */
              flex:6, 
              width:"100%",
              backgroundColor:"#25292e", justifyContent:"center", alignItems:"center"}}>
                <Ionicons name="lock-closed-outline" size={54} color="white" />
                <Text style={{color:"white"}}>Private Account</Text>
              </Box>
          </>
          }
          <Link href="/" style={styles.button}>
          {/* <Link href="/conversations/conversationsList" style={styles.button}> */}
            Go back to index!
          </Link>

        </Box>
      </Box>
  }
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
