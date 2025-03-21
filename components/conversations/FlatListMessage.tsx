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
import { Center } from "../ui/center";


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
    const formatHour = (time: any) => {
        let date = new Date(time);

        let hours =date.getHours();
        let minutes = date.getMinutes();

        let formattedHours = hours < 10 ? '0' + hours : hours;
        let formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

        return `${formattedHours}:${formattedMinutes}`
    };

    const sameHour = () => {
        return formatHour(item.created_at) == formatHour(props.previousTime ) ? <></> : formatHour(item.created_at)
    }

    const formatDate = (time: any) => {
        const date = new Date(time);
        const year = date.getFullYear();
        const month = (date.getMonth()+1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const sameDate = () => {
        return formatDate(item.created_at) == formatDate(props.previousTime) ? null : formatDate(item.created_at)
    }

    return (
        <TouchableOpacity activeOpacity={1} onLongPress={handleLongPress}>
            {sameDate() ? 
                <Box style={{}}>
                    <Center style={{}}>
                        <Box style={{
                            // borderColor:"green", 
                            // borderWidth:1, 
                            backgroundColor:'rgba(210,210,210,1)', 
                            paddingLeft: 15, 
                            paddingRight:15, 
                            padding:3, 
                            marginTop:10, 
                            marginBottom:10,
                            elevation:5,
                            borderRadius:3
                            }}>
                            <Text>
                                {sameDate()}
                            </Text>
                        </Box>
                    </Center>
                </Box>
            :
                <></>
            }
            <HStack reversed={item.sender_id == user.id ? true : false} style={{paddingHorizontal:5}}>
                {/* {item.sender_id != user.id ? 
                <Box style={{}} width={'20%'}>
                    <Text>
                        {item.sender_id}
                    </Text>
                </Box>
                    : 
                <></>} */}
                    {/** PRINT HOUR */}
                    {renderMessageContent()}
                    <Box style={{justifyContent:"center", alignItems:"center", paddingLeft:5, paddingRight:5}}>
                        <Text style={{color:"rgba(120,120,120,0.7)"}}>{sameHour()}</Text>
                    </Box>
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