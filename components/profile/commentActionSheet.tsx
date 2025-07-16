import React, { useEffect, useState } from 'react';
import { View, Text, Image, Touchable, TouchableOpacity, FlatList } from 'react-native';
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
import Avatar from './avatar';

const ActionSheetForm = (props: {
    setCommentsFunction(arg0: (prevComments: any) => any[]): unknown; item: { id: any; user_id: any; }; profile: any 
}) => {
    const [text, setText] = useState('');
    const [ loading, setLoading ] = useState(false); 

    // const { profile } = useUserContext();

    // useEffect(() => {
    //     console.log("PROFILE :", profile);
    // }, []);

    const postComment = async () => {
        try{
            if (text.trim() === '') return;
            // Peut etre mettre un message d'erreur si le champ est vide
            setLoading(true);
            const { data, error } = await supabase.from('comments').insert({
                post_id: props.item.id,
                user_id: props.profile.user_id,
                text: text,
            }).select();

            console.log("DATA : data", data);
            if (data && Array.isArray(data) && data.length > 0) {
                props.setCommentsFunction(prevComments => [ data[0], ...prevComments ]);
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
                console.log("Comment notification sent successfully:", data);
            }

        }catch(error: unknown){
            console.error("Error in sendCommentNotification function in components/profile/postElemInPostsList.tsx", error);
        }finally{

        }
    }


    return(
        <HStack space="md" className='w-full justify-between items-center'>
            <FormControl style={{width:"85%"}} >
                <FormControlLabel>
                    {/* <FormControlLabelText>
                        Write a comment here ...
                        </FormControlLabelText> */}
                </FormControlLabel>
                <Input className="w-full rounded-lg">
                    {/* <InputSlot>
                        <Ionicons name="chatbubble-ellipses-outline" size={24} color="grey" />
                    </InputSlot> */}
                    <InputField placeholder="Write comment here" value={text} onChangeText={setText}/>
                </Input>
            </FormControl>
            <TouchableOpacity
                onPress={() => {
                    // Handle comment submission
                    postComment();
                    console.log('Comment submitted:', text);
                    setText(''); // Clear input after submission
                }}
                style={{ marginTop: 0, padding: 8, borderRadius: 10, borderWidth: 3, borderColor: '#007AFF', width:"15%" }}>
                    <Ionicons name="send-outline" size={32} color="#007AFF"/>
            </TouchableOpacity>
        </HStack>
    )
}


const CommentActionSheet = (props: { modalComments: boolean | undefined; onCloseModalComments: (() => any) | undefined; item: { id: any; }; setCommentNumber: any}) => {
    const [ loading, setLoading ] = useState(false);
    const [comments, setComments] = useState<any[]>([]);

    useEffect(() => {
        fetchComments();
    },[]);

    const { profile } = useUserContext();


    const fetchComments = async () => {
        try{
            setLoading(true);
            console.log("==============Fetching comments for post id: ", props.item.id);
            const { data, error } = await supabase.from('comments').select('*').eq('post_id', props.item.id);
            if (error) {
                console.error("Error fetching comments in fetchComments function in components/profile/postElemInPostsList.tsx", error);
            } else {
                console.log("Fetched comments: ", data);
                setComments(data);
                props.setCommentNumber(data.length);
            }
        }catch(error: unknown){
            console.error("Error in fetchComments function in components/profile/postElemInPostsList.tsx", error);
        } finally{
            setLoading(false);
        }
    }

    const renderComment = ({ item }: { item: any }) => (
        <Box style={{ borderBottomWidth:1, borderColor:"rgba(127,127,127,0.8)",  paddingVertical:10 }}>
            <HStack space="sm" style={{ alignItems: "center" }}>
                <Avatar user_id={item.user_id}/>
                <VStack>
                <Text style={{ fontWeight:"bold", color:"black"}}>{item.user_id}</Text>
                <Text style={{ color:"black" }}>{item.text}</Text>
                </VStack>
            </HStack>
        </Box>
    );

    return (
        <Actionsheet isOpen={props.modalComments} onClose={props.onCloseModalComments}>
            <ActionsheetBackdrop/>
            <ActionsheetContent className="">
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
                        keyExtractor={(item) => item.id.toString()}
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
                    <ActionSheetForm item={props.item} profile={profile} setCommentsFunction={setComments}/>
                    {/* <Button onPress={() => {submitComment(onSubmit)}} isDisabled={isSubmitting}>
                        <Text color="white">Submit</Text>
                    </Button> */}
                </VStack>
            </ActionsheetContent>

        </Actionsheet>
    )
}

export default CommentActionSheet;