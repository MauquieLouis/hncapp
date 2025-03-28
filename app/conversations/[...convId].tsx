import React, { FlatList, Touchable, TouchableOpacity } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { useUserContext } from '../../contexts/userContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../libs/initSupabase';
import { useLocalSearchParams } from 'expo-router';

import FlatListMessage from '@/components/conversations/FlatListMessage';
import ConversationCommands from '@/components/conversations/conversationCommands';
import { Center } from '@/components/ui/center';
import { Spinner } from '@/components/ui/spinner';
import { MMKV, Mode } from 'react-native-mmkv';
import * as FileSystem from 'expo-file-system';
import { HStack } from '@/components/ui/hstack';
import { Ionicons } from '@expo/vector-icons';

const debounce = (func: { (): Promise<void>; apply?: any; }, delay: number | undefined) => {
    let debounceTimer: string | number | NodeJS.Timeout | undefined;
    return function(...args: any) {
        const context = this;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    }
}

// const documentPath = FileSystem.documentDirectory;
// console.log("DOCUMENT DIRECTORY Path :", documentPath);

// export const storage = new MMKV({
//     id: `user-test-storage`,
//     path: `${documentPath}/storage`,
//     encryptionKey: 'hunter2',
//     mode: Mode.MULTI_PROCESS,
// });


const ConversationScreen = () => {
    
    const PAGE_SIZE = 20; // If changing this, number, be careful of changing it in the rpc function that retrieve first messages at opening, maybe add a parameter for that.

    const [ loading, setLoading ] = useState(false);
    const [ messages, setMessages ] = useState<any[]>([]);
    const [ text, setText ] = useState('');
    const [ participants, setParticipants ] = useState(null);
    const [ devicesTokens, setDeviceTokens ] = useState([]);
    const [ loadingSend, setLoadingSend ] = useState(false);
    const [ typingUsers, setTypingUsers ] = useState({});
    const [ loadingMoreMessages, setLoadingMoreMessages ] = useState(false);
    const [ canTriggerLoadMore, setCanTriggerLoadMore ] = useState(true);
    const [ endReached, setEndReached ] = useState(false);
    const [ isTyping, setIsTyping ] = useState(false);
    const [ offset, setOffset ] = useState(PAGE_SIZE);
    const [ isAtBottom, setIsAtBottom ] = useState(true);
    const [ isSeen, setIsSeen ] = useState(false);
    const [ loadingNewImage, setLoadingNewImage ] = useState(false);
    const [ replyTo, setReplyTo ] = useState(null);
    const [ replyToContent, setReplyToContent] = useState(null);
    const [ replyToType, setReplyToType] = useState(null);
    const [ scrollY, setScrollY ] = useState(0);

    const { convId } = useLocalSearchParams();
    const { user } = useUserContext();

    
    const flatListRef = useRef(null);

    const checkIfConvExistLocally = () => {
        return storage.contains(`${convId}-timestamp`)
    }

    const checkForTimestampDiff = async() => {
        const last_local_timestamp = storage.getString(`${convId}-timestamp`);
        try{
            const { data, error } = await supabase.from('messages').select('created_at').gte('created_at', last_local_timestamp);
            console.log("DATA :", data);
            if(error){
                console.log("Error in checkForTimestampDiff function when fetching last timestamp, in [...convId].tsx", error);
            }
        }catch(error: unknown){
            console.log("Error in chechForTimeStampDiff function in [...convId].tsx",error);
        }finally{

        } 
    }

    let storage: MMKV;
    useEffect(() => {
        storage = new MMKV({
            id: `user-${user.id}-storage`,
        });
        if(checkIfConvExistLocally()){
            checkForTimestampDiff();
        }else{
            
        }
        const fetchConversationData = async () => {
            try{
                setLoading(true);
                const { data: conv_data, error: conv_error } = await supabase.rpc('get_conversation_messages2', {'p_conversation_id': convId[0], 'p_user_id':user.id})
                if(conv_error){
                    console.log('Conv_Error :', conv_error);
                }
                setMessages(conv_data.messages);
                setParticipants(conv_data.participants);
                setDeviceTokens(conv_data.device_tokens);
                readLastMessageStatus(conv_data.messages[0].id);
            }catch(error: unknown){
                console.log('Error in fetchConversation function in Messagings.tsx', error);
            }finally{
                setLoading(false);
            }
        }
        markMessageAsRead();
        fetchConversationData();
        subscribeToTypingStatus();
        subscrbeToMessagesStatus();
    }, []);

    const fetchAttachments = async(msg_id: string) => {
        try{
            const { data: attach_data, error: attach_error } = await supabase.from('attachments').select('*').eq('message_id', msg_id);
            if(attach_error){
                console.log('Error in fetchAttachments function when fetching attachements in [...convId].tsx', attach_error);
            }
            return attach_data;
        }catch(error: unknown){
            console.log('Error in fetchAttachments function in [...convId].tsx', error);
        }finally{

        }
    }

    useEffect(() => {
        console.log("is at bottom CHANGE : ", isAtBottom);
        if(isAtBottom) markMessageAsRead();
        /** ---------------------------------------------------------------
         *  ==== ====  S U B S C R I B E   T O   M E S S A G E S  ==== ====
         */
        const insertAndDeleteChannels = supabase.channel(`conversation-messages-${convId[0]}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table:'messages', filter:'conversation_id=eq.'+convId[0]}, handleReceivedMessage)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table:'messages', filter:'conversation_id=eq.'+convId[0]}, handleDeletedMessage)
        .subscribe();

        return() => {
            insertAndDeleteChannels.unsubscribe();
        };
    }, [isAtBottom, messages])

    const handleDeletedMessage = (payload: any) => {
        console.log("NEW DELETED OR UPDATED MESSAGE DETECTED :", payload.old.id);
        if(messages){
            const exists = messages.find(msg => msg.id === payload.old.id) !== undefined;
            if(!exists) return;
        }
        setMessages((prev) => prev.filter(msg => msg.id !== payload.old.id));
        setOffset((prevOffset) => prevOffset - 1);
    }

    const handleReceivedMessage = async (payload: any) => {
        setIsSeen(false);
        // CREATE A WAITING TIME WHEN UPLOADING NEW IMAGE OR AUDIO, TO DISPLAY IT IN THE CONVERSATION
        if(payload.new.type == 'attachment' || payload.new.type == 'audio'){
            setLoadingNewImage(true);
            console.log("NEW ATTACHMENT MESSAGE DETECTED :", payload);
            payload.new.attachments = [];
            let attempts = 0;
            let maxAttempts = 13;
            const delay= 900;
            let result;
            while(attempts < maxAttempts){
                console.log("attemps :", attempts);
                attempts++;
                console.log(`Waiting for file upload... Attempt ${attempts + 1}`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                result = await fetchAttachments(payload.new.id);
                if(result){
                    attempts = maxAttempts;
                }
            }
            payload.new.attachments = result;
        }
        setMessages((prev) => [ payload.new, ...prev]);
        setOffset((prevOffset) => prevOffset + 1);
        console.log("IS AT BOTTOM :", isAtBottom);
        if(payload.new.user_id != user.id && isAtBottom){
            console.log("NOT SUPPOSED TO SCROLL TO BOTTOM !!!!");
            console.log("OFFSET :", offset);
            markMessageAsRead();
        }
        setLoadingNewImage(false);
    }

    /** -------------------------------------------------------
     *  ==== ====  S E N D   T E X T   M E S S A G E  ==== ====
     * @returns message_id id of the freshly created conversation.
     */
    const sendTextMessage = async(has_attachement: boolean, type: string) => {
        console.log("TEXT TRIM :", text.trim(), 'HAS ATTACH :',has_attachement, 'TYPE :', type);
        if (text.trim() === '' && has_attachement == false) return;
        let message_id;
        try{
            setLoadingSend(true);
            const { data: send_data, error: send_error } = await supabase.from('messages').insert({
                content: text,
                sender_id: user.id,
                conversation_id: convId[0],
                type: type, // Must be one of the following: 'text', 'attachment', 'file', 'audio', 'other'
                has_attachment: has_attachement,
                replied_to_id:replyTo
            }).select("id");
            console.log("SEND DATA :", send_data);
            if(send_error){
                console.log('Error in sendTextMessage when inserting text message function in [...convId].tsx', send_error);
            }else {
                console.log("SEND DATA:", send_data);
                message_id = send_data[0].id; // Extract the ID properly
            }
        }catch(error: unknown){
            console.log('Error in sendTextMessage function in [...convId].tsx', error);
        }finally{
            // sendPushNotification(["ExponentPushToken[LAeDpVJcdT2PZz3kEnrFwj]"]);
            setIsSeen(false);
            setText('');
            setLoadingSend(false);
            setReplyTo(null);
        }
        return message_id;
    };

    /** -----------------------------------------------------------------
     *  ==== ====  S E N D   P U S H   N O T I F I C A T I O N  ==== ====
     * @param expoPushToken 
     */
    async function sendPushNotification(expoPushToken: string[]) {
        //ExponentPushToken[LAeDpVJcdT2PZz3kEnrFwj]
        for(let token of expoPushToken){
            const notif = {
              to: token,
              sound: 'default',
              title: "CONV",
              body: text,
              identifier: "notificationId", // Ensures it updates instead of creating a new one
              data: { someData: 'goes here'},
    
            };
          
            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(notif),
            });
        }
      }

    /** ----------------------------------------------------------
     *  ==== ====  L O A D   M O R E    M E S S A G E S  ==== ====
     * @returns 
     */
    const loadMoreMessages = useCallback(async() => {
        if (!canTriggerLoadMore || loadingMoreMessages || endReached ) return;
      try{
            setCanTriggerLoadMore(false);
            setLoadingMoreMessages(true);
            const { data: messages_data, error: messages_error } = await supabase.from('messages')
            .select('id, content, created_at, sender_id, type, has_attachment')
            .eq('conversation_id', convId[0])
            .is('deleted_at', null)
            .order('created_at', { ascending: false})
            .range(offset,offset+PAGE_SIZE-1);
            if(messages_error){
                  console.log('Error in fetchMessages  when fetching messages in [...convId].tsx', messages_error);
                }
            if(messages_data?.length != 0){
                const newMessageArray: any = messages_data;
                if(newMessageArray){
                    for(let message of newMessageArray){
                        if(message.type == 'attachment' || message.type == 'audio'){
                            const result = await fetchAttachments(message.id);
                            message.attachments = result;
                        }
                    }
                    setMessages((prev) => {const data = [...prev, ...newMessageArray]; const uniqueData = Array.from(new Set(data)); return uniqueData});
                    setOffset(offset+PAGE_SIZE);
                }
            }else{
                console.log("END REACHED NO MORE MESSAGES WILL BE LOADED...");
                //Here put some infos about users in conv (carroussel with profiles)
                setEndReached(true);
            }
        }catch(error: unknown){
          console.log('Error in fetchMessages function in [...convId].tsx', error);
        }finally{
          setLoadingMoreMessages(false);
          setCanTriggerLoadMore(true);
      }
    }, [loadingMoreMessages, offset]);

    const debouncedFetchData = useCallback(debounce(loadMoreMessages, 300), [loadMoreMessages]);
    const handleLoadMoreMessage = () => {
        debouncedFetchData();
    }

    /** ---------------------------------------------------------------------------
     *  ==== ====  S U B S C R I B E   T O   M E S S A G E   S T A T U S  ==== ====
     */
    const subscrbeToMessagesStatus = () => {
        supabase.channel(`conversation-messages-status-${convId[0]}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table:'message_status', filter:'conversation_id=eq.'+convId[0]},
            (payload) => {
                if(payload.new.user_id != user.id){
                    setIsSeen(true);
                }
            }
        ).subscribe();
    }

    /** -----------------------------------------------------
     *  ==== ====  S C R O L L   T O   B O T T O M  ==== ====
     */
    const scrollToBottom = () => {
        console.log("NEW MESSAGE RECEIVED");
        flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
    };

    /** -----------------------------------------------
     *  ==== ====  H A N D L E   S C R O L L  ==== ====
     * @param event
     */
    const handleScroll = (event: { nativeEvent: { layoutMeasurement: any; contentOffset: any; contentSize: any; }; }) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        // Check if the user is at the bottom (with a small threshold)
        // const atBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
        // Check if the user is at the top (small threshold to allow minor scrolling)
        const atTop = contentOffset.y <= 10; // Adjust threshold if needed
        console.log("contentOffset", contentOffset.y);
        setScrollY(contentOffset.y);
        setIsAtBottom(atTop); //It's call bottom here because flatlist is inverted.
    };

    /** -------------------------------------------------------------------------
     *  ==== ====  S U B S C R I B E   T O   T Y P I N G   S T A T U S  ==== ====
     */
    const subscribeToTypingStatus = () => {
        const channel = supabase.channel(`typing-${convId[0]}`, {config: {broadcast: {self: true} }});
        channel.on('broadcast', {event: 'typing'}, (payload) => {
            if(payload.payload.user == user.id) return;
            setTypingUsers((prev) => ({ ...prev, [payload.payload.user]:true }));
            setTimeout(() => {
                setTypingUsers((prev) => {
                    const updated = { ...prev };
                    delete updated[payload.payload.user];
                    return updated;
                });
            }, 3000);
        }).subscribe();
    };

    /** ------------------------------------------------------
     *  ==== ====  S E N D   T Y P I N G   E V E N T ==== ====
     */
    const sendTypingEvent = async () => {
      if (!isTyping) {
        setIsTyping(true);
        await supabase.channel(`typing-${convId[0]}`).send({
          type: "broadcast",
          event: "typing",
          payload: { user: user.id },
        });
        setTimeout(() => setIsTyping(false), 3000); // Reset typing state after delay
      }
    };

    /** -------------------------------------------------------------
     *  ==== ====  M A R K   M E S S A G E   A S   R E A D  ==== ====
     */
    const markMessageAsRead = async() => {
        try{
            const { data, error: rpc_error } = await supabase.rpc('mark_messages_as_read', {'p_user_id': user.id, 'p_conversation_id': convId[0]});
            if(rpc_error){
                console.log('Error in markMessageAsRead when trying to mark message as read function in [...convId].tsx', rpc_error);
            }
        }catch(error:unknown){
            console.log('Error in markMessageAsRead function in [...convId].tsx', error);
        }
    }
    
    /** ---------------------------------------------------------------------
     *  ==== ====  R E A D   L A S T   M E S S A G E   S T A T U S  ==== ====
     * @param message_id 
     */
    const readLastMessageStatus = async(message_id: any) => {
        try{
            console.log("MESSAGE ID :", message_id);
            const { data: last_status, error: error_status } = await supabase.from('message_status').select('*').eq('message_id',message_id).neq('user_id',user.id);
            if(error_status){
                console.log('Error in readLastMessageStatus when trying to read last message_status function in [...convId].tsx', error_status);
            }
            if(last_status?.length != 0){
                console.log("LAST_READ_MESSAGE : ", last_status);
                setIsSeen(true);
            }
        }catch(error:unknown){
            console.log('Error in readLastMessageStatus function in [...convId].tsx', error);
        }finally{

        }
    }

    const renderItemFlatList = ({item, index}: {item: any, index: any}) => {
        return <FlatListMessage 
                    message={item} 
                    previousTime={index === messages.length-1 || messages[index+1].created_at} 
                    setReplyTo={setReplyTo}
                    setReplyToContent={setReplyToContent}
                    setReplyToType={setReplyToType} 
                    scrollY={scrollY}/>
    }

    return(
        <>
            { loading ?
                <Text>LOADING !!!</Text>
            :
                <>
                    <Text>CONVERSATION ID : {convId[0]}</Text>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        inverted={true}
                        nestedScrollEnabled={true}
                        renderItem={renderItemFlatList}
                        keyExtractor={(item) => item.id}
                        extraData={messages}
                        // onContentSizeChange={scrollToBottom} // To use when new message received.
                        onEndReached={handleLoadMoreMessage}
                        onMomentumScrollBegin={() => {setCanTriggerLoadMore(true)}}
                        onEndReachedThreshold={0.1}
                        ListFooterComponent={loadingMoreMessages? <Center>
                            <Spinner size="large" color={"blue"}/>
                        </Center>  : null}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        ListHeaderComponent={<Box style={{height:70}}>
                            {isSeen ? 
                                <Box style={{height:70}}>
                                    <Text style={{textAlign:'left'}}>SEEN !</Text>
                                </Box>
                            : null}
                            
                        </Box>}
                    />
                    
                    {Object.keys(typingUsers).length > 0 && (
                        <Text ml={4} color="$gray400">{Object.keys(typingUsers).join(", ")} is typing...</Text>
                        // <Text ml={4} color="$gray400">Someone is typing...</Text>
                    )}
                    {replyTo ? 
                            <Box style={{
                                borderColor:"rgba(0, 0, 0, 0.15)",
                                borderWidth:1,
                                width:"66%",
                                padding:3,
                                height:50,
                                // bottom:40,
                                backgroundColor:"rgba(255,255,255,0.7)",
                                marginLeft:6,
                                borderRadius:10,
                                position:'absolute',
                                bottom:40, 
                                left:0
                            }}>
                                <HStack>
                                    <Box style={{padding:5, backgroundColor:"rgba(220,220,220,0.4)", borderRadius:10}}>
                                        <Ionicons name={'return-up-back-outline'} color={'blue'} size={32}/>
                                    </Box>
                                    <Box style={{justifyContent:'center', alignItems:'center', paddingLeft:5}}>
                                        <Text numberOfLines={1}>
                                            {replyToContent}
                                            {replyToType == 'attachment' ? <Ionicons name={'image-outline'} color={'blue'} size={23}/> : null}
                                            {replyToType == 'audio' ? <Ionicons name={'mic-outline'} color={'blue'} size={23}/> : null}
                                        </Text>
                                    </Box>
                                    <TouchableOpacity onPress={() => {setReplyTo(null); setReplyToContent(null); setReplyToType(null)}} style={{position:'absolute',right:0}}>
                                        <Ionicons name={'close-circle-outline'} color={'blue'} size={32}/>
                                    </TouchableOpacity>
                                </HStack>
                            </Box> 
                            : null}
                    <ConversationCommands
                        convId={convId}
                        sendTextMessage={sendTextMessage}
                        text={text}
                        setText={setText}
                        sendTypingEvent={sendTypingEvent}
                    />
                </>
            }
        </>
    );
};

export default ConversationScreen;
