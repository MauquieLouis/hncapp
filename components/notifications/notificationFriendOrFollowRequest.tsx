import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Box } from '@/components/ui/box';
import Avatar from '@/components/profile/avatar';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Ionicons } from '@expo/vector-icons';
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalHeader } from '@/components/ui/modal';
import { useUserContext } from '@/contexts/userContext';
import { supabase } from '@/libs/initSupabase';


const NotifcationFriendOrFollowRequest = ({ notification }: { notification: any; }) => {

    const [ showNotifModal, setShowNotifModal ] = useState<boolean>(false);
    const [ displayNotif, setDisplayNotif ] = useState<any>(null);
    const [ isAccepted, setIsAccepted ] = useState<boolean>(false);
    const [ isDeclined, setIsDeclined ] = useState<boolean>(false);
  
    const { profile } = useUserContext();
  
    const closeNotifModal = ( ) => {
      setDisplayNotif(null);
      setShowNotifModal(false);
    }
    
    useEffect(() => {
      console.log("NotifcationFriendOrFollowRequest: ", notification);
      checkRequestStatus();
    },[])

      const acceptFriendRequest = async () => {
        try{
          const { data, error } = await supabase.from('friends').update({'status': 'accepted'}).eq('id', notification.object_id)
          if(error){
            console.error("Error accepting friend request in acceptFriendRequest function in notificationsList.tsx :", error);
          }
          //Automatically add to the following list
          console.log("Profile id and notification actored id: ", profile.user_id, notification.actor_id);
          const { data: followData, error: followError } = await supabase.from('followers').insert([{
            follower_id: profile.user_id,
            following_id: notification.actor_id,
            status: 'accepted'
          }]);
          const { data: followDataMe, error: followErrorMe } = await supabase.from('followers').insert([{
            follower_id: notification.actor_id,
            following_id: profile.user_id,
            status: 'accepted'
          }]);
          if(followError || followErrorMe){
            console.error("Error adding to following list in acceptFriendRequest function in notificationsList.tsx :", followError, followErrorMe);
          }else{
            console.log("Follow data: ", followData);
            console.log("Follow me data: ", followDataMe);
          }
          setIsAccepted(true);
        }catch(error: unknown){
          console.error("Error in acceptFriendRequest function in notificationsList.tsx :", error);
        }finally{
    
        }
      }
    
      const declineFriendRequest = async () => {
        try{
          const { data, error } = await supabase.from('friends').delete().eq('id', notification.object_id);
          if(error){
            console.error("Error declining friend request in declineFriendRequest function in notificationsList.tsx :", error);
          }
          setIsDeclined(true);
        }catch(error: unknown){
          console.error("Error in declineFriendRequest function in notificationsList.tsx :", error);
        }finally{
    
        }
      }

    const checkRequestStatus = async() => {
      try{
        const { data, error } = await supabase.from("friends").select("status").eq("id",notification.object_id).single();
        console.log("Request status: ", data);
        if(data == null || data.status === null || data === undefined) return;
        if(error){
          console.error("Error fetching request status in checkRequestStatus in NotifcationFriendOrFollowRequest.tsx :", error);
          return;
        }
        if(data){
          if(data.status === "accepted"){
            setIsAccepted(true);
          }
        }
      }catch(error: unknown){
        console.error("Error in checkRequestStatus in NotifcationFriendOrFollowRequest.tsx :", error);
      }finally{

      }
    }

    return(
        <TouchableOpacity
            onPress={() => {setShowNotifModal(true); setDisplayNotif(notification);}}
            style={{ flexDirection:"row", alignItems:"center", justifyContent:"flex-start", padding:10, borderBottomColor:"white", borderBottomWidth:1, width:"90%", marginLeft:"5%"}}>
            <Avatar/>
            <VStack style={{flex:1, paddingLeft:10}}>
            <Text style={{color:"white", paddingLeft:15, fontSize:20}}>
                {notification.type}
            </Text>
            <Text style={{color:"white", paddingLeft:15, fontSize:14}}>
                {notification.username}
            </Text>
            </VStack>
            <Ionicons name="information-circle-outline" size={36} color="white" style={{marginLeft:0}} />
            <Modal isOpen={showNotifModal} onClose={() => closeNotifModal()} style={{width:"100%", height:"100%"}}>
                <ModalBackdrop/>
                <ModalContent style={{backgroundColor:"rgba(170,170,170,0.8)"}}>
                <ModalHeader>
                    <ModalCloseButton></ModalCloseButton>
                </ModalHeader>
                { isAccepted ? 
                    <VStack>
                      <Text>REQUEST ALREADY ACCEPTED</Text>
                    </VStack>
                  : 
                  <>
                  {isDeclined ?
                    <VStack>
                      <Text>REQUEST DECLINED</Text>
                    </VStack>
                  
                  :
                    <HStack style={{justifyContent:"space-between", paddingLeft:35, paddingRight:35, paddingTop:10, paddingBottom:10 }} >
                    <TouchableOpacity style={{backgroundColor:"rgba(70,127,70,0.5)", borderRadius:10, padding:6, marginRight:5, justifyContent:"center", alignItems:"center"}}
                    onPress={() => {console.log("Accept pressed"); setShowNotifModal(false); acceptFriendRequest();}}
                    >
                        <Ionicons name="checkbox-outline" size={42} color="white" />
                        <Text  style={{color:"white"}}>ACCEPT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{backgroundColor:"rgba(127,70,70,0.5)", borderRadius:10, padding:6, justifyContent:"center", alignItems:"center"}}
                    onPress={() => {console.log("Refuse pressed"); setShowNotifModal(false); declineFriendRequest();}}
                    >
                        <Ionicons name="close-circle-outline" size={42} color="white" />
                        <Text  style={{color:"white"}}>REFUSE</Text>
                    </TouchableOpacity>
                    </HStack>
                  }
                  </>
                  }
                </ModalContent>
            </Modal>
        </TouchableOpacity>
    )
}

