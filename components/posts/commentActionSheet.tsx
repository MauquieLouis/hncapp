import React, { useEffect, useState } from 'react';
import { View, Text, Image, Touchable, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Box } from '../ui/box';
import { HStack } from '../ui/hstack';
import { VStack } from '../ui/vstack';
import { Input, InputField, InputSlot } from '../ui/input';
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicatorWrapper, ActionsheetDragIndicator } from '../ui/actionsheet';
import { FormControl, FormControlLabel, FormControlLabelText } from '../ui/form-control';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/libs/initSupabase';
import { useUserContext } from '@/contexts/userContext';
import { Spinner } from '../ui/spinner';
import Avatar from '../profile/avatar';

import {sendPhoneNotification} from '@/components/notifications/notificationSender';


const ActionSheetForm = (props: {
    setCommentsFunction(arg0: (prevComments: any) => any[]): unknown; item: { id: any; user_id: any; }; profile: any; theme: any; token: any
}) => {
    const [text, setText] = useState('');
    const [ loading, setLoading ] = useState(false); 

    const theme = props.theme;

    const postComment = async () => {
        try{
            if (text.trim() === '') return;
            // Peut etre mettre un message d'erreur si le champ est vide
            setLoading(true);
            const { data, error } = await supabase.from('comments').insert({
                post_id: props.item.post_id,
                user_id: props.profile.user_id,
                text: text,
            }).select();

            if (data && Array.isArray(data) && data.length > 0) {
                data[0].comment_id = data[0].id; // assuming 'id' is the primary key
                props.setCommentsFunction(prevComments => [ ...prevComments, data[0] ]);
            }
            if(error){
                console.error("Error when posting comment in postComment function in components/profile/postElemInPostsList.tsx", error);   
            }
            if (data && Array.isArray(data) && data.length > 0 && data[0].id) {
                sendCommentNotification(data[0].id);
            }
        }catch(error: unknown){
            console.error("Error in postComment function in components/profile/postElemInPostsList.tsx", error);
        }finally{
            setLoading(false);
        }
    }

    const sendCommentNotification = async (id: any) => {
        try{
            const { data, error } = await supabase.from('notifications').insert(
                {
                    recipient_id: props.item.user_id,
                    actor_id: props.profile.user_id,
                    type: 'commented',
                    object_id: id,
                    read: false
                });
            if(error){
                console.error("Error when sending comment notification in sendCommentNotification function in components/profile/postElemInPostsList.tsx", error);
            }else{
                await sendPhoneNotification(props.token ? [props.token] : [], text, "New comment on your post");
            }

        }catch(error: unknown){
            console.error("Error in sendCommentNotification function in components/profile/postElemInPostsList.tsx", error);
        }finally{

        }
    }

    const styles = StyleSheet.create({
        inputStyle:{
            borderColor:theme.borderColorLight,
        },
        inputField:{
            color:theme.textColor1,
        },
        touchableBTN:{
            marginTop: 0, padding: 8, borderRadius: 10, borderWidth: 3, borderColor: theme.borderColorDark, width:"15%"
        }
    });

    const iconColor=theme.iconColor

    return(
        <HStack space="md" className='w-full justify-between items-center'>
            <FormControl style={{width:"85%"}} >
                <FormControlLabel>
                    {/* <FormControlLabelText>
                        Write a comment here ...
                        </FormControlLabelText> */}
                </FormControlLabel>
                <Input className="w-full rounded-lg" style={styles.inputStyle}>
                    {/* <InputSlot>
                        <Ionicons name="chatbubble-ellipses-outline" size={24} color="grey" />
                    </InputSlot> */}
                    <InputField placeholder="Write comment here" value={text} onChangeText={setText} style={styles.inputField}/>
                </Input>
            </FormControl>
            <TouchableOpacity
                onPress={() => {
                    // Handle comment submission
                    postComment();
                    setText(''); // Clear input after submission
                }}
                style={styles.touchableBTN}>
                    <Ionicons name="send-outline" size={32} color={iconColor}/>
            </TouchableOpacity>
        </HStack>
    )
}


const CommentActionSheet = (props: { modalComments: boolean | undefined; onCloseModalComments: (() => any) | undefined; item: { id: any, user_id: any; }; setCommentNumber: any; token: any}) => {
    const [ loading, setLoading ] = useState(false);
    const [comments, setComments] = useState<any[]>([]);

    useEffect(() => {
        fetchComments();
    },[]);

    const { profile, theme } = useUserContext();
    const token = props.token;

    const fetchComments = async () => {
        try{
            setLoading(true);
            // const { data, error } = await supabase.from('comments').select('*').eq('post_id', props.item.post_id);
            const { data, error } = await supabase.rpc("get_post_comments_with_profiles", {
                post_uuid: props.item.post_id,
                limit_count: 50,   // optionnel
                offset_count: 0,   // optionnel
            });
            if (error) {
                console.error("Error fetching comments in fetchComments function in components/profile/postElemInPostsList.tsx", error);
            } else {
                console.log("Data",data);
                setComments(data);
                props.setCommentNumber(data.length);
            }
        }catch(error: unknown){
            console.error("Error in fetchComments function in components/profile/postElemInPostsList.tsx", error);
        } finally{
            setLoading(false);
        }
    }

    const styles = StyleSheet.create({
        actionSheetContent:{
            backgroundColor: theme.backgroundColor2,
        },
        nameText:{
            fontWeight:"bold",
            color: theme.textColor1,
        },
        commentText:{
            color: theme.textColor2
        }
    });

    const renderComment = ({ item }: { item: any }) => (
        console.log("ITEM COMMENT:", item),
        <Box style={{ paddingVertical:10 }}>
            <HStack space="sm" style={{ alignItems: "center" }}>
                <Avatar user_id={item.user_id}/>
                <VStack>
                <Text style={styles.nameText}>{item.username}</Text>
                <Text style={styles.commentText}>{item.text}</Text>
                </VStack>
            </HStack>
        </Box>
    );

    return (
        <Actionsheet isOpen={props.modalComments} onClose={props.onCloseModalComments} useRNModal={true}>
            <ActionsheetBackdrop/>
            <ActionsheetContent className="" style={styles.actionSheetContent} maxHeight={"80%"}>
                <ActionsheetDragIndicatorWrapper>
                    <ActionsheetDragIndicator/>
                </ActionsheetDragIndicatorWrapper>
                <VStack className="w-full pt-5">
                    {loading ? (
                        <Spinner />
                    ) : (
                        <FlatList
                        data={comments}
                        renderItem={renderComment}
                        keyExtractor={(item) => item.comment_id.toString()}
                        ListFooterComponent={<Box style={{ paddingVertical:40 }}></Box>}
                        />
                    )}
                    <HStack space="md" className="justify-center items-cneter">
                        <Box>
                            <Image
                                source={{ uri: "https://i.imgur.com/UwTLr26.png" }}
                                resizeMode="contain"
                                className="flex-1"
                            />
                        </Box>
                    </HStack>
                    <Box style={{ position: "absolute", bottom: 0, width: "100%", padding: 10, backgroundColor: theme.backgroundColor2, borderTopWidth: 1, borderTopColor: theme.borderColorLight }}>
                       <ActionSheetForm item={props.item} profile={profile} setCommentsFunction={setComments} theme={theme} token={token}/>

                    </Box>
                    {/* <Button onPress={() => {submitComment(onSubmit)}} isDisabled={isSubmitting}>
                        <Text color="white">Submit</Text>
                    </Button> */}
                </VStack>
            </ActionsheetContent>

        </Actionsheet>
    )
}

export default CommentActionSheet;