import React, { FlatList, View, StyleSheet } from 'react-native';
// import { ButtonText, Button } from '@gluestack-ui/themed';
// import { FlatList, Box, Text, HStack, VStack, Pressable } from 'react-native';
// import { Box } from '@/src/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';

import { useUserContext } from '../../contexts/userContext';
import { supabase } from '../../libs/initSupabase';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

const ConversationsListScreen = () => {
    const [conv_data, setConvData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [ myConversationsId, setMyConversationsId ] = useState<string[]>([]); 


    const { user,theme } = useUserContext();
    const router = useRouter();

    useEffect(() => {
        getMyConversationIdList();
        const fetchConversation = async() => {
            try{
                setLoading(true);
                // eslint-disable-next-line @typescript-eslint/no-shadow
                const { data : conv_data, error: conv_error } = await supabase.rpc('get_user_conversations2',{'p_user_id':user.id});
                if(conv_error){
                    console.error('Conv error :', conv_error);
                }
                setConvData(conv_data);
            }catch(error: unknown){
                console.error('Error in fetchConversation function in Messagings.tsx', error);
            }finally{
                setLoading(false);
            }
        };
        fetchConversation();

        

    }, []);

    useEffect(() => {
        const insertChannel = supabase.channel(`conversation-List-messages-${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table:'messages'},
            //This is working and not subscribing to all incoming message because, there is a policy that check a user can only read message of the conversation_participants he is in.
            async (payload) => {
                
                // CREATE A WAITING TIME WHEN UPLOADING NEW IMAGE OR AUDIO, TO DISPLAY IT IN THE CONVERSATION
                if(payload.new.type == 'attachment' || payload.new.type == 'audio'){
                    console.info("New message received in list screen -> Attachment");
                }
                console.info("New message received in list screen");
            }
        ).subscribe();

        return() => {
            insertChannel.unsubscribe();
        }
    }, [myConversationsId])

    const getMyConversationIdList = async() => {
        try{
            const { data, error } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .eq("user_id", user.id)
            .is("deleted_at", null);
            if(error){
                console.error("Error in getMyConversationIdList function when fetching conversations particpant table in conversationsList.tsx", error);
            }
            if(data){
                setMyConversationsId(data.map((item: { conversation_id: string }) => item.conversation_id));
            }
        }catch(error: unknown){
            console.error("Error in getMyConversationIdList function in conversationsList.tsx", error);
        }finally{

        }
    }

    const styles = StyleSheet.create({
        container:{
            backgroundColor:theme.backgroundColor1,
            height:"100%"
        },
        boxStyle:{
            borderBottomWidth:1,
            borderBottomColor:theme.dividerColor,
            width:"90%",
            marginLeft:"5%",
            paddingVertical:10
        },
        nameText:{
            color:theme.textColor2,
            fontWeight:"bold",
        },
        messageText:{
            color:theme.textColor1
        },
        dateColor:{
            color:theme.textColor1
        }
    });

    return(
        <Box style={styles.container}>
            {loading ? <>
                <Text>
                    LOADING
                </Text>
            </>
            : 
        <Box>
            <FlatList data={conv_data} 
                renderItem={({ item }) => (
                    <Box>
                        <Pressable onPress={() => {
                          router.push(`/conversations/${item.conversation_id}`)
                        }} style={styles.boxStyle}>
                            <HStack space="sm" >
                                <Box>
                                    <View
                                        // eslint-disable-next-line react-native/no-inline-styles
                                        style={{
                                            width: 50,
                                            height: 50,
                                            borderRadius: 50,
                                            backgroundColor: 'grey',
                                        }}
                                        />
                                </Box>
                                <Box>
                                    <VStack>
                                        <Box>
                                            <Text style={styles.nameText}>{item.conversation_name}</Text>
                                        </Box>
                                        <Box>
                                        <HStack space="sm">
                                                <Box>
                                                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.messageText}>{item.last_message.content}</Text>
                                                </Box>
                                                <Box>
                                                    <Text style={styles.dateColor}>{item.last_message.created_at}</Text>
                                                </Box>
                                        </HStack>
                                        </Box>
                                    </VStack>
                                </Box>
                            </HStack>
                        </Pressable>
                    </Box>
                )}
                keyExtractor={(item) => item.conversation_id}
            />
        </Box>
        }

        </Box>

    );
};

export default ConversationsListScreen;
