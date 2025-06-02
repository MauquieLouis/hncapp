import React, { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Box } from '@/components/ui/box';
import Avatar from '@/components/profile/avatar';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Ionicons } from '@expo/vector-icons';
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalHeader } from '@/components/ui/modal';
import { useUserContext } from '@/contexts/userContext';


const NotifcationItem = ({ notification, acceptFriendRequest, declineFriendRequest }: { notification: any; acceptFriendRequest: any; declineFriendRequest: any }) => {

    const [ showNotifModal, setShowNotifModal ] = useState<boolean>(false);
      const [ displayNotif, setDisplayNotif ] = useState<any>(null);
    
      const { profile } = useUserContext();
    
      const closeNotifModal = ( ) => {
        setDisplayNotif(null);
        setShowNotifModal(false);
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
    )
}

export default NotifcationItem;

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