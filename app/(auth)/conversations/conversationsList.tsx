import React, { FlatList, View, StyleSheet } from 'react-native';
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
import { useRelativeTime } from '@/components/date/format';
import ConversationListItem from '@/components/conversations/conversationList/conversationListItem';

const ConversationsListScreen = () => {
    const [conv_data, setConvData] = useState<any[]>([]);
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
                console.log("CONV_DATA :", conv_data)
                console.log("CONV_DATA_PARTICIPANTS :", conv_data[0].participants);
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
        /** ---------------------------------------------------------------
         *  ==== ====  S U B S C R I B E   T O   M E S S A G E S  ==== ====
         */
        if(!conv_data) return;
        // console.log("CONV_DATA ", conv_data);
        // if(conv_data[0].participants){
            // console.log("CONV_DATA_PART ", conv_data[0].participants);
        // }
        // console.log("CONV_DATA SENDER", conv_data[0].last_message.sender);
        const convIds = conv_data.map(c => c.conversation_id);
        // console.log("CONV IDS :", convIds);
        const insertAndDeleteChannels = supabase.channel(`conversationsList-messages-${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table:'messages', filter:`conversation_id=in.(${convIds.join(",")})`}, handleReceivedMessage)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table:'message_status', filter:`conversation_id=in.(${convIds.join(",")})`}, handleNewReadStatus)
        // .on('postgres_changes', { event: 'INSERT', schema: 'public', table:'messages', filter:`conversation_id=in.(${convIds.join(",")})`}, handleReceivedMessage)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table:'messages', filter:`conversation_id=in.(${convIds.join(",")})`}, handleDeletedMessage)
        // .on('postgres_changes', { event: 'INSERT', schema: 'public', table:'message_reactions', filter:'conversation_id=eq.'+convId[0]}, handleNewReactionReceived)
        // .on('postgres_changes', { event: 'DELETE', schema: 'public', table:'message_reactions'}, handleDeleteReaction)
        .subscribe();

        return() => {
            insertAndDeleteChannels.unsubscribe();
        };
    }, [conv_data]);

    const handleReceivedMessage = async (payload: any) => {
        try{
            // console.log("NEW MESSAGE RECEIVED IN LIST", payload);
            await updateConversationList(payload);
            // setConvData(prev => updateHasReadForOtherUser(prev, payload, user.id, false))
        }catch(error: unknown){
            console.error("Error in handleReceivedMessage function in conversationList.tsx", error);
        }
    }

    const handleDeletedMessage = async (payload: any) => {
        try{
            // console.log("NEW MESSAGE DELETE IN LIST");
        }catch(error: unknown){
            console.error("Error in handleReceivedMessage function in conversationList.tsx", error);
        }
    }

    const handleNewReadStatus = async(payload: any) => {
        try{
            console.log("NEW READ STATUS :", payload);
            if(payload.new.user_id == user.id){
                setConvData(prev => updateMyIsReadInState(prev, payload))
            }else{
                setConvData(prev => updateHasReadForOtherUser(prev, payload, user.id, true))
            }
        }catch(error: unknown){
            console.error("Error in handleNewReadStatus")
        }
    }

    const updateMyIsReadInState = (
        prevState: any,
        event: any,
    ) => {
        // console.log("IN UPDATE STATUS FUNCTION ==========")
        const { conversation_id, message_id, is_read, user_id } = event.new;

        return prevState.map((conv: { conversation_id: any; last_message: { id: any; }; }) => {
            // Pas la bonne conversation → pas de changement
            console.log(" ===== CHECK CONV_ID", conv.conversation_id, "?==?", conversation_id);
            if (conv.conversation_id !== conversation_id) return conv;
            
            // Pas le bon message → pas de changement
            // console.log(" ===== CHECK MESSAGE_ID", conv.last_message.id, "?==?", message_id);
            // if (conv.last_message?.id !== message_id) return conv;

            // Mise à jour du is_read
            console.log("UPDATE THIS MESSAGE : ",conv.last_message);
            return {
            ...conv,
            last_message: {
                ...conv.last_message,
                is_read: is_read,
            },
            };
        });
    }

    const updateHasReadForOtherUser = (
        prevState: any[],
        event: any,
        currentUserId: string,
        hasRead: boolean
    ) => {
        const { conversation_id, user_id, message_id, is_read } = event.new;

        // On ignore si c'est le user actuel (son propre read est déjà géré ailleurs)
        if (user_id === currentUserId) return prevState;

        // Ce n’est mis à jour que si is_read = true
        if (!is_read) return prevState;

        return prevState.map(conv => {
            if (conv.conversation_id !== conversation_id) return conv;

            return {
            ...conv,
            participants: conv.participants.map((p: any) => {
                // Trouver le participant qui vient de lire
                if (p.user_id === user_id) {
                return {
                    ...p,
                    has_read: hasRead,
                };
                }
                return p;
            }),
            };
        });
    }


    const updateConversationList = async (payload: any) => {
        const newMessage = payload.new;
        const conversationIndex = conv_data.findIndex(
            conv_data => conv_data.conversation_id === newMessage.conversation_id
        );

        let sender: {
            user_id?: string;
            profile_picture_url?: string | null;
            username?: string | null;
            firstname?: string | null;
            lastname?: string | null;
        } = {};
        let profile_to_display: {
            user_id?: string;
            profile_picture_url?: string | null;
            username?: string | null;
            firstname?: string | null;
            lastname?: string | null;
        } = {};
        let is_read = false;
        if(conv_data[conversationIndex].is_group == true){
            // console.log("THIS IS A GROUP SO CHANGE §§§§")
            if(conv_data[conversationIndex].last_message.sender.user_id !== newMessage.sender_id){
                //Fetch the new user_data 
                const { data, error } = await supabase.from("profiles").select("user_id, profile_picture_url, username, firstname, lastname")
                .eq("user_id",newMessage.sender_id);
                if(error){
                    console.error("Error when fetching profile from different new message sender in updateConversationList i, conversationList.tsx", error)
                }else if (data && data.length > 0){
                    sender.user_id = data[0].user_id;
                    sender.profile_picture_url = data[0].profile_picture_url;
                    sender.username = data[0].username;
                    sender.firstname = data[0].firstname;
                    sender.lastname = data[0].lastname;
                    profile_to_display = sender;
                }
            }
        }else{
            profile_to_display = conv_data[conversationIndex].participants[0]
        }
        const { data: check_is_read, error: error_check_is_read } = await supabase.from('message_status')
            .select('*', { count: 'exact' })
            .eq('message_id', newMessage.id)
            .eq('user_id', user.id);
        if(error_check_is_read){
            console.error("Error when checking read status in updateConversationList function in conversationsList.tsx", error_check_is_read);
        }else{
            is_read = !!(check_is_read.length > 0); //null or 0 is false something else is true
        }
        if(newMessage.sender_id === user.id){
            is_read = true;
        }

        // --- Calculer has_read pour chaque participant ---
        // Récupérer la liste des user_ids participants de la conversation
        const convItem = conv_data[conversationIndex];
        const participants = convItem.participants ?? [];
        const participantUserIds = participants.map((p: any) => p.user_id).filter(Boolean);

        let usersWhoRead = new Set<string>();

        if (participantUserIds.length > 0) {
            // On récupère en une seule requête tous les message_status pour ce message et ces user_ids
            const { data: statuses, error: error_statuses } = await supabase
                .from("message_status")
                .select("user_id")
                .eq("message_id", newMessage.id)
                .in("user_id", participantUserIds);

            if (error_statuses) {
                console.error("Error when fetching message_status for participants:", error_statuses);
            } else if (statuses && statuses.length > 0) {
                // statuses contient des objets { user_id: "..."}
                statuses.forEach((s: any) => {
                if (s.user_id) usersWhoRead.add(s.user_id);
                });
            }
        }

        // Important: si un participant est l'expéditeur et que c'est l'utilisateur courant, on peut marquer has_read true
        // (si tu veux marquer toujours le sender comme having read, décommente la ligne suivante)
        // usersWhoRead.add(newMessage.sender_id);

        // Construire le nouveau tableau participants avec has_read mis à jour
        const updatedParticipants = participants.map((p: any) => {
        const hasReadFromStatus = usersWhoRead.has(p.user_id);
        const isSenderAndCurrentUser = p.user_id === user.id && newMessage.sender_id === user.id;
        return {
            ...p,
            has_read: hasReadFromStatus || isSenderAndCurrentUser || false,
        };
        });

        setConvData(prevConvData => {
            const updatedConversations = [...prevConvData];
            
            if(conversationIndex !== -1){
                updatedConversations[conversationIndex] = {
                    ...updatedConversations[conversationIndex],
                    last_message: {
                        content: newMessage.content,
                        created_at: newMessage.created_at,
                        type: newMessage.type,
                        // sender: { id: newMessage.sender_id },
                        is_read: is_read,
                        sender: sender,
                    },
                    profile_to_display: profile_to_display,
                    participants: updatedParticipants,
                }

                updatedConversations.sort((a, b) => {
                    const dateA = new Date(a.last_message.created_at);
                    const dateB = new Date(b.last_message.created_at);
                    return dateB.getTime() - dateA.getTime(); //Ordre décroissant
                })
            }
            // console.log("UPDATED CONV :", updatedConversations);
            return updatedConversations;
        })
    }

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
                renderItem={({ item }) => <ConversationListItem item={item}/>}
                keyExtractor={(item) => item.conversation_id}
            />
        </Box>
        }

        </Box>

    );
};

export default ConversationsListScreen;
