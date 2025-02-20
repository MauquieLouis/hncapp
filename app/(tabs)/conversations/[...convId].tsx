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

const ConversationScreen = () => {

    const PAGE_SIZE = 20; // If changing this, number, be careful of changing it in the rpc function that retrieve first messages at opening, maybe add a parameter for that.

    const [ loading, setLoading ] = useState(false);
    const [ messages, setMessages ] = useState(null);
    const [ text, setText ] = useState('');
    const [ participants, setParticipants ] = useState(null);
    const [ loadingSend, setLoadingSend ] = useState(false);
    const [ typingUsers, setTypingUsers ] = useState({});
    const [ loadingMoreMessages, setLoadingMoreMessages ] = useState(false);
    const [ canTriggerLoadMore, setCanTriggerLoadMore ] = useState(true);
    const [ endReached, setEndReached ] = useState(false);
    const [ isTyping, setIsTyping ] = useState(false);
    const [ offset, setOffset ] = useState(PAGE_SIZE);
    const [ isAtBottom, setIsAtBottom ] = useState(true);
    const [ isSeen, setIsSeen] = useState(false);

    const { convId } = useLocalSearchParams();
    const { user } = useUserContext();
    
    const bottomRef = useRef(isAtBottom);
    const flatListRef = useRef(null);

    useEffect(() => {
        const fetchConversationData = async () => {
            try{
                setLoading(true);
                console.log("CONVID : ", convId);
                const { data: conv_data, error: conv_error } = await supabase.rpc('get_conversation_messages2', {'p_conversation_id': convId[0], 'p_user_id':user.id})
                if(conv_error){
                    console.log('Conv_Error :', conv_error);
                }
                console.log('CONV_DATA :', conv_data);
                setMessages(conv_data.messages);
                setParticipants(conv_data.participants);
                console.log("DATASSSS :", conv_data.messages[0].id);
                readLastMessageStatus(conv_data.messages[0].id)
            }catch(error: unknown){
                console.log('Error in fetchConversation function in Messagings.tsx', error);
            }finally{
                setLoading(false);
            }
        }
        markMessageAsRead();
        fetchConversationData();
        // subscribeToMessages();
        subscribeToTypingStatus();
        subscrbeToMessagesStatus();
    }, []);

    useEffect(() => {
        console.log("is at bottom CHANGE : ", isAtBottom);
        if(isAtBottom) markMessageAsRead();
        const channel = supabase.channel(`conversation-messages-${convId[0]}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table:'messages', filter:'conversation_id=eq.'+convId[0]},
            (payload) => {
                setIsSeen(false);
                setMessages((prev) => [ payload.new, ...prev]);
                setOffset((prevOffset) => prevOffset + 1);
                console.log("IS AT BOTTOM :", isAtBottom);
                if(payload.new.user_id != user.id && isAtBottom){
                // console.log("IS AT BOTTOM :", bottomRef.current);
                // if(payload.new.user_id != user.id && bottomRef.current){
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
     * @returns 
     */
    const sendTextMessage = async() => {
      if (text.trim() === '') {
        return;
      }
        try{
            setLoadingSend(true);
            const { error: send_error } = await supabase.from('messages').insert({
                content: text,
                sender_id: user.id,
                conversation_id: convId[0],
                type:'text', // Can be text, file, vocal, image, video
                has_attachment: false,
            });
            if(send_error){
                console.log('Error in sendTextMessage when inserting text message function in conversation.tsx', send_error);
            }
        }catch(error: unknown){
            console.log('Error in sendTextMessage function in conversation.tsx', error);
        }finally{
            // setOffset(offset+1);
            // setOffset((prevOffset) => prevOffset + 1);
            console.log("OFFSEEEETTTT :", offset);
            setIsSeen(false);
            setText('');
            setLoadingSend(false);
        }
    };

    /** ----------------------------------------------------------
     *  ==== ====  L O A D   M O R E    M E S S A G E S  ==== ====
     * @returns 
     */
    const loadMoreMessages = async() => {
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
                  console.log('Error in fetchMessages  when fetching messages in conversation.tsx', messages_error);
                }
                console.log('MESSAGES_DATA :', messages_data);
              if(messages_data?.length != 0){
                setMessages((prev) => [...prev, ...messages_data]);
                setOffset(offset+PAGE_SIZE);
              }else{
                console.log("END REACHED NO MORE MESSAGES WILL BE LOADED...");
                //Here put some infos about users in conv (carroussel with profiles)
                setEndReached(true);
              }
        }catch(error: unknown){
          console.log('Error in fetchMessages function in conversation.tsx', error);
        }finally{
          setLoadingMoreMessages(false);
          setCanTriggerLoadMore(true);
      }
    };

    /** ---------------------------------------------------------------
     *  ==== ====  S U B S C R I B E   T O   M E S S A G E S  ==== ====
     */
    // const handleReceiveMessage = useCallback((payload: any) => {
        
    // }, [isAtBottom]);

    // const subscribeToMessages = () => {
    //     supabase.channel(`conversation-messages-${convId[0]}`)
    //     .on('postgres_changes', { event: 'INSERT', schema: 'public', table:'messages'},
    //         (payload) => {
    //             setIsSeen(false);
    //             setMessages((prev) => [ payload.new, ...prev]);
    //             setOffset((prevOffset) => prevOffset + 1);
    //             console.log("IS AT BOTTOM :", isAtBottom);
    //             if(payload.new.user_id != user.id && isAtBottom){
    //             // console.log("IS AT BOTTOM :", bottomRef.current);
    //             // if(payload.new.user_id != user.id && bottomRef.current){
    //                 console.log("NOT SUPPOSED TO SCROLL TO BOTTOM !!!!");
    //                 console.log("OFFSET :", offset);
    //                 markMessageAsRead();
    //                 // scrollToBottom();
    //             }
                
    //         }
    //     ).subscribe();
    // };

    /** ---------------------------------------------------------------------------
     *  ==== ====  S U B S C R I B E   T O   M E S S A G E   S T A T U S  ==== ====
     */
    const subscrbeToMessagesStatus = () => {
        supabase.channel(`conversation-messages-status-${convId[0]}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table:'message_status'},
            (payload) => {
                console.log("IS SEENN ADDDDEEEEDDD !!");
                if(payload.new.user_id != user.id){
                    setIsSeen(true);
                    console.log("NOT ME SEEING MESSAGE");
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
        // console.log("AT BOTTOM ? ", atBottom);
        // Check if the user is at the top (small threshold to allow minor scrolling)
        const atTop = contentOffset.y <= 10; // Adjust threshold if needed
        // console.log("AT TOP?", atTop);

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
            //1st select all unread messages
            console.log("CONVID ", convId, convId[0]);

            const { data, error: rpc_error } = await supabase.rpc('mark_messages_as_read', {'p_user_id': user.id, 'p_conversation_id': convId[0]});
            if(rpc_error){
                console.log('Error in markMessageAsRead when trying to mark message as read function in conversation.tsx', rpc_error);
            }
        }catch(error:unknown){
            console.log('Error in markMessageAsRead function in conversation.tsx', error);
        }finally{
            
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
                console.log('Error in readLastMessageStatus when trying to read last message_status function in conversation.tsx', error_status);
            }
            if(last_status?.length != 0){
                console.log("LAST_READ_MESSAGE : ", last_status);
                setIsSeen(true);
            }
        }catch(error:unknown){
            console.log('Error in readLastMessageStatus function in conversation.tsx', error);
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
                            <Box>
                                <HStack reversed={item.sender_id == user.id ? true : false} style={{paddingHorizontal:5}}>
                                    {item.sender_id != user.id ? 
                                    <Box style={{borderBlockColor:"blue", borderWidth:1}} width={'20%'}>
                                        <Text>
                                            {item.sender_id}
                                        </Text>
                                    </Box>
                                        : 
                                    <></>}
                                    <Box style={
                                        item.sender_id == user.id ?
                                        //My message
                                        {borderBlockColor:"red", borderWidth:1, backgroundColor:'blue'}
                                        :
                                        //Other message
                                        {borderBlockColor:"blue", borderWidth:1, backgroundColor:'grey'}
                                    } width={'66%'}>
                                        <Text style={item.sender_id == user.id ? 
                                            //My message
                                            {textAlign:'right', color:'white'} 
                                            : 
                                            //Other message
                                            {textAlign:'left'}}>
                                            {item.content}
                                        </Text>
                                    </Box> 
                                </HStack>
                            </Box>
                        )}
                        keyExtractor={(item) => item.id}
                        // onContentSizeChange={scrollToBottom} // To use when new message received.
                        onEndReached={loadMoreMessages}
                        onMomentumScrollBegin={() => {setCanTriggerLoadMore(true)}}
                        onEndReachedThreshold={0.1}
                        ListFooterComponent={loadingMoreMessages? <Text>LOADING MORE MESSAGES !</Text> : null}
                        onScroll={handleScroll}
                    />
                    {/* <HStack space="md" px={4} py={2} alignItems="center" justifyContent="flex-start">
                        <Box bg={message.sender_id === userId ? "$primary" : "$secondary"} p={3} rounded="lg">
                            <Text color="white">{message.content}</Text>
                            {isSeen && (
                            <Text color="$gray400" fontSize="xs" textAlign="right">✓ Seen</Text>
                            )}
                        </Box>
                    </HStack> */}
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
                        <Box style={{borderBlockColor:"red", borderWidth:1}} width={'80%'}>
                            <Input variant="outline" size="md">
                                <InputField placeholder="Write message here..." onChangeText={(text) => {setText(text); sendTypingEvent()}} value={text}/>
                            </Input>
                        </Box>
                        <Box width={'20%'} style={{borderBlockColor:"red", borderWidth:1}}>
                            {loadingSend ? 
                            <Text>SEND !</Text>: 
                            <Button onPress={() => {
                                sendTextMessage();
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
