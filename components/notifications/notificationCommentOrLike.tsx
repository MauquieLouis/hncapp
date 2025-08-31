import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
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
  
    const { profile, theme } = useUserContext();
  
    const closeNotifModal = ( ) => {
      setDisplayNotif(null);
      setShowNotifModal(false);
    }
    
    useEffect(() => {
      findPostLinked();
    },[]);

    const findPostLinked = async () => {
        try{
            let main_data: any, main_error: any;
            if(notification.type =='post_liked'){
                const { data, error } = await supabase.from('post_likes').select('post_id').eq('id', notification.object_id).maybeSingle();
                main_data = data;
                main_error = error;
            }else{
                const { data, error } = await supabase.from('comments').select('post_id').eq('id', notification.object_id).maybeSingle();
                main_data = data;
                main_error = error;
            }
            if(main_error){
                console.error(" (1) Error finding post linked in findPostLinked function in components/notifications/notificationCommentOrLike.tsx", main_error);
            }else{
                if(main_data == null && main_data == undefined){
                    return
                }else{
                    const { data: postData, error: postError } = await supabase.from('posts').select('*').eq('id', main_data.post_id).single();
                    if(postError){
                        console.error(" (2) Error fetching post in findPostLinked function in components/notifications/notificationCommentOrLike.tsx", postError);   
                    }else{
                        setPost(postData);
                    }

                }
            }
        }catch(error: unknown){
            console.error("Error in findPostLinked function in components/notifications/notificationCommentOrLike.tsx", error);
        }
    }

    const styles = StyleSheet.create({
        titleText:{
            color:theme.textColor1, 
            paddingLeft:15, 
            fontSize:20
        },
        mainText:{
            color:theme.textColor2,
            paddingLeft:15, 
            fontSize:14
        }
    });

    return(
        <TouchableOpacity
            onPress={() => {setShowNotifModal(true); setDisplayNotif(notification);}}
            style={{ flexDirection:"row", alignItems:"center", justifyContent:"flex-start", padding:10, borderBottomColor:"white", borderBottomWidth:1, width:"90%", marginLeft:"5%"}}>
            {post ? 
            <Avatar user_id={notification.user_id}/>:<></>
            }
            <VStack style={{flex:1, paddingLeft:10}}>
            <Text style={styles.titleText}>
                {notification.type}
            </Text>
            <Text style={styles.mainText}>
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
                <PostElemInPostsList item={post} folder_url={[profile.user_id]} bucket={'posts'} profile={profile}/>
                </ModalContent>
            </Modal>
        </TouchableOpacity>
    )
}

export default NotificationCommentOrLike;

