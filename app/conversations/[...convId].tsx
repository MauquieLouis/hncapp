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

import ConversationStorageDatabase from '@/components/conversations/conversationStorage';

const debounce = (func: { (): Promise<void>; apply?: any; }, delay: number | undefined) => {
    let debounceTimer: string | number | NodeJS.Timeout | undefined;
    return function(...args: any) {
        const context = this;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    }
}


const ConversationScreen = () => {
    
    const PAGE_SIZE = 10; // If changing this, number, be careful of changing it in the rpc function that retrieve first messages at opening, maybe add a parameter for that.

    const [ loading, setLoading ] = useState(false);
    const [ messages, setMessages ] = useState<any[]>([]);
    const [ text, setText ] = useState('');
    const [ participants, setParticipants ] = useState(null);
    const [ devicesTokens, setDeviceTokens ] = useState<string[]>([]);
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
    const [ page, setPage ] = useState(1);
    const [ loadingNewMessages, setLoadingNewMessages ] = useState(false);
    const [ oldestLocalMessage, setOldestLocalMessage ] = useState(null);
    const [ localCount, setLocalCount ] = useState(0);

    const { convId } = useLocalSearchParams();
    const { user } = useUserContext();

    const flatListRef = useRef(null);

    // let storage: MMKV;
    // storage = new MMKV({
    //     id: `user-${user.id}-storage`,
    //     encryptionKey: 'hunter2',
    // });
    useEffect(() => {
        console.log("CONVERSATION ID :", convId[0]);
        const initConversationStorage = async () => {
            await ConversationStorageDatabase.initDatabase();
            await checkForDeleteMessage();
            const messages = await getLocalConversations();
            setMessages(messages);
        }
        initConversationStorage();
        const fetchConversationData = async () => {
            try{
                setLoading(true);
                const { data: conv_data, error: conv_error } = await supabase.rpc('get_participants_and_token_and_lastmessage', 
                    {'p_conversation_id': convId[0], 'p_user_id':user.id});
                if(conv_error){
                    console.error('Conv_Error :', conv_error);
                }
                // console.log("conv_data :", conv_data.messages);
                // setMessages(conv_data.messages);
                setParticipants(conv_data.participants);
                setDeviceTokens(conv_data.device_tokens);
                readLastMessageStatus(conv_data.messages[0].id);
            }catch(error: unknown){
                console.error('Error in fetchConversation function in Messagings.tsx', error);
            }finally{
                setLoading(false);
            }
        }
        markMessageAsRead();
        fetchConversationData();
        subscribeToTypingStatus();
        subscrbeToMessagesStatus();
    }, []);

    useEffect(() => {
        console.log("DEVICE TOKENS :", devicesTokens);
    }, [devicesTokens])

    const checkForDeleteMessage = async() => {
        try{
            setLoading(true);
            //Get the most recent date of deleted message in local db
            //Get the most recent date of deleted message in supabase
            const { data: deleted_message, error: deleted_error } = await supabase
                .from('messages')
                .select('deleted_at')
                .eq('conversation_id', convId[0])
                .order('deleted_at', { ascending: false })
                .not('deleted_at', 'is', null)
                .limit(1)
                .single();
            if(deleted_error){
                console.log("Error when fetching last deleted message in checkForDeleteMessage function in [...convId].tsx", deleted_error);
            }
            console.log("DELETED MESSAGE :", deleted_message);
            if(deleted_message == null || deleted_message == undefined){
                console.log("NO DELETED MESSAGE FOUND IN SUPABASE");
                return;
            }
            const local_deleted_message = await ConversationStorageDatabase.getMostRecentDeletedMessage(convId[0]);
            console.log("LOCAL DELETED MESSAGE :", local_deleted_message);
            if(!local_deleted_message) return;
            //If the date are the same thats OK, if not we need to get all deleted message between theses two dates and update local message database
            if(deleted_message.deleted_at == local_deleted_message.deleted_at){
                return;
            }else{
                console.log("DELETED MESSAGE FOUND IN LOCAL DB");
                //Get all the deleted message between these two dates
                const { data: deleted_messages, error: deleted_messages_error } = await supabase.rpc('get_deleted_messages_between',
                    {
                    'p_conversation_id': convId[0], 
                    'p_user_id':user.id, 
                    'p_after': local_deleted_message.deleted_at, 
                    'p_before': deleted_message.deleted_at}
                );
                console.log("PARMAS ----> ", convId[0], user.id, local_deleted_message.deleted_at, deleted_message.deleted_at);
                if(deleted_messages_error){
                    console.log("Error when fetching deleted messages in checkForDeleteMessage function in [...convId].tsx", deleted_messages_error);
                }
                console.log("DELETED MESSAGES :", deleted_messages);
                await ConversationStorageDatabase.updateDeletedMessages(deleted_messages, convId[0], user.id);
            }
        }catch(error: unknown){
            console.error("Error in checkForDeleteMessage function in [...convId].tsx", error);
        }finally{
            setLoading(false);
        }
    }
    
    const getLocalConversations = async () => {
        // await ConversationStorageDatabase.clearDatabaseAndFiles();

        const localConversation = await ConversationStorageDatabase.getConversationById(convId[0]);
        if(localConversation == null || localConversation == undefined || localConversation.length == 0){
            // console.log("NO CONVERSATION FOUND IN LOCAL DB, FETCHING FROM SUPABASE...");
            const messages = await ConversationStorageDatabase.newConversationUpload(convId[0], user.id);
            //Here loadLocalMessages instead of settings message with messages (to avoid much request with images)
            //Like that :
            const local_messages = await ConversationStorageDatabase.loadLocalMessages(convId[0], user.id, 1, PAGE_SIZE);
            return local_messages;
        }else{
            //There is already a conversation !
            console.log("CHECK FOR MESSAGE DIFF");
            await checkMessageDiff();
            console.log("MESSAGE DIFF HAVE BEEN PROCESS")
            const local_messages = await ConversationStorageDatabase.loadLocalMessages(convId[0], user.id, 1, PAGE_SIZE);
            const local_count = await ConversationStorageDatabase.countMessagesConversation(convId[0]);
            console.log(" === LOCAL MESSAGES.length", local_messages.length);
            console.log("LOCAL COUNT REQUEST :", local_count);
            console.log("OLDEST DATE MESSAGES :", local_messages[local_messages.length-1].created_at, local_messages[local_messages.length-1].content);
            setOldestLocalMessage(local_messages[local_messages.length-1].created_at);
            setLocalCount(local_count);
            return local_messages;
        }
    }

    const checkMessageDiff = async () => {
        try{
            setLoadingNewMessages(true);
            const last_local_message_timestamp = await ConversationStorageDatabase.getLastMessageForConversationId(convId[0]);
            const { data: last_supabase_message, error } = await supabase
                .from('messages')
                .select('created_at')
                .eq('conversation_id', convId[0])
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if(last_local_message_timestamp == last_supabase_message){
                //Everything is ok, same message on remote server and in local
                setLoadingNewMessages(false);
                return;
            }else{
                //Must load all the message between
                const { data: messagesDiff, error: messageDiffError } = await supabase.rpc('load_more_messages_after_date',
                    {'p_conversation_id': convId[0], 'p_user_id': user.id, 'p_after': last_local_message_timestamp}
                );
                if(messageDiffError){
                    console.log("Error when fetching message diff in checkMessageDiff function in [...convId].tsx", error);
                }
                //Store the new messages in local Db : 
                await ConversationStorageDatabase.uploadNewMessages(messagesDiff.messages, convId[0], user.id);
            }
        }catch(error: unknown){
            console.log("Error in checkMessageDiff function in [...convId].tsx", error);
            
        }finally{
            setLoadingNewMessages(false);
        }
    }

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
        // console.log("is at bottom CHANGE : ", isAtBottom);
        if(isAtBottom) markMessageAsRead();
        /** ---------------------------------------------------------------
         *  ==== ====  S U B S C R I B E   T O   M E S S A G E S  ==== ====
         */
        const insertAndDeleteChannels = supabase.channel(`conversation-messages-${convId[0]}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table:'messages', filter:'conversation_id=eq.'+convId[0]}, handleReceivedMessage)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table:'messages', filter:'conversation_id=eq.'+convId[0]}, handleDeletedMessage)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table:'message_reactions', filter:'conversation_id=eq.'+convId[0]}, handleNewReactionReceived)
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table:'message_reactions'}, handleDeleteReaction)
        .subscribe();
        // console.log("|+| SUBSCRIBE SUPABASE CHANNELS");

        return() => {
            // console.log("|-| UNSUBSCRIBE SUPABASE CHANNELS");
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
        console.log("new message type :", payload.new.type);
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
        if(payload.new.replied_to_id != null){
            const msg_response = await getOrFetchResponse(payload.new.replied_to_id);
            payload.new.reply_content = msg_response?.reply_content;
            payload.new.reply_type = msg_response?.reply_type;
        }
        payload.new.reactions = [];         //Add this to avoid style issue with the marginBottom 
        console.log("PAYLOAD :",payload);
        setMessages((prev) => [ payload.new, ...prev]);
        setOffset((prevOffset) => prevOffset + 1);
        // console.log("IS AT BOTTOM :", isAtBottom);
        if(payload.new.user_id != user.id && isAtBottom){
            console.log("NOT SUPPOSED TO SCROLL TO BOTTOM !!!!");
            console.log("OFFSET :", offset);
            markMessageAsRead();
        }
        setLoadingNewImage(false);
    }

    const getOrFetchResponse = async(replied_id: any) => {
        try{
            //First check if the id of replied_to_id field is in the messages state variable.
            //If not, fetch it from the database.
            let message = null;
            message = messages.find(msg => msg.id === replied_id);
            console.log("MEssage after local find : ", message);
            if(message == null || message == undefined ){
                const { data: message_data, error: message_error } = await supabase.from('messages').select('content, type').eq('id', replied_id).single();
                if(message_error){
                    console.log('Error in getOrFetchResponse function when fetching replied message in [...convId].tsx', message_error);
                }
                message = message_data;
                console.log("NO local message, fetch it :", message);
            }
            return { "reply_content": message.content, "reply_type": message.type };
            
        }catch(error: unknown){
            console.log("Error in getOrFetchResponse function in [...convId].tsx", error);
        }finally{

        }
    }

    const handleNewReactionReceived = async(payload: any) => {
        //Edit main message state variable
        console.log("PAYLOAD : ", payload.new)
        setMessages(prevMessages =>
            prevMessages.map(message =>
              message.id === payload.new.message_id
                ? { ...message, reactions: [...message.reactions, {"reaction":payload.new.reaction, "created_at":payload.new.created_at,"user_id": payload.new.user_id, "id": payload.new.id}] }
                : message
            )
          );
    }

    const handleDeleteReaction = async(payload: any) => {
        console.log("DELETE REACTION NEED TO BE HANDLED HERE :", payload);
        setMessages(prevMessages =>
            prevMessages.map(message => ({
                ...message,
                reactions: message.reactions.filter(reaction => reaction.id !== payload.old.id)
            }))
        );
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
            sendPushNotification(devicesTokens);
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
            if(token.startsWith('ExponentPushToken[')){
                let body_notif = text;
                if(text.trim() === '') body_notif='-Send-Attachment-';
                console.log("SEND PUSH NOTIFICATION TO TOKEN :", token);
                const notif = {
                    to: token,
                    sound: 'default',
                    title: convId[0],
                    body: body_notif,
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
            // const { data: messages_data, error: messages_error } = await supabase.from('messages')
            // .select('id, content, created_at, sender_id, type, has_attachment')
            // .eq('conversation_id', convId[0])
            // .is('deleted_at', null)
            // .order('created_at', { ascending: false})
            // .range(offset,offset+PAGE_SIZE-1);
            // if(messages_error){
            //       console.log('Error in fetchMessages  when fetching messages in [...convId].tsx', messages_error);
            //     }
            const { data: messages_data, error: conv_error } = await supabase.rpc(
                'load_more_messages', 
                {'p_conversation_id': convId[0], 'p_user_id':user.id, p_page:page+1});
            if(conv_error){
                console.log('Conv_Error :', conv_error);
            }else{
                setPage(page+1)
            }
            // console.log("MORE MESSAGES :", messages_data);
            if(messages_data?.length != 0){
                const newMessageArray: any = messages_data.messages;
                setMessages((prev) => {const data = [...prev, ...newMessageArray]; const uniqueData = Array.from(new Set(data)); return uniqueData});
                // setMessages((prev) => {const data = [...prev, ...newMessageArray]; const uniqueData = Array.from(new Set(data)); return uniqueData});
                // if(newMessageArray){
                //     for(let message of newMessageArray){
                //         if(message.type == 'attachment' || message.type == 'audio'){
                //             const result = await fetchAttachments(message.id);
                //             message.attachments = result;
                //         }
                //     }
                //     setMessages((prev) => {const data = [...prev, ...newMessageArray]; const uniqueData = Array.from(new Set(data)); return uniqueData});
                //     setOffset(offset+PAGE_SIZE);
                // }
            }else{
                console.log("END REACHED NO MORE MESSAGES WILL BE LOADED...");
                //Here put some infos about users in conv (carroussel with profiles)
                setEndReached(true);
            }
        }catch(error: unknown){
          console.log('Error in loadMoreMessages function in [...convId].tsx', error);
        }finally{
          setLoadingMoreMessages(false);
          setCanTriggerLoadMore(true);
      }
    }, [loadingMoreMessages, offset]);

    // useEffect(() => {
    //     console.log(" !!! OLDEST LOCAL MESSAGE CHANGED !!", oldestLocalMessage);
    // }, [oldestLocalMessage])

    const loadMoreMessagesV2 = useCallback(async() => {
        console.log("INSIDE LOAD MORE MESSAGES : (canTriggerLoadMore , loadingMoreMessages) = (", canTriggerLoadMore,(','), loadingMoreMessages,").");
        if (!canTriggerLoadMore || loadingMoreMessages || endReached ) return;

        try{
            setCanTriggerLoadMore(false);
            setLoadingMoreMessages(true);
            // |- 1 -| : Try to load 50 more message from local DB
            // |- 2 -| : Check if there is 50 message : if not, count how much there is, andl oad the 50 more from supabase (and store them locally)
            // |- 3 -| : If there is no more message in local db fetch from supabase
            // |- 4 -| : load them in state and upload them in local db
            // |- 5 -|
            // |- 6 -|
            
            //Get lasts messages.
            //Check if length < PAGE_SIZE if that's the case that means there is no more local messages 
            //Also check if length = 0 but that is already made by the check page_size
            // if last date is the same as oldestLocalMessage
            let next_messages;
            console.log("message.length <= localCount :", messages.length, "<=", localCount);
            if(oldestLocalMessage == null) throw new Error("Can't load oldest message because 'oldestLocalMessage' state variable is null ... in loadMoreMessagesV2 in [...convId].tsx")
            console.log(" *-*-*-*-*-*- oldestLocalMessage : ", oldestLocalMessage,
                " ---- ",
                oldestLocalMessage.toString(), 
                " ---- ", 
                new Date(oldestLocalMessage),
            " ----- ",
            Math.floor(oldestLocalMessage/1000),
            " ----- ",
            oldestLocalMessage/1000
            );
            if(messages.length < localCount){
                //FETCH LOCAL DATABASE
                console.log("FETCH LOCAL DATABASE");
                let number_of_messages_to_fetch = localCount - messages.length
                if(number_of_messages_to_fetch > PAGE_SIZE){
                    number_of_messages_to_fetch = PAGE_SIZE;
                }
                console.log("NUMBER OF MESSAGES TO FETCH :", number_of_messages_to_fetch);
                next_messages = await ConversationStorageDatabase.getMessagesAfterDate(convId[0], oldestLocalMessage.toString(), number_of_messages_to_fetch);
            }else{
                //FETCH SUPABASE
                console.log("FETCH SUPABASE before", (oldestLocalMessage));
                const { data, error } = await supabase.rpc('load_more_messages_cursor',
                    {
                        'p_conversation_id': convId[0],
                        'p_user_id': user.id,
                        'p_before': new Date(oldestLocalMessage),
                        'p_limit': PAGE_SIZE
                });
                console.log("UPLOAD NEW MESSAGES DONE ! ---*****")
                if(error){
                    console.error("Error in when loading more message in loadMoreMessageV2 function in [...convId].tsx", error);
                }
                next_messages = data.messages;
                await ConversationStorageDatabase.uploadNewMessages(next_messages, convId[0], user.id);

            }
            // console.log("->->->->->Next_messages", next_messages)
            //Set new oldestLocalMessage
            console.log("New oldest date :", next_messages[next_messages.length-1].created_at);
            setOldestLocalMessage(next_messages[next_messages.length-1].created_at);
            
            next_messages = await ConversationStorageDatabase.getMessagesAfterDate(convId[0], oldestLocalMessage.toString(), PAGE_SIZE);
            console.log("DOWNLOAD NEW MESSAGES DONE ! ---*****")
            setMessages((prev) => {const data = [...prev, ...next_messages]; const uniqueData = Array.from(new Set(data)); return uniqueData});
            
            // const local_messages = await ConversationStorageDatabase.loadLocalMessages(convId[0], user.id, page+1, PAGE_SIZE);
        
        }catch(error: unknown){
            console.log('Error in loadMoreMessageV2 function in [...convId].tsx', error);
        }
        finally{
            setLoadingMoreMessages(false);
            setCanTriggerLoadMore(true);
        }
    },[loadingMoreMessages, offset, oldestLocalMessage]);

    // const debouncedFetchData = useCallback(debounce(loadMoreMessages, 300), [loadMoreMessages]);
    const debouncedFetchData2 = useCallback(debounce(loadMoreMessagesV2, 300), [loadMoreMessagesV2]);

    const handleLoadMoreMessage = () => {
        /**
         *  -------- TODO ----------
        //Set here the loading icon message
         */
        if(messages.length < PAGE_SIZE) return;
        console.log("++++++ handle Load More Messages ++++++");
        debouncedFetchData2();
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
        // console.log("contentOffset", contentOffset.y);
        setScrollY(contentOffset.y);
        setIsAtBottom(atTop); //It's call bottom here because flatlist is inverted.

        // const offsetY = event.nativeEvent.contentOffset.y;
        // console.log("OFFSET Y :", contentOffset.y);
        // if (contentOffset.y < 50) {
        //     handleLoadMoreMessage();
        // }

        
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
            }, 2000);
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
            console.log("READ LAST MESSAGE STATUS MESSAGE ID :", message_id);
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
                    scrollY={scrollY}
                    convId={convId}/>
    }

    return(
        <>
            { loading ?
                <Text>LOADING !!!</Text>
            :
                <>
                    {/* <Text>CONVERSATION ID : {convId[0]}</Text> */}
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
                        onEndReachedThreshold={0.28}
                        ListFooterComponent={loadingMoreMessages? <Center>
                            <Spinner size="large" color={"blue"}/>
                        </Center>  : null}
                        onScroll={handleScroll}
                        removeClippedSubviews={true}
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
