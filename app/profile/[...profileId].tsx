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
import { useRouter } from 'expo-router';

import { insertNotification, unsendNotification } from '@/components/notifications/notificationSender';
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalHeader } from '@/components/ui/modal';
import { VStack } from '@/components/ui/vstack';
import ChangeAvatar from '@/components/profile/changeAvatar';
import PostsList from '@/components/profile/postsList';

export default function ProfileId() {

    const [ profileDisplayed, setProfileDisplayed ] = useState<any>(null);
    const [ loading, setLoading ] = useState<boolean>(false);
    const [ friendsNumber, setFriendsNumber ] = useState<number>(0);
    const [ followersNumber, setFollowersNumber ] = useState<number>(0);
    const [ areFriends, setAreFriends ] = useState<boolean>(false);
    const [ canRequestFriendship, setCanRequestFriendship ] = useState<boolean>(true);
    const [ isMyProfile, setIsMyProfile ] = useState<boolean>(false);
    const [ conversationId, setConversationId ] = useState<string | null>(null);
    const [ settingsModal, setSettingModal ] = useState<boolean>(false);

    const { profile, theme } = useUserContext();
    const { profileId } = useLocalSearchParams();
    const router = useRouter();

    const ICON_SIZE = 32;

    const closeSettingsModal = () => {
      setSettingModal(false);
    }

    useEffect(() => {
      if(profile.user_id == profileId){
        setProfileDisplayed(profile);
        setAreFriends(true);
        setIsMyProfile(true);
      }else{
        getRemoteProfile();
        checkFriendship(profileId);
        getOneOnOneConversation(profile.user_id, profileId);
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
        const { data: friends, error: friends_error } = await supabase
          .from('friends')
          .select(`
            *
          `)
          .or(`user_id_1.eq.${profileId},user_id_2.eq.${profileId}`)
          .eq('status', 'accepted');
        if(friends_error){
          console.error("Error whent fetching friends in getFriendsAndFollowerNumber Function in profileList.tsx :", friends_error);
        }else{
          setFriendsNumber(friends.length);
        }
        const { data: followers, error: followers_error } = await supabase.from("followers").select("*").eq("following_id", profileId);
        if(followers_error){
          console.error("Error whent fetching followers in getFriendsAndFollowerNumber Function in profileList.tsx :", followers_error);
        }else{
          setFollowersNumber(followers.length);
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

  async function getOneOnOneConversation(userId1: any, userId2:any) {
    try{

      const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        conversation_participants!inner(
          user_id,
          deleted_at
          )
          `)
      .eq('is_group', false)
      .in('conversation_participants.user_id', [userId1, userId2])
      .is('conversation_participants.deleted_at', null);
      
      if (error) {
        console.error('Error fetching conversations:', error);
        return null;
      }
      
      // Filter to only include conversations with exactly 2 distinct, active participants
      const filteredConversations = data.filter(convo => {
        if(convo.conversation_participants.length == 2){
          setConversationId(convo.id);
        }

        // const participantIds = convo.conversation_participants.map(p => p.user_id);
        // const uniqueParticipants = [...new Set(participantIds)];
        // return uniqueParticipants.length === 2 &&
        // uniqueParticipants.includes(userId1) &&
        // uniqueParticipants.includes(userId2);
      });


    }catch (error: unknown) {
      console.error('Error in getOneOnOneConversation function in [...profileId].tsx file:', error);
    }finally{

    }
    // return filteredConversations.length ? filteredConversations[0] : null;
  }

  const changeFriendProfilePicture = async () => {
    try{

    }catch(error: unknown) {

    }
  }

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
    flex:3, alignItems:"center", justifyContent:"center"
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
    borderBottomColor:"white", borderBottomWidth:1, width:"90%",marginLeft:'5%'
  }
});

  const settingsIconColor = theme.iconColor2;

  return (
    <>
      {loading ? <Spinner/> :
      <Box style={[styles.container, {}]}>

        <Box style={styles.container2}>
          <HStack >
            <Box style={{/*borderColor:"orange", borderWidth:1,*/ justifyContent:"flex-end", flex:3, alignItems:"center"}}>
              <TouchableOpacity onPress={() => {router.push({pathname: "/profile/profileList", params: { type : "friends"}});}}>
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
                  router.push("/profile/settings");
                }}
                style={styles.settingsStyle}>
                  <Ionicons name="settings-outline" size={ICON_SIZE} color={settingsIconColor} />
                </TouchableOpacity>
              :
              <>
                { areFriends ? 
                  <ChangeAvatar userId={profileDisplayed.user_id} added_by={profile.user_id}/>
                :
                  <></> 
                }
              </>
              }
            </Box>
            <Box style={{/*borderColor:"orange", borderWidth:1,*/ justifyContent:"flex-end", flex:3, alignItems:"center"}}>
              <Text style={styles.text}> {followersNumber}</Text>
              <Text style={styles.text}>FOLLOWERS</Text>
            </Box>
          </HStack>
          <Box style={{/*borderColor:"cyan", borderWidth:1*/}}>
            <Text style={[styles.userNameText]}>{profileDisplayed ? profileDisplayed.username: "..."}</Text>
          </Box>
          <Box style={styles.bottomLine}></Box>
        </Box>
        <Box style={{/*borderColor:"green", borderWidth:1,*/ flex:7, alignItems:"center", justifyContent:"center", width:"100%"}}>
          {areFriends ? <>
            {isMyProfile ? <></>
              :
              <>
                <HStack style={{
                  /*borderColor:"red", borderWidth:1, */
                  flex:2, 
                  alignItems:"center", 
                  justifyContent:"space-between",
                  width:"100%",
                  paddingLeft:"6%",
                  paddingRight:"6%",
                  backgroundColor:"#25292e",
                }} >
                  <Box>
                    <TouchableOpacity 
                      style={{borderColor:"grey", borderWidth:2, padding:15, borderRadius:10}} 
                      onPress={() => {
                        router.push(`/conversations/${conversationId}`)
                      }}>
                      <HStack>
                        <Ionicons name="chatbubbles-outline" size={ICON_SIZE-16} color="white" />
                        <Text style={{color:"white", paddingLeft:6}}>Open Discussion</Text>
                      </HStack>
                    </TouchableOpacity>
                  </Box>
                  <Box>
                    <TouchableOpacity 
                      style={{borderColor:"grey", borderWidth:2, padding:15, borderRadius:10}} 
                      onPress={() => {
                        router.push({pathname: "/profile/createPost", params: { poster_id: profile.user_id, user_id: profileId }});
                      }}>
                      <HStack>
                        <Ionicons name="flask-outline" size={ICON_SIZE-16} color="white" />
                        <Text style={{color:"white", paddingLeft:6}}>Post For Friend</Text>
                      </HStack>
                    </TouchableOpacity>
                  </Box>
                </HStack>
              </>
            }
            <Box style={{flex:10, width:"100%"}}>
              <PostsList height={"100%"} user_id={profileDisplayed.user_id as string} folder_url={profileId as string}/>

            </Box>

          </>:
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
                    sendOrUnsedFriendRequest()
                  }}>
                  {/* <Text style={{color:"white"}}>Ask Friend</Text> */}
                  {canRequestFriendship ? 
                  <Ionicons name="person-add-outline" size={ICON_SIZE} color="white" />
                  :
                  <Ionicons name="close-circle-outline" size={ICON_SIZE} color="white" />
                  }
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
          {/* <Link href="/" style={styles.button}>
            Go back to index!
          </Link> */}

        </Box>
      </Box>
  }
    <Modal isOpen={settingsModal} onClose={() => closeSettingsModal()}>
      <ModalHeader>
        <ModalCloseButton />
      </ModalHeader>
      <ModalBackdrop />
      <ModalContent style={{backgroundColor:"rgba(170,170,170,0.8)"}}>
        <VStack style={{padding:10, width:"100%"}} space='2xl'>
            <TouchableOpacity onPress={() =>{ router.push({pathname: "/profile/profileList", params: { type : "following_id"}}); closeSettingsModal(); }} style={{}}>
              <HStack style={{alignItems:"center"}}>
                
                <Ionicons name="people-circle-outline" size={ICON_SIZE} color="white" />
                <Text>Following list</Text>  
              </HStack>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {router.push({pathname: "/profile/profileList", params: { type : "follower_id"}}); closeSettingsModal(); }} style={{}}>
              <HStack style={{alignItems:"center"}}>
                <Ionicons name="people-outline" size={ICON_SIZE} color="white" />
                <Text>Follower list</Text>  
              </HStack>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => console.info(" ***--- TODO ---***")} style={{}}>
              <HStack style={{alignItems:"center"}}>
                <Ionicons name="trash-outline" size={ICON_SIZE} color="white" />
                <Text>Delete Account</Text>  
              </HStack>
            </TouchableOpacity>
          
        </VStack>
      </ModalContent>
    </Modal>
    </>
  );
}

