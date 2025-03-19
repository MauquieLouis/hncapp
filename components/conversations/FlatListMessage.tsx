import React, { StyleSheet, TouchableOpacity} from "react-native";
import { memo, useCallback, useState } from "react";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { HStack } from '@/components/ui/hstack';
import { useUserContext } from "@/contexts/userContext";
import Attachment from "./attachment";
import * as Haptics from 'expo-haptics';
import MessageActionSheet from "@/components/conversations/messageActionSheet";
import { supabase } from "@/libs/initSupabase";
import AudioPlayer from "./audioPlayer";


const FlatListMessage = (props: any) => {

    const [ showActionSheet, setShowActionSheet ] = useState(false);
    const { user } = useUserContext();

    const onCloseActionSheet = () => setShowActionSheet(false);
    const openActionSheetFunction = () => { 
        setShowActionSheet(true); 
    };
    
    const item = props.message;
    

    const deleteMessage = useCallback(async () => {
        try{
            //SOFT DELETE THE MESSAGE
            const { data: data_soft_delete_msg, error: error_soft_delete_msg } = await supabase.from('messages').update({deleted_at:new Date().toISOString()}).eq('id',item.id);
            //DELETE ALL THE ASSOCIATED ATTACHMENTS
            const { data: deleted_attachments, error: error_deleted_attachment } = await supabase.from('attachments').delete().eq('message_id',item.id).select();
            //DELETE ASSOCIATED ATTACHMENTS IN STORAGE
            if(deleted_attachments){
                const urls: string[] = deleted_attachments.map(item => item.url);
                console.log("URLS TO DELETE : ",urls);
                const { data: data_delete_attachment, error: error_delete_attachment } = await supabase.storage.from('Conversations').remove(urls);
                if(error_delete_attachment){
                    console.log("Error in deleteMessage function when deleting attachment in components/attachment.tsx file :", error_delete_attachment);
                }
            }
            if(error_soft_delete_msg){
                console.log("Error in deleteMessage function when soft deleting msg in components/attachment.tsx file :", error_soft_delete_msg);
            }
            if(error_deleted_attachment){
                console.log("Error in deleteMessage function when deleting attachment in components/attachment.tsx file :", error_deleted_attachment);
            }
        }catch(error: unknown){
            console.log("Error in deleteMessage function in components/attachment.tsx file :", error);
        }finally{
            setShowActionSheet(false);
        }
    }, [item.id]);

    const handleLongPress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        openActionSheetFunction()
    }, [openActionSheetFunction]);


    const renderMessageContent = () => {
        switch(item.type) {
        case 'attachment':
            return <Attachment item={item} deleteFunction={deleteMessage}/>
        case 'audio':
            return <AudioPlayer item={item}/>
        default:
            return (
                <Box style={[styles.commonMessage,
                    item.sender_id == user.id ?
                    //My message
                    { backgroundColor:'blue'}
                    :
                    //Other message
                    { backgroundColor:'#BABABA'}
                ]}>
                    <Text style={[styles.commonTextMessage, item.sender_id == user.id ? 
                        //My message
                        {color:'white'} 
                        : 
                        //Other message
                        {color:'#1a1a1a'}]}>
                        {item.content}
                    </Text>
                </Box>
            )

        }
    }

    const actionSheetTable: { [key: string]: { icon: string; onPress: () => void; } } = {
        "info": {
            icon: "information-circle-outline",
            onPress: () => {console.log("Info Pressed")},
        },
    }
    if(item.sender_id == user.id){
        actionSheetTable["delete"] = {
            icon: "trash-outline",
            onPress: () => {console.log("Delete msg Pressed"); deleteMessage();},
        }
    }
    // if(item.type=='attachment'){
    //     actionSheetTable["download"] = {
    //         icon: "download-outline",
    //         onPress: () => {console.log("download msg Pressed"); deleteMessage();},
    //     }
    // }
    return (
        <TouchableOpacity activeOpacity={1} onLongPress={handleLongPress}>
            <HStack reversed={item.sender_id == user.id ? true : false} style={{paddingHorizontal:5}}>
                {/* {item.sender_id != user.id ? 
                <Box style={{}} width={'20%'}>
                    <Text>
                        {item.sender_id}
                    </Text>
                </Box>
                    : 
                <></>} */}
                    {renderMessageContent()}
            </HStack>
            <MessageActionSheet items={actionSheetTable} showActionSheet={showActionSheet} onCloseActionSheet={onCloseActionSheet}/>
        </TouchableOpacity>
    )
}

export default memo(FlatListMessage);

const styles = StyleSheet.create({
    commonMessage: {
        padding:13,
        borderRadius:15,
        margin:1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        maxWidth:'70%',
    },
    commonTextMessage: {
        fontSize:16,
        textAlign:'left',
    }
  });