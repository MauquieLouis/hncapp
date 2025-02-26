import React, { FlatList } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { useUserContext } from '../../../contexts/userContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../libs/initSupabase';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import FlatListMessage from '@/components/conversations/FlatListMessage';
import { v6 as uuidv6 } from 'uuid';

const debounce = (func, delay) => {
    let debounceTimer;
    return function(...args) {
        const context = this;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    }
}

const ConversationScreen = () => {

    const PAGE_SIZE = 20; // If changing this, number, be careful of changing it in the rpc function that retrieve first messages at opening, maybe add a parameter for that.

    const [ loading, setLoading ] = useState(false);
    const [ messages, setMessages ] = useState(null);
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
    const [ images, setImages ] = useState(null);

    const { convId } = useLocalSearchParams();
    const { user } = useUserContext();
    
    const flatListRef = useRef(null);

    useEffect(() => {
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
        // console.log("UUID V6", uuidv6());
    }, []);


    useEffect(() => {
        console.log("is at bottom CHANGE : ", isAtBottom);
        if(isAtBottom) markMessageAsRead();
        /** ---------------------------------------------------------------
         *  ==== ====  S U B S C R I B E   T O   M E S S A G E S  ==== ====
         */
        const channel = supabase.channel(`conversation-messages-${convId[0]}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table:'messages', filter:'conversation_id=eq.'+convId[0]},
            (payload) => {
                setIsSeen(false);
                setMessages((prev) => [ payload.new, ...prev]);
                setOffset((prevOffset) => prevOffset + 1);
                console.log("IS AT BOTTOM :", isAtBottom);
                if(payload.new.user_id != user.id && isAtBottom){
                    console.log("NOT SUPPOSED TO SCROLL TO BOTTOM !!!!");
                    console.log("OFFSET :", offset);
                    markMessageAsRead();
                    // scrollToBottom();
                }
            }
        ).subscribe();

        return() => {
            channel.unsubscribe();
        };
    }, [isAtBottom])

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
            sendPushNotification("ExponentPushToken[LAeDpVJcdT2PZz3kEnrFwj]");
            setIsSeen(false);
            setText('');
            setLoadingSend(false);
        }
        return message_id;
    };

    /** -----------------------------------------------------------------
     *  ==== ====  S E N D   P U S H   N O T I F I C A T I O N  ==== ====
     * @param expoPushToken 
     */
    async function sendPushNotification(expoPushToken: string) {
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


    const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
    };
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
            .order('created_at', { ascending: false})
            .range(offset,offset+PAGE_SIZE-1);
            if(messages_error){
                  console.log('Error in fetchMessages  when fetching messages in [...convId].tsx', messages_error);
                }
            if(messages_data?.length != 0){
            setMessages((prev) => {const data = [...prev, ...messages_data]; const uniqueData = Array.from(new Set(data)); return uniqueData});
            setOffset(offset+PAGE_SIZE);
            }else{
            console.log("END REACHED NO MORE MESSAGES WILL BE LOADED...");
            //Here put some infos about users in conv (carroussel with profiles)
            setEndReached(true);
            }
        }catch(error: unknown){
          console.log('Error in fetchMessages function in [...convId].tsx', error);
        }finally{
            // console.log("BEFORE DELAY");
            // await delay(1200);
            // console.log("AFTER DELAY");
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
    const handleScroll = (event) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        // Check if the user is at the bottom (with a small threshold)
        // const atBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
        // Check if the user is at the top (small threshold to allow minor scrolling)
        const atTop = contentOffset.y <= 10; // Adjust threshold if needed
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

    /** -----------------------------------------
     *  ==== ====  P I C K   I M A G E  ==== ====
     */
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            // allowsEditing: true,
            aspect: [4,3],
            quality:1,
            base64: true,
            allowsMultipleSelection: true
        });
        // console.log(result);

        if(!result.canceled){
            // setImages(result.assets[0].uri);
            uploadImage(result.assets)
        }
    }

    /** ---------------------------------------------
     *  ==== ====  U P L O A D   I M A G E  ==== ====
     * @param file 
     */
    const uploadImage = async (files: ImagePicker.ImagePickerAsset[]) => {
        try{
            //Create the attachement and send Message
            const message_id = await sendTextMessage(true, 'attachment');
            console.log("message iD :", message_id);
            for(let file of files as ImagePicker.ImagePickerAsset[]){
                // const filename = uuidv6();
                
                const { data: attach_data, error: attach_error } = await supabase.from('attachments').insert({
                    message_id: message_id,
                    url: file.fileName,
                    type: file.mimeType,
                    size: file.fileSize
                });
                if(attach_error){
                    console.log("Error in uploadImage function when inserting new attachement in [...convId].tsx :", attach_error);

                }
                //Upload the file on supabase
                // console.log("FILE simple :", file);
                const {data, error} = await supabase.storage.from('Conversations')
                .upload(convId+'/'+file.fileName, decode(file.base64 as string),
                {cacheControl: '3600', upsert:false, contentType:file.mimeType});
                if(error){
                    console.log("Error in uploadImage function when uploading new image in [...convId].tsx :", error);
                }
                console.log("DATA UPLOAD:", data);
            }
        }catch(error:unknown){
            console.log("Error in uploadImage function [...convId].tsx :", error);
        }finally{

        }
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
                        renderItem={({item}) => (
                            <FlatListMessage message={item}/>
                        //     <Box>
                        //     <HStack reversed={item.sender_id == user.id ? true : false} style={{paddingHorizontal:5}}>
                        //         {item.sender_id != user.id ? 
                        //         <Box style={{borderBlockColor:"blue", borderWidth:1}} width={'20%'}>
                        //             <Text>
                        //                 {item.sender_id}
                        //             </Text>
                        //         </Box>
                        //             : 
                        //         <></>}
                        //         <Box style={
                        //             item.sender_id == user.id ?
                        //             //My message
                        //             {borderBlockColor:"red", borderWidth:1, backgroundColor:'blue'}
                        //             :
                        //             //Other message
                        //             {borderBlockColor:"blue", borderWidth:1, backgroundColor:'grey'}
                        //         } width={'66%'}>
                        //             <Text style={item.sender_id == user.id ? 
                        //                 //My message
                        //                 {textAlign:'right', color:'white'} 
                        //                 : 
                        //                 //Other message
                        //                 {textAlign:'left'}}>
                        //                 {item.content}
                        //             </Text>
                        //         </Box> 
                        //     </HStack>
                        // </Box>
                        )}
                        // keyExtractor={(item, index) => String(index)}
                        keyExtractor={(item) => item.id}
                        // keyExtractor={(item) => item.id}
                        extraData={messages}
                        // onContentSizeChange={scrollToBottom} // To use when new message received.
                        // onEndReached={loadMoreMessages}
                        onEndReached={handleLoadMoreMessage}
                        onMomentumScrollBegin={() => {setCanTriggerLoadMore(true)}}
                        onEndReachedThreshold={0.1}
                        ListFooterComponent={loadingMoreMessages? <Text>LOADING MORE MESSAGES !</Text> : null}
                        onScroll={handleScroll}
                    />
                    {isSeen ? 
                        <Box>
                            <Text style={{textAlign:'left'}}>SEEN !</Text>
                        </Box>
                    : null}
                    {Object.keys(typingUsers).length > 0 && (
                        <Text ml={4} color="$gray400">{Object.keys(typingUsers).join(", ")} is typing...</Text>
                        // <Text ml={4} color="$gray400">Someone is typing...</Text>
                    )}
                    <HStack>
                        <Box style={{borderBlockColor:"red", borderWidth:1}} width={'59%'}>
                            <Input variant="outline" size="md">
                                <InputField placeholder="Write message here..." onChangeText={(text) => {setText(text); sendTypingEvent()}} value={text}/>
                            </Input>
                        </Box>
                        <Box width={'13%'} style={{borderBlockColor:"red", borderWidth:1}}>
                            {loadingSend ? 
                            <Text>SEND !</Text>: 
                            <Button onPress={() => {
                                pickImage();
                            }}>
                                <ButtonText><Ionicons name={'image-sharp'} color={'white'} size={16} /></ButtonText>
                            </Button>
                            }
                        </Box>
                        <Box width={'13%'} style={{borderBlockColor:"red", borderWidth:1}}>
                            {loadingSend ? 
                            <Text>SEND !</Text>: 
                            <Button onPress={() => {
                                console.log('OPEN PHOTO');
                            }}>
                                <ButtonText><Ionicons name={'camera-sharp'} color={'white'} size={16} /></ButtonText>
                            </Button>
                            }
                        </Box>
                        <Box width={'15%'} style={{borderBlockColor:"red", borderWidth:1}}>
                            {loadingSend ? 
                            <Text>SEND !</Text>: 
                            <Button onPress={() => {
                                sendTextMessage(false, 'text');
                            }}>
                                <ButtonText>{'->'}</ButtonText>
                            </Button>
                            }
                        </Box>
                    </HStack>
                </>
            }
        </>
    );
};

export default ConversationScreen;
