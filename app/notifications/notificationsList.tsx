import { useState } from 'react';
import React, { View, StyleSheet, Text, FlatList, TouchableOpacity } from 'react-native';
import { Link, Stack, useRouter } from 'expo-router';
import { useUserContext } from '@/contexts/userContext';
import { useEffect } from 'react';
import { Box } from '@/components/ui/box';
import Avatar from '@/components/profile/avatar';
import { HStack } from '@/components/ui/hstack';
import { supabase } from '@/libs/initSupabase';
import { Spinner } from '@/components/ui/spinner';
import { VStack } from '@/components/ui/vstack';
import { Button } from '@/components/ui/button';
import { Ionicons } from '@expo/vector-icons';
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalHeader } from '@/components/ui/modal';
import NotificationFriendOrFollowRequest from '@/components/notifications/notificationFriendOrFollowRequest';
import NotificationCommentOrLike from '@/components/notifications/notificationCommentOrLike';

export default function NotificationsList() {

  
  const [ notificationsList, setNotificationsList ] = useState<any[]>([]);
  const [ loading, setLoading ] = useState<boolean>(false);
  const [ showNotifModal, setShowNotifModal ] = useState<boolean>(false);
  const [ displayNotif, setDisplayNotif ] = useState<any>(null);

  const router = useRouter();
  const { profile, theme } = useUserContext();

  const closeNotifModal = ( ) => {
    setDisplayNotif(null);
    setShowNotifModal(false);
  }

  useEffect(() => {
      // console.log("Notifs List: ", profile);
      getAllNotifications();
  }, []);

  useEffect(() => { console.log(" displayNotif ", displayNotif)}, [ displayNotif]);

  const getAllNotifications = async () => {
    try{
        setLoading(true);
        console.log(profile.user_id);
        const { data: notifications, error: notifications_error } = await supabase
          .rpc('get_notifications_with_actor_info', {
            p_recipient_id: "0ea25b59-40fb-448a-ab5d-b9b72c419130",
          });
        // const { data: notifications, error: notifications_error } = await supabase.from("notifications").select("*").eq("recipient_id", profile.user_id);
        if(notifications_error){
          console.error("Error whent fetching notifications in getAllNotifications Function in notificationsList.tsx :", notifications_error);
        }
        if(notifications){
          console.log("Notifications: ", notifications);
          setNotificationsList(notifications);
        }
    }catch(error: unknown){
        console.error("Error in getAllNotifications in notificationsList.tsx :", error);
    }finally{
        setLoading(false);
    }
  }

  
  const renderItem = ({ item }: { item: any }) => {
    if(item.type === "friend_request" || item.type === "follow_request"){
      return (
        <NotificationFriendOrFollowRequest
          notification={item}
          setShowNotifModal={setShowNotifModal}
          setDisplayNotif={setDisplayNotif}
        />
      );
    }
    if(item.type === "commented" || item.type === "post_liked"){
      return (
        <NotificationCommentOrLike
          notification={item}
          setShowNotifModal={setShowNotifModal}
          setDisplayNotif={setDisplayNotif}
        />
      );
    }
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    button: {
      fontSize: 16,
      textDecorationLine: 'underline',
      color: '#fff',
    },
  });

  return (
    <>
      <Box style={[styles.container, {/*borderColor:"blue", borderWidth:1*/}]}>
        <Box style={{/*borderColor:"green", borderWidth:1,*/ flex:10, width:"100%"}}>
          {loading ? <Spinner/> :
          <FlatList
          data={notificationsList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
            />
          }
        </Box>
        <Box style={{/*borderColor:"red", borderWidth:1,*/ flex:1, alignItems:"center", justifyContent:"center"}}>
          <Link href="/" style={styles.button}>
          {/* <Link href="/conversations/conversationsList" style={styles.button}> */}
            Go back to index!
          </Link> 
        </Box>
      </Box>
    </>
  );
}


