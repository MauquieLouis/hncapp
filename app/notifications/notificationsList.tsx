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

export default function NotificationsList() {

  
  const [ notificationsList, setNotificationsList ] = useState<any[]>([]);
  const [ loading, setLoading ] = useState<boolean>(false);
  const [ showNotifModal, setShowNotifModal ] = useState<boolean>(false);
  const [ displayNotif, setDisplayNotif ] = useState<any>(null);

  const router = useRouter();
  const { profile } = useUserContext();

  useEffect(() => {
      // console.log("Notifs List: ", profile);
      getAllNotifications();
  }, []);

  const getAllNotifications = async () => {
    try{
        setLoading(true);
        const { data: notifications, error: notifications_error } = await supabase
          .rpc('get_notifications_with_actor_info', {
            recipient_id: profile.user_id,
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

  const getNotifToDisplay = async (notif: any) => {
    try{
      if(notif.type === "friend_request"){
        //Get the firend request details
      }
      if(notif.type === "follow_request"){
        //Get the follow request details
      }

    }catch(error:unknown){
      console.error("Error in getNotifToDisplay in notificationsList.tsx :", error);
    }
  }

  return (
    <>
      <Box style={[styles.container, {/*borderColor:"blue", borderWidth:1*/}]}>
        <Text style={{color:"white"}}>TEST</Text>
        <Box style={{/*borderColor:"green", borderWidth:1,*/ flex:10, width:"100%"}}>
          {loading ? <Spinner/> :
          <FlatList
          data={notificationsList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
            onPress={() => {setShowNotifModal(true);}}
              style={{/*borderColor:"red", borderWidth:1,*/ flexDirection:"row", alignItems:"center", justifyContent:"flex-start", padding:10, borderBottomColor:"white", borderBottomWidth:1, width:"90%", marginLeft:"5%"}}>
                <Avatar/>
                <VStack style={{flex:1, paddingLeft:10}}>
                <Text style={{color:"white", paddingLeft:15, fontSize:20}}>
                  {item.type}
                </Text>
                <Text style={{color:"white", paddingLeft:15, fontSize:14}}>
                  {item.username}
                </Text>
                </VStack>
                <Ionicons name="information-circle-outline" size={36} color="white" style={{marginLeft:0}} />
                <Modal isOpen={showNotifModal} onClose={() => setShowNotifModal(false)} style={{width:"100%", height:"100%"}}>
                  <ModalBackdrop/>
                  <ModalContent>
                    <ModalHeader>
                      <ModalCloseButton></ModalCloseButton>
                    </ModalHeader>
                      {/* <Button onPress={() => console.log("Notification pressed")}>View</Button> */}
                      <TouchableOpacity style={{backgroundColor:"rgba(70,127,70,0.5)", borderRadius:10, padding:2, marginRight:5}}>
                        <Ionicons name="checkbox-outline" size={36} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity style={{backgroundColor:"rgba(127,70,70,0.5)", borderRadius:10, padding:2}}>
                        <Ionicons name="close-circle-outline" size={36} color="white" />
                      </TouchableOpacity>
                  </ModalContent>
                </Modal>
              </TouchableOpacity>
            )}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },

  button: {
    fontSize: 16,
    textDecorationLine: 'underline',
    color: '#fff',
  },
});
