import React, { Dimensions, StyleSheet, TouchableOpacity} from "react-native";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { HStack } from '@/components/ui/hstack';
import { useUserContext } from "@/contexts/userContext";
import Attachment from "./attachment";
import * as Haptics from 'expo-haptics';
import { supabase } from "@/libs/initSupabase";
import AudioPlayer from "./audioPlayer";
import { Center } from "../ui/center";
import ModalIcon from "./modalIcon";
import { Ionicons } from "@expo/vector-icons";
import { VStack } from "../ui/vstack";
import ReactionActionSheet from "./reactionActionSheet";


const FlatListMessage = (props: any) => {

    // const [ showActionSheet, setShowActionSheet ] = useState(false);
    const [ modalIconPosition, setModalIconPosition ] = useState(0);
    const [ showReactionActionSheet, setShowReactionActionSheet ] = useState(false);
    const [ modalIcon, setModalIcon ] = useState(false);
    // const [ modalActionPosition, setModalActionPosition ] = useState(0);

    const { user } = useUserContext();
    
    const item = props.message;
    const boxRef = useRef(null);

    // const onCloseActionSheet = () => setShowActionSheet(false);
    const onCloseModalIcon = () => setModalIcon(false);
    const onCloseReactionActionSheet = () => setShowReactionActionSheet(false);

    const openModalIconFunction = () => {
        setModalIcon(true);
        calculatePositionToDisplay(item.id);
    }
    // const openActionSheetFunction = () => { 
    //     setShowActionSheet(true); 
    //     calculatePositionToDisplay(item.id)
    // };
    

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
        openModalIconFunction()
    }, [openModalIconFunction]);

    // useEffect(() => {
    //     console.log("MODAL ICON POSITION :", modalIconPosition);
    // },[modalIconPosition]);


    const renderMessageContent = () => {
        switch(item.type) {
        case 'attachment':
            return <Attachment 
                        item={item} 
                        deleteFunction={deleteMessage}
                        openModalIconFunction={openModalIconFunction} 
                    />
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
            onPress: () => {console.log("Info Pressed, id :", item.id); onCloseModalIcon();},
        },
        "answer": {
            icon: "return-up-back-outline",
            onPress: () => {
                console.log("Answer Pressed"); 
                props.setReplyTo(item.id); 
                props.setReplyToType(item.type);
                props.setReplyToContent(item.content);
                onCloseModalIcon();},
        }
    }
    if(item.sender_id == user.id){
        actionSheetTable["delete"] = {
            icon: "trash-outline",
            onPress: () => {console.log("Delete msg Pressed"); deleteMessage();},
        }
    }
    if(item.type=='attachment'){
        actionSheetTable["download"] = {
            icon: "save-outline",
            onPress: () => {console.log("download all attach msg Pressed");},
        }
    }
    // if(item.type == 'attachment'){
        
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
        return formatHour(item.created_at) == formatHour(props.previousTime ) ? sameDateTime() : formatHour(item.created_at)
    }

    const sameDateTime = () => {
        return formatDate(item.created_at) == formatDate(props.previousTime) ? <></> : formatHour(item.created_at);
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


    const calculatePositionToDisplay = (messageId: any) => {
        console.log("CALCULATE POSITION");
        if(boxRef.current){
            boxRef.current.measure((x: any, y: any, width: any, height: any, pageX: any, pageY: any)=> {
                console.log("==================================== MSG POS ====================================")
                console.log("Info x :", x," - y :", y);
                console.log("Info width :", width," - height :", height);
                console.log("Info pageX :", pageX," - pageY :", pageY);
                console.log(pageY+props.scrollY,">",2*Dimensions.get('window').height/3);
                console.log("==================================== MSG POS ====================================")
                //If the message is at the bottom of the screen, the modal will be displayed at the top of the message
                let pageYScroll;
                if( pageY+props.scrollY > Dimensions.get('window').height || pageY+props.scrollY <0)
                {
                    pageYScroll = pageY
                }else{
                    pageYScroll = pageY+props.scrollY;
                }
                    if(pageYScroll > Dimensions.get('window').height/2){
                        console.log('bottom message so modal top');
                        setModalIconPosition(pageYScroll);
                        //Else if the message is at the top of the screen, the modal will be displayed at the bottom of the message
                    }else{
                        console.log('top message so modal bottom');
                        setModalIconPosition(pageYScroll+height);
                    }
            });
        }
    }

    const addMessageReaction = async(reaction: string) => {
        console.log("REACTION :", reaction, props.convId);
        try{
            const { data: data_reaction, error: error_reaction } = await supabase.from('message_reactions').upsert(
                {message_id:item.id, reaction:reaction, user_id:user.id, conversation_id:props.convId[0]}, { onConflict: "message_id,user_id" }
            ).select();
            if(error_reaction){
                console.log("Error in addMessageReaction function when adding reaction in components/flatListMessage.tsx file :", error_reaction);
            }
        }catch(error: unknown){
            console.log("Error in addMessageReaction function in components/flatListMessage.tsx file :", error);
        }finally{
            setModalIcon(false);

        }
    }

    const deleteMessageReaction = async() => {
        console.log("DELETE REACTION");
        try{
            const { data: data_reaction, error: error_reaction } = await supabase
                .from('message_reactions')
                .delete()
                .eq('message_id',item.id)
                .eq('user_id',user.id)
                .select();
            if(error_reaction){
                console.log("Error in deleteMessageReaction function when deleting reaction in components/flatListMessage.tsx file :", error_reaction);
            }
        }catch(error: unknown){
            console.log("Error in deleteMessageReaction function in components/flatListMessage.tsx file :", error);
        }finally{
            onCloseReactionActionSheet();
        }
    }

    const reactions = item.reactions || [];
    // console.log("ITEM :", item);
    return (
        <>
            <VStack>
                {sameDate() ? 
                    <Box>
                        <Center style={{}}>
                            <Box style={{
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
                <TouchableOpacity activeOpacity={1} onLongPress={handleLongPress} ref={boxRef}>
                    <>
                        {item.replied_to_id ? 
                            <Box style={{position:'absolute',
                                right:item.sender_id == user.id ? 0 : undefined,
                                left:item.sender_id != user.id ? 0 : undefined,
                                padding:8,
                                borderColor:"rgba(200, 200, 200, 0.4)",
                                backgroundColor:"rgba(210, 210, 210, 0.5)",
                                borderWidth:2,
                                marginHorizontal:3,
                                borderRadius:10,
                                top:3,
                                maxWidth:'72%',
                            }}>
                                <HStack>
                                    <Ionicons name={'arrow-redo-outline'} size={20} color={'rgba(0, 0, 200, 0.8)'}/>
                                    {item.reply_type == 'attachment' ? <Ionicons name={'image-outline'} color={'blue'} size={23}/> : null}
                                    {item.reply_type == 'audio' ? <Ionicons name={'mic-outline'} color={'blue'} size={23}/> : null}
                                    <Text numberOfLines={1} style={{maxWidth:"94%"}}>{item.reply_content}</Text>
                                </HStack>
                            </Box>
                        :<></>}
                    </>
                    <HStack reversed={item.sender_id == user.id ? true : false} style={{
                            paddingHorizontal:5, 
                            marginTop:item.replied_to_id? 33:0,
                            marginBottom: item.reactions.length ? 25 : 0,}}>
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
                    {item.reactions.length != 0 ? 
                        <TouchableOpacity onPress={() => {console.log("PRESS REACTIONS "); setShowReactionActionSheet(true);}} >
                            <Box style={{position:'absolute',
                                right:item.sender_id == user.id ? 6 : undefined,
                                left:item.sender_id != user.id ? 6 : undefined,
                                padding:3,
                                borderColor:"rgba(200, 200, 200, 0.4)",
                                backgroundColor:"rgba(210, 210, 210, 0.5)",
                                borderWidth:2,
                                marginHorizontal:3,
                                borderRadius:12,
                                bottom:3,
                                maxWidth:'72%',
                            }}>
                                <HStack>
                                    {item.reactions.map((reaction, index) => (
                                        <Text key={index}>{reaction.reaction}</Text>
                                    ))}
                                    {/* <Ionicons name={'arrow-redo-outline'} size={20} color={'rgba(0, 0, 200, 0.8)'}/> */}
                                </HStack>
                            </Box>
                        </TouchableOpacity>
                    :<></>}
                </TouchableOpacity>

            </VStack>
            <ModalIcon 
                items={actionSheetTable}
                isOpen={modalIcon} 
                onClose={onCloseModalIcon} 
                modalIconPosition={modalIconPosition} 
                myMessage={item.sender_id === user.id}
                onPress={addMessageReaction}
                />
            <ReactionActionSheet
                showReactionActionSheet={showReactionActionSheet}
                onCloseReactionActionSheet={onCloseReactionActionSheet}
                reactions={item.reactions}
                deleteFunction={deleteMessageReaction}
            />
        </>
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