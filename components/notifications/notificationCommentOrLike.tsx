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
import PostElemInPostsList from '../profile/postElemInPostsList';


const NotificationCommentOrLike = ({ notification }: { notification: any; }) => {

    const [ showNotifModal, setShowNotifModal ] = useState<boolean>(false);
    const [ displayNotif, setDisplayNotif ] = useState<any>(null);
    const [ isAccepted, setIsAccepted ] = useState<boolean>(false);
    const [ isDeclined, setIsDeclined ] = useState<boolean>(false);
    const [ post, setPost ] = useState<any>(null);
  
    const { profile } = useUserContext();
  
    const closeNotifModal = ( ) => {
      setDisplayNotif(null);
      setShowNotifModal(false);
    }
    
    useEffect(() => {
      console.log("NotifcationFriendOrFollowRequest: ", notification);
      findPostLinked();
    },[]);

    const findPostLinked = async () => {
        try{
            const { data, error } = await supabase.from('comments').select('post_id').eq('id', notification.object_id).single();
            if(error){
                console.error("Error finding post linked in findPostLinked function in components/notifications/notificationCommentOrLike.tsx", error);
            }else{
                console.log("POST ID: ", data.post_id);
                const { data: postData, error: postError } = await supabase.from('posts').select('*').eq('id', data.post_id).single();
                if(postError){
                    console.error("Error fetching post in findPostLinked function in components/notifications/notificationCommentOrLike.tsx", postError);   
                }else{
                    setPost(postData);
                }
            }
        }catch(error: unknown){
            console.error("Error in findPostLinked function in components/notifications/notificationCommentOrLike.tsx", error);
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
                <PostElemInPostsList item={post} folder_url={profile.user_id} bucket={'posts'}/>
                </ModalContent>
            </Modal>
        </TouchableOpacity>
    )
}

export default NotificationCommentOrLike;

