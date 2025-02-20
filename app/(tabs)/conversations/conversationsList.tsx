import React, { FlatList, View } from 'react-native';
// import { ButtonText, Button } from '@gluestack-ui/themed';
// import { FlatList, Box, Text, HStack, VStack, Pressable } from 'react-native';
// import { Box } from '@/src/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';

import { useUserContext } from '../../../contexts/userContext';
import { supabase } from '../../../libs/initSupabase';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

const ConversationsListScreen = () => {
    const [conv_data, setConvData] = useState(null);
    const [loading, setLoading] = useState(false);
    const { user } = useUserContext();
    const router = useRouter();


    useEffect(() => {
        const fetchConversation = async() => {
            try{
                setLoading(true);
                // eslint-disable-next-line @typescript-eslint/no-shadow
                const { data : conv_data, error: conv_error } = await supabase.rpc('get_user_conversations2',{'p_user_id':user.id});
                if(conv_error){
                    console.log('Conv error :', conv_error);
                }
                setConvData(conv_data);
            }catch(error: unknown){
                console.log('Error in fetchConversation function in Messagings.tsx', error);
            }finally{
                setLoading(false);
            }
        };
        fetchConversation();

    }, []);

    return(
        <>
            {loading ? <>
                <Text>
                    LOADING
                </Text>
            </>
            : 
        <Box>
            <FlatList data={conv_data} 
                renderItem={({ item }) => (
                    <Box borderBottomWidth="$1"
                    borderColor="$trueGray800"
                    $dark-borderColor="$trueGray100"
                    $base-pl={0}
                    $base-pr={0}
                    $sm-pl="$4"
                    $sm-pr="$5"
                    py="$2">
                        <Pressable onPress={() => {
                          router.push(`/conversations/${item.conversation_id}`)
                        }}>
                            <HStack space="sm" >
                                <Box borderColor="$red400" borderWidth="$1">
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
                                <Box borderColor="$red400" borderWidth="$1">
                                    <VStack>
                                        <Box borderColor="$red400" borderWidth="$1">
                                            <Text>{item.conversation_name}</Text>
                                        </Box>
                                        <Box borderColor="$red400" borderWidth="$1">
                                        <HStack space="sm">
                                                <Box borderColor="$blue400" borderWidth="$1" w="$40" h="$10">
                                                    <Text numberOfLines={1} ellipsizeMode="tail">{item.last_message.content}</Text>
                                                </Box>
                                                <Box borderColor="$blue400" borderWidth="$1" w="$40" h="$10">
                                                    <Text>{item.last_message.created_at}</Text>
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

        </>

    );
};

export default ConversationsListScreen;
