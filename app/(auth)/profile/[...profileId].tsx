import { useContext, useRef, useState } from 'react';
import React, { View, StyleSheet, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useUserContext } from '@/contexts/userContext';
import { useEffect } from 'react';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { supabase } from '@/libs/initSupabase';
import { Spinner } from '@/components/ui/spinner';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { insertNotification, unsendNotification } from '@/components/notifications/notificationSender';
import ChangeAvatar from '@/components/profile/changeAvatar';
import Avatar from '@/components/profile/avatar';
import PostsList from '@/components/profile/postsList';
import { useAutoRefreshSignedUrls } from '@/utils/useAutoRefreshSignedUrls';
import TopTabLayout from '@/components/profile/topTab/_layout';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useHeaderHeight } from '@react-navigation/elements';
import { usePostStore } from '@/contexts/store';

export default function ProfileId() {

    const [ profileDisplayed, setProfileDisplayed ] = useState<any>(null);
    const [ loading, setLoading ] = useState<boolean>(false);
    const [ friendsNumber, setFriendsNumber ] = useState<number>(0);
    const [ followersNumber, setFollowersNumber ] = useState<number>(0);
    const [ areFriends, setAreFriends ] = useState<boolean>(false);
    const [ canRequestFriendship, setCanRequestFriendship ] = useState<boolean>(true);
    const [ isMyProfile, setIsMyProfile ] = useState<boolean>(false);
    const [ conversationId, setConversationId ] = useState<string | null>(null);

    const { profile, theme, user } = useUserContext();
    const { profileId } = useLocalSearchParams();
    const router = useRouter();
    const { username, setUsername } = usePostStore();

    // useAutoRefreshSignedUrls()
    const ICON_SIZE = 28;

    useEffect(() => {
      if(profile.user_id == profileId){
        setProfileDisplayed(profile);
        setAreFriends(true);
        setIsMyProfile(true);
        setUsername(profile.username);
      }else{
        getRemoteProfile();
        checkFriendship(profileId);
        checkForConversationExistence(profile.user_id, profileId);
        //Fetch the profile from the database
      }
      getFriendsAndFollowerNumber(profileId);
    }, []);

    const getRemoteProfile = async () => {
      try{
        setLoading(true);
        const { data: profiles, error: profiles_error } = await supabase.from("profiles").select("*").eq("user_id", profileId);
        if(profiles_error){
          console.error("Error whent fetching profiles in getAllProfiles Function in profileList.tsx :", profiles_error);
        }else{
          setUsername(profiles[0].username);
          setProfileDisplayed(profiles[0]);
        }
      }catch(e){
        console.error("Error fetching profiles in profileList.tsx :", e);
      }finally{
        setLoading(false);
      }
    }

    const getFriendsAndFollowerNumber = async (profileId: any) => {
      try{
        setLoading(true);
        const { data: friends, error: friends_error } = await supabase.rpc('get_social_counts',
          { uid: profileId[0] }
        );
        if(friends_error){
          console.error("Error when fetching friends in getFriendsAndFollowerNumber Function in profileList.tsx :", friends_error);
        }else{
          setFriendsNumber(friends[0].friends_count);
          setFollowersNumber(friends[0].followers_count);
        }
      }catch(e){
        console.error("Error fetching friends and followers in getFriendsAndFollowerNumber function in profileList.tsx :", e);
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
          .or(`and(user_id_1.eq.${profile.user_id},user_id_2.eq.${profile_to_check}),and(user_id_1.eq.${profile_to_check},user_id_2.eq.${profile.user_id})`)
          // .eq('status', 'pending')
          .maybeSingle(); // or .maybeSingle() if it might not exist | originally .single()
        if(error){
          console.error("Error checking friendship in checkFriendship function in profileId.tsx", error);
        }
        if(data){
          if(data.status == "accepted"){
            setAreFriends(true);
          }else if(data.status == "pending"){
            setCanRequestFriendship(false);
            setAreFriends(false);
          }else if(data.status == "blocked"){
            setCanRequestFriendship(false);
            setAreFriends(false);
          }
        }else{
          setAreFriends(false);
        } 
      }catch(error: unknown){
        console.error("Error in checkFriendship function in profileId.tsx", error);
      }finally{

      }
    }

  const sendOrUnsedFriendRequest = async () => {
    try{
      if(!canRequestFriendship){
        //Unsend the friend request
        const { data, error } = await supabase
          .from('friends')
          .delete()
          .eq('user_id_1', profile.user_id)
          .eq('user_id_2', profileDisplayed.user_id).select();
        if (error) {
          console.error('Error when unsending friend request in sendOrUnsendFriendRequest function in app/profile/[...profieId].tsx :', error);
        }
        //unsend notification
        const { data: unsend_data, error: unsend_error} = await unsendNotification({
          recipient_id: profileDisplayed.user_id, actor_id: profile.user_id, type:'friend_request'});
        if(unsend_error){
          console.error("Error when unsending notification in sendOrUnsedFriendRequest function in profileId.tsx", unsend_error);
        }
        setCanRequestFriendship(true);
        return;
      }
      const { data, error } = await supabase
        .from('friends')
        .insert([
          { user_id_1: profile.user_id, user_id_2: profileDisplayed.user_id, status: 'pending' },
        ]).select();
      if (error) {
        console.error('Error when sending friend request in sendOrUnsendFriendRequest function in app/profile/[...profieId].tsx :', error);
      }
      if(data){
        const { data: notif_data, error: notif_error } = await insertNotification({
          recipient_id: profileDisplayed.user_id, 
          actor_id: profile.user_id, 
          type: 'friend_request', 
          object_id: data![0].id
        });
        if(notif_error){
          console.error("Error when inserting notification in sendOrUnsedFriendRequest function in profileId.tsx", notif_error);
        }
      }
      setCanRequestFriendship(false);
    }catch(error: unknown){
      console.error("Error in sendFriendRequest function in profileId.tsx", error);
    }finally{
    }
  }

  const changeFriendProfilePicture = async () => {
    try{

    }catch(error: unknown) {

    }
  }

  const windowHeight = Dimensions.get('window').height;
  const screenHeight = Dimensions.get('screen').height;
  const HEADER_HEIGHT = screenHeight*0.27
  const headerVisible = useSharedValue(1)
  const isScrolling = useSharedValue(false);
  const navigationHeaderHeight = useHeaderHeight();
  // headerVisible.get();

  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
  container2: {
    height:HEADER_HEIGHT, 
    alignItems:"center", 
    justifyContent:"center",
    position:"absolute",
    top:0, 
    left:0,
    width:"100%",
    zIndex:10
  },
  settingsStyle: {
    position:"absolute",
    bottom:2, 
    left:2, 
    borderColor:theme.borderColorDark, 
    borderWidth:2, 
    borderRadius:15, 
    padding:5,
    backgroundColor:theme.dark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)"
  },
  text:{
    color: theme.textColor1,
  },
  userNameText:{
    fontSize: 22,
    color: theme.textColor2,
  },
  bottomLine:{
    borderBottomColor:"white", borderBottomWidth:1, width:"90%",marginLeft:'0%'
  },
  profileButtons: {
    padding:5, 
    borderColor:theme.borderColorLight, 
    borderWidth:2, 
    borderRadius:5
  },
  profileButtonZone: {
    marginBottom:30
  },
  privateZoneStyle: {
    width:"100%",
    backgroundColor:theme.backgroundColor2, 
    justifyContent:"center", 
    alignItems:"center"
  }
});

  const settingsIconColor = theme.iconColor2;

  const checkForConversationExistence = async (user_a: string, user_b:string) => {
    try{
      const { data, error } = await supabase.rpc('check_conversation_exists', {user_a: user_a, user_b: user_b[0]});
      if(error){
        console.error("Error when checking for conversation existence in checkForConversationExistence function in profileId.tsx", error);
      }
      if(data && data.length > 0){
        setConversationId(data[0].id);
      }
    }catch(error: unknown){
      console.error("Error in checkForConversationExistence function in profileId.tsx", error);
    }
  }

  const handleOpenConversation = async () => {
    try{

      if(conversationId){
        //Conversation already exists so open it
        router.push(`/conversations/${conversationId}`);
      }else{
        //Create conversation when open it... Maybe try some lock, if in the biggest hasard, two user are creating the same conversation at the same time.
        const { data: conv_data, error: conv_error } = await supabase.from('conversations').insert(
          { is_group: false, created_by: profile.user_id }
        ).select();
        if(conv_error){
          console.error("Error when creating conversation in handleOpenConversation function in profileId.tsx", conv_error);
        }else{
          const { data: conv_part_data, error: conv_part_error } = await supabase.from('conversation_participants').insert([
            { conversation_id: conv_data![0].id, user_id: profile.user_id },
            { conversation_id: conv_data![0].id, user_id: profileDisplayed.user_id }
          ]);
          if(conv_part_error){
            console.error("Error when inserting conversation participants in handleOpenConversation function in profileId.tsx", conv_part_error);
          }else{
            setConversationId(conv_data![0].id);
            router.push(`/conversations/${conv_data![0].id}`);
          }
        }
      }
    }catch(error: unknown){
      console.error("Error in handleOpenConversation function in profileId.tsx", error);
    }
  }

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: withTiming(headerVisible.value ? 0 : -HEADER_HEIGHT, {duration: 200}) }],
    // opacity: withTiming(headerVisible.value, { duration: 200}),
  }));


  const tabsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: withTiming(headerVisible.value ? 0 : -HEADER_HEIGHT, { duration: 200}),
      },
    ],
  }))

  return (
    <>
      {loading ? <Spinner/> :
      <Box style={[styles.container, {}]}>

        <Animated.View 
          style={[styles.container2, headerAnimatedStyle, {/*borderColor:"red", borderWidth:3*/} ]}
          pointerEvents="box-none"
          >
          <HStack >
            <Box style={{/*borderColor:"orange", borderWidth:1,*/ justifyContent:"flex-end", flex:3, alignItems:"center"}}>
                { isMyProfile ? 
                  <></>
                : 
                  <Box style={[styles.profileButtonZone]}>
                    { areFriends ? 
                      <TouchableOpacity style={[styles.profileButtons]} onPress={() => {
                        setUsername(profileDisplayed.username);
                        router.push({pathname: "/profile/createPost", params: { user_id: profileId }})
                        /*router.push({pathname: "/profile/createPost", params: { poster_id: profile.user_id, user_id: profileId }});*/}}>
                        <Ionicons name={"flask-outline"} size={ICON_SIZE} color={theme.iconColor2}/>
                      </TouchableOpacity>
                    :
                      <TouchableOpacity style={[styles.profileButtons]} onPress={() => {sendOrUnsedFriendRequest()}}>
                        {canRequestFriendship ? 
                        <Ionicons name={"person-add-outline"} size={ICON_SIZE} color={theme.iconColor2}/>
                        :
                        <Ionicons name="close-circle-outline" size={ICON_SIZE} color={theme.iconColor2} />
                        }
                      </TouchableOpacity>
                    }
                  </Box>
                }  
              <TouchableOpacity onPress={() => {router.push({pathname: "/profile/profileList", params: { type : "friends", user_id : profileDisplayed.user_id}});}}>
                <Text style={styles.text}> {friendsNumber}</Text>
                <Text style={styles.text}> FRIENDS</Text>
              </TouchableOpacity>
            </Box>
            <Box style={{/*borderColor:"orange", borderWidth:1,*/ flex:4, alignItems:"center", justifyContent:"center"}}>
              <Avatar width={150} height={150} user_id={profileId as string}/>
              {isMyProfile ? 
                <TouchableOpacity 
                onPress={() => {
                  // setSettingModal(true);
                  router.navigate("/profile/settings");
                }}
                style={styles.settingsStyle}>
                  <Ionicons name="settings-outline" size={ICON_SIZE} color={settingsIconColor} />
                </TouchableOpacity>
              :
              <>
                { areFriends ? 
                  <>
                  {profileDisplayed.user_id && profile.user_id ? 
                    <ChangeAvatar userId={profileDisplayed.user_id} added_by={profile.user_id}/>
                    :<></>}
                  </>
                :
                  <></> 
                }
              </>
              }
            </Box>
            <Box style={{/*borderColor:"orange", borderWidth:1,*/ justifyContent:"flex-end", flex:3, alignItems:"center"}}>
              { isMyProfile ? 
                  <></>
                : 
                  <Box style={[styles.profileButtonZone]}>
                    { areFriends ? 
                      <TouchableOpacity style={[styles.profileButtons]} onPress={() => {handleOpenConversation();}}>
                        <Ionicons name={"chatbubbles-outline"} size={ICON_SIZE} color={theme.iconColor2}/>
                      </TouchableOpacity>
                    :
                      <TouchableOpacity style={[styles.profileButtons]} onPress={() => {console.log("PRESSBTN4")}}>
                        <Ionicons name={"people-outline"} size={ICON_SIZE} color={theme.iconColor2}/>
                      </TouchableOpacity>
                    }
                  </Box>
                }  
              <TouchableOpacity onPress={() => {router.push({pathname: "/profile/profileList", params: { type : "follower_id", user_id : profileDisplayed.user_id}});}}>
                <Text style={styles.text}> {followersNumber}</Text>
                <Text style={styles.text}>FOLLOWERS</Text>
              </TouchableOpacity>
            </Box>
          </HStack>
          <Box style={{/*borderColor:"cyan", borderWidth:1*/}}>
            <Text style={[styles.userNameText]}>{profileDisplayed ? "@"+profileDisplayed.username: "..."}</Text>
          </Box>
          <Box style={styles.bottomLine}></Box>
        </Animated.View>

          {areFriends ? 
            <Box style={{width:"100%", height:screenHeight+navigationHeaderHeight, marginTop:HEADER_HEIGHT}}>
              {/* <PostsList height={"100%"} user_id={profileDisplayed.user_id as string} folder_url={profileId as string}/> */}
              <TopTabLayout 
                headerVisible={headerVisible} 
                headerHeight={HEADER_HEIGHT} 
                tabsAnimatedStyle={tabsAnimatedStyle} 
                isScrolling={isScrolling}
                profileId={profileId[0]}
              />
            
            </Box>
          :
          <>

            <Box style={[styles.privateZoneStyle]}>
              <Ionicons name="lock-closed-outline" size={54} color={theme.iconColor2} />
              <Text style={{color:theme.textColor1}}>Private Account</Text>
            </Box>
          </>
          }
        {/* </Box> */}
      </Box>
  }
    </>
  );
}

