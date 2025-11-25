import React, { FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { useUserContext } from '../../../contexts/userContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../libs/initSupabase';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';

import FlatListMessage from '@/components/conversations/FlatListMessage';
import ConversationCommands from '@/components/conversations/conversationCommands';
import { Center } from '@/components/ui/center';
import { Spinner } from '@/components/ui/spinner';
import { HStack } from '@/components/ui/hstack';
import { Ionicons } from '@expo/vector-icons';

import ConversationStorageDatabase from '@/components/conversations/conversationStorage';
import Avatar from '@/components/profile/avatar';

const debounce = (func: { (): Promise<void>; apply?: any; }, delay: number | undefined) => {
    let debounceTimer: string | number | NodeJS.Timeout | undefined;
    return function(...args: any) {
        const context = this;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    }
}

const ConversationScreen = () => {
    
    const PAGE_SIZE = 25; // If changing this, number, be careful of changing it in the rpc function that retrieve first messages at opening, maybe add a parameter for that.

    const [ loading, setLoading ] = useState(false);
    const [ messages, setMessages ] = useState<any[]>([]);
    const [ text, setText ] = useState('');
    const [ participants, setParticipants ] = useState([]);
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
    const [ otherUser, setOtherUser ] = useState(null);

    const { convId } = useLocalSearchParams();
    const { user, theme } = useUserContext();

    const flatListRef = useRef(null);
    const navigation = useNavigation();
    const router = useRouter();

    useEffect(() => {
        console.log("CONV ID :", convId[0]);
        const initConversationStorage = async () => {
            await ConversationStorageDatabase.initDatabase();
            await checkForDeleteMessage();
            const messages = await getLocalConversations();
            setMessages(messages);
        }
        initConversationStorage();
        const fetchConversationData = async () => {
            try{
                // console.log("FETCH CONVERSATION DATA", convId[0], "userId :", user.id);
                setLoading(true);
                const { data: conv_data, error: conv_error } = await supabase.rpc('get_participants_and_token_and_lastmessage', 
                    {'p_conversation_id': convId[0], 'p_user_id':user.id});
                if(conv_error){
                    console.error('Conv_Error :', conv_error);
                }
                // setMessages(conv_data.messages);
                setParticipants(conv_data.participants);
                setDeviceTokens(conv_data.device_tokens);
                if(conv_data.messages.length > 0){
                    readLastMessageStatus(conv_data.messages[0].id);
                }
            }catch(error: unknown){
                console.error('Error in fetchConversation function in [...convId].tsx', error);
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
        if(user){
            console.log('Participants ? :', participants);
            if(participants){

                let other_user = null;
                if(participants.length == 2){
                    other_user = participants.find(item => item.user_id !== user.id) || null;
                    setOtherUser(other_user);
                }
                if(other_user)
                navigation.setOptions({
                    // headerTitle:`${other_user.username}`,
                    headerTitle:``,
                    //Create right part of the header 
                    headerRight: () => {
                    return(
                        <TouchableOpacity onPress={() => {
                            router.push(`/profile/${other_user.user_id}`)
                        }}>
                            <HStack>
                                <Center>
                                    <Text style={{
                                        color:theme.textColor1,
                                        paddingHorizontal:8
                                    }}>{other_user.username}</Text>
                                </Center>
                                <Avatar user_id={other_user.user_id} width={42} height={42}/>

                            </HStack>
                        </TouchableOpacity>
                    )
                    }
                });
            }
        }
    }, [participants])

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
                .limit(1);
            if(deleted_error){
                console.error("Error when fetching last deleted message in checkForDeleteMessage function in [...convId].tsx", deleted_error);
            }
            if(deleted_message == null || deleted_message == undefined){
                console.error("NO DELETED MESSAGE FOUND IN SUPABASE");
                return;
            }
            const local_deleted_message = await ConversationStorageDatabase.getMostRecentDeletedMessage(convId[0]);
            if(!local_deleted_message) return;
            //If the date are the same thats OK, if not we need to get all deleted message between theses two dates and update local message database
            if(deleted_message.deleted_at == local_deleted_message.deleted_at){
                return;
            }else{
                //Get all the deleted message between these two dates
                const { data: deleted_messages, error: deleted_messages_error } = await supabase.rpc('get_deleted_messages_between',
                    {
                    'p_conversation_id': convId[0], 
                    'p_user_id':user.id, 
                    'p_after': local_deleted_message.deleted_at, 
                    'p_before': deleted_message.deleted_at}
                );
                if(deleted_messages_error){
                    console.error("Error when fetching deleted messages in checkForDeleteMessage function in [...convId].tsx", deleted_messages_error);
                }
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
            const messages = await ConversationStorageDatabase.newConversationUpload(convId[0], user.id);
            //Here loadLocalMessages instead of settings message with messages (to avoid much request with images)
            //Like that :
            const local_messages = await ConversationStorageDatabase.loadLocalMessages(convId[0], user.id, 1, PAGE_SIZE);
            return local_messages;
        }else{
            //There is already a conversation !
            await checkMessageDiff();
            const local_messages = await ConversationStorageDatabase.loadLocalMessages(convId[0], user.id, 1, PAGE_SIZE);
            const local_count = await ConversationStorageDatabase.countMessagesConversation(convId[0]);
            setOldestLocalMessage(local_messages[local_messages.length-1].created_at);
            setLocalCount(local_count);
            return local_messages;
        }
    }

    const checkMessageDiff = async () => {
        try{
            // checkForNewReactions();
            checkReactionChangements(convId[0]);
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
                    console.error("Error when fetching message diff in checkMessageDiff function in [...convId].tsx", error);
                }
                //Store the new messages in local Db : 
                await ConversationStorageDatabase.uploadNewMessages(messagesDiff.messages, convId[0], user.id);
            }
        }catch(error: unknown){
            console.error("Error in checkMessageDiff function in [...convId].tsx", error);
            
        }finally{
            setLoadingNewMessages(false);
        }
    }

    async function checkReactionChangements(convId: string) {
         // 1. Récupération des données
        const all_local_reaction = await ConversationStorageDatabase.getAllReaction(convId);
        const { data: all_reactions_comparation, error } = await supabase
            .from('message_reactions')
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Erreur Supabase:", error);
            return;
        }

        // 2. Convertir en map pour comparer plus vite
        const localMap = new Map(all_local_reaction.map(r => [`${r.message_id}_${r.user_id}`, r]));
        const remoteMap = new Map(all_reactions_comparation.map(r => [`${r.message_id}_${r.user_id}`, r]));

        // 3. Création des tableaux d'actions
        const toDelete = [];
        const toAdd = [];
        const toUpdate = [];

        // 🔸 Supprimer ce qui n'existe plus sur le remote
        for (const [key, localReaction] of localMap.entries()) {
            if (!remoteMap.has(key)) {
            toDelete.push(localReaction);
            }
        }

        // 🔸 Ajouter ou mettre à jour les réactions différentes
        for (const [key, remoteReaction] of remoteMap.entries()) {
            const localReaction = localMap.get(key);
            if (!localReaction) {
            // Pas en local → à ajouter
            toAdd.push(remoteReaction);
            } else if (localReaction.reaction !== remoteReaction.reaction) {
            // Différente → à mettre à jour
            toUpdate.push(remoteReaction);
            }
        }

        // 4. Application des modifications locales
        for (const r of toDelete) {
            await ConversationStorageDatabase.deleteReaction(r.id);
        }
        for (const r of toAdd) {
            await ConversationStorageDatabase.insertReaction({
            id:r.id,
            user_id:r.user_id,
            reaction:r.reaction,
            created_at:r.created_at
        }, r.message_id, r.conversation_id);
        }
        for (const r of toUpdate) {
            await ConversationStorageDatabase.updateReaction({
            id:r.id,
            user_id:r.user_id,
            reaction:r.reaction,
            created_at:r.created_at
        }, r.message_id, r.conversation_id);
        }

    }
    
    

    const fetchAttachments = async(msg_id: string) => {
        try{
            const { data: attach_data, error: attach_error } = await supabase.from('attachments').select('*').eq('message_id', msg_id);
            if(attach_error){
                console.error('Error in fetchAttachments function when fetching attachements in [...convId].tsx', attach_error);
            }
            return attach_data;
        }catch(error: unknown){
            console.error('Error in fetchAttachments function in [...convId].tsx', error);
        }finally{

        }
    }

    useEffect(() => {
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

        return() => {
            insertAndDeleteChannels.unsubscribe();
        };
    }, [isAtBottom, messages])

    const handleDeletedMessage = (payload: any) => {
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
            payload.new.attachments = [];
            let attempts = 0;
            let maxAttempts = 13;
            const delay= 900;
            let result;
            while(attempts < maxAttempts){
                attempts++;
                console.info(`Waiting for file upload... Attempt ${attempts + 1}`);
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
        setMessages((prev) => [ payload.new, ...prev]);
        setOffset((prevOffset) => prevOffset + 1);
        if(payload.new.user_id != user.id && isAtBottom){
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
            if(message == null || message == undefined ){
                const { data: message_data, error: message_error } = await supabase.from('messages').select('content, type').eq('id', replied_id).single();
                if(message_error){
                    console.error('Error in getOrFetchResponse function when fetching replied message in [...convId].tsx', message_error);
                }
                message = message_data;
            }
            return { "reply_content": message.content, "reply_type": message.type };
            
        }catch(error: unknown){
            console.error("Error in getOrFetchResponse function in [...convId].tsx", error);
        }finally{

        }
    }

    const handleNewReactionReceived = async(payload: any) => {
        //Edit main message state variable
        setMessages(prevMessages =>
            prevMessages.map(message =>
              message.id === payload.new.message_id
                ? { ...message, reactions: [...message.reactions, {"reaction":payload.new.reaction, "created_at":payload.new.created_at,"user_id": payload.new.user_id, "id": payload.new.id}] }
                : message
            )
          );
    }

    const handleDeleteReaction = async(payload: any) => {
        console.log("MESSAGES :", messages[0]);
        setMessages(prevMessages =>
            prevMessages.map(message => ({
                ...message,
                reactions: message.reactions.filter(reaction => reaction.id !== payload.old.id)
            }))
        );
        console.log("MESSAGE :")
        // console.error("DELETE REACTION NEED TO BE HANDLED HERE (handleDeleteReaction in ConversationScreen in [...convId].tsx):", payload);
        await ConversationStorageDatabase.deleteReaction(reaction.id);
    }

    /** -------------------------------------------------------
     *  ==== ====  S E N D   T E X T   M E S S A G E  ==== ====
     * @returns message_id id of the freshly created conversation.
     */
    const sendTextMessage = async(has_attachement: boolean, type: string) => {
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
            if(send_error){
                console.error('Error in sendTextMessage when inserting text message function in [...convId].tsx', send_error);
            }else {
                message_id = send_data[0].id; // Extract the ID properly
            }
        }catch(error: unknown){
            console.error('Error in sendTextMessage function in [...convId].tsx', error);
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
            const { data: messages_data, error: conv_error } = await supabase.rpc(
                'load_more_messages', 
                {'p_conversation_id': convId[0], 'p_user_id':user.id, p_page:page+1});
            if(conv_error){
                console.error('Conv_Error :', conv_error);
            }else{
                setPage(page+1)
            }
            if(messages_data?.length != 0){
                const newMessageArray: any = messages_data.messages;
                setMessages((prev) => {const data = [...prev, ...newMessageArray]; const uniqueData = Array.from(new Set(data)); return uniqueData});
            }else{
                //Here put some infos about users in conv (carroussel with profiles)
                setEndReached(true);
            }
        }catch(error: unknown){
          console.error('Error in loadMoreMessages function in [...convId].tsx', error);
        }finally{
          setLoadingMoreMessages(false);
          setCanTriggerLoadMore(true);
      }
    }, [loadingMoreMessages, offset]);

    const loadMoreMessagesV2 = useCallback(async() => {
        if (!canTriggerLoadMore || loadingMoreMessages || endReached ) return;

        try{
            setCanTriggerLoadMore(false);
            setLoadingMoreMessages(true);
            //Get lasts messages.
            //Check if length < PAGE_SIZE if that's the case that means there is no more local messages 
            //Also check if length = 0 but that is already made by the check page_size
            // if last date is the same as oldestLocalMessage
            let next_messages;
            if(oldestLocalMessage == null) throw new Error("Can't load oldest message because 'oldestLocalMessage' state variable is null ... in loadMoreMessagesV2 in [...convId].tsx")
            if(messages.length < localCount){
                //FETCH LOCAL DATABASE
                let number_of_messages_to_fetch = localCount - messages.length
                if(number_of_messages_to_fetch > PAGE_SIZE){
                    number_of_messages_to_fetch = PAGE_SIZE;
                }
                next_messages = await ConversationStorageDatabase.getMessagesAfterDate(convId[0], oldestLocalMessage.toString(), number_of_messages_to_fetch);
                // console.log("DATA FROM RPC load_more_messages_cursor :", next_messages);
            }else{
                //FETCH SUPABASE
                const { data, error } = await supabase.rpc('load_more_messages_cursor',
                    {
                        'p_conversation_id': convId[0],
                        'p_user_id': user.id,
                        'p_before': new Date(oldestLocalMessage),
                        'p_limit': PAGE_SIZE
                });
                if(error){
                    console.error("Error in when loading more message in loadMoreMessageV2 function in [...convId].tsx", error);
                }
                // console.log("DATA FROM RPC load_more_messages_cursor :", data);
                next_messages = data.messages;
                await ConversationStorageDatabase.uploadNewMessages(next_messages, convId[0], user.id);

            }
            //Set new oldestLocalMessage
            setOldestLocalMessage(next_messages[next_messages.length-1].created_at);
            
            next_messages = await ConversationStorageDatabase.getMessagesAfterDate(convId[0], oldestLocalMessage.toString(), PAGE_SIZE);
            setMessages((prev) => {const data = [...prev, ...next_messages]; const uniqueData = Array.from(new Set(data)); return uniqueData});
            
            // const local_messages = await ConversationStorageDatabase.loadLocalMessages(convId[0], user.id, page+1, PAGE_SIZE);
        
        }catch(error: unknown){
            console.error('Error in loadMoreMessageV2 function in [...convId].tsx', error);
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
                console.error('Error in markMessageAsRead when trying to mark message as read function in [...convId].tsx', rpc_error);
            }
        }catch(error:unknown){
            console.error('Error in markMessageAsRead function in [...convId].tsx', error);
        }
    }
    
    /** ---------------------------------------------------------------------
     *  ==== ====  R E A D   L A S T   M E S S A G E   S T A T U S  ==== ====
     * @param message_id 
     */
    const readLastMessageStatus = async(message_id: any) => {
        try{
            const { data: last_status, error: error_status } = await supabase.from('message_status').select('*').eq('message_id',message_id).neq('user_id',user.id);
            if(error_status){
                console.error('Error in readLastMessageStatus when trying to read last message_status function in [...convId].tsx', error_status);
            }
            if(last_status?.length != 0){
                setIsSeen(true);
            }
        }catch(error:unknown){
            console.error('Error in readLastMessageStatus function in [...convId].tsx', error);
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

    const styles = StyleSheet.create({
        container:{
            backgroundColor: theme.backgroundColor1,
            flex:1
        }
    });

    return(
        <Box style={[styles.container]}>
            { loading ?
                <Text>LOADING !!!</Text>
            :
                <>
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
                                    <Text style={{textAlign:'left', color:theme.textColor1}}>SEEN !</Text>
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
                                {/** ANSWER TO A MESSAGE, display the message that we answer */}
                                <HStack>
                                    <Box style={{padding:5, backgroundColor:"rgba(220,220,220,0.4)", borderRadius:10}}>
                                        <Ionicons name={'return-up-back-outline'} color={theme.iconColor4} size={32}/>
                                    </Box>
                                    <Box style={{justifyContent:'center', alignItems:'center', paddingLeft:5}}>
                                        <Text numberOfLines={1}>
                                            {replyToContent}
                                            {replyToType == 'attachment' ? <Ionicons name={'image-outline'} color={theme.iconColor4} size={23}/> : null}
                                            {replyToType == 'audio' ? <Ionicons name={'mic-outline'} color={theme.iconColor4} size={23}/> : null}
                                        </Text>
                                    </Box>
                                    <TouchableOpacity onPress={() => {setReplyTo(null); setReplyToContent(null); setReplyToType(null)}} style={{position:'absolute',right:0}}>
                                        <Ionicons name={'close-circle-outline'} color={theme.iconColor4} size={32}/>
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
        </Box>
    );
};

export default ConversationScreen;