export default NotifcationFriendOrFollowRequest;

/**
 * 
 * <TouchableOpacity
            onPress={() => {setShowNotifModal(true); setDisplayNotif(item);}}
              style={{ flexDirection:"row", alignItems:"center", justifyContent:"flex-start", padding:10, borderBottomColor:"white", borderBottomWidth:1, width:"90%", marginLeft:"5%"}}>
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
                <Modal isOpen={showNotifModal} onClose={() => closeNotifModal()} style={{width:"100%", height:"100%"}}>
                  <ModalBackdrop/>
                  <ModalContent style={{backgroundColor:"rgba(170,170,170,0.8)"}}>
                    <ModalHeader>
                      <ModalCloseButton></ModalCloseButton>
                    </ModalHeader>
                      <HStack style={{justifyContent:"space-between", paddingLeft:35, paddingRight:35, paddingTop:10, paddingBottom:10 }} >
                        <TouchableOpacity style={{backgroundColor:"rgba(70,127,70,0.5)", borderRadius:10, padding:6, marginRight:5, justifyContent:"center", alignItems:"center"}}
                        onPress={() => {console.log("Accept pressed"); setShowNotifModal(false); acceptFriendRequest();}}
                        >
                          <Ionicons name="checkbox-outline" size={42} color="white" />
                          <Text  style={{color:"white"}}>ACCEPT</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{backgroundColor:"rgba(127,70,70,0.5)", borderRadius:10, padding:6, justifyContent:"center", alignItems:"center"}}
                        onPress={() => {console.log("Refuse pressed"); setShowNotifModal(false); declineFriendRequest();}}
                        >
                          <Ionicons name="close-circle-outline" size={42} color="white" />
                          <Text  style={{color:"white"}}>REFUSE</Text>
                        </TouchableOpacity>
                      </HStack>
                  </ModalContent>
                </Modal>
              </TouchableOpacity>
 */