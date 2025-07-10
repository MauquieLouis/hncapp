import React, { useState, useEffect, memo } from 'react';
import { supabase } from '@/libs/initSupabase';
import { Text } from '@/components/ui/text';
import { Box } from '@/components/ui/box'; 

import type { ICarouselInstance } from 'react-native-reanimated-carousel';
import Carousel, { Pagination } from "react-native-reanimated-carousel";
import { renderItem } from './render-item';
import { useSharedValue, interpolate, Extrapolation } from 'react-native-reanimated';
import AudioPlayer from '../conversations/audioPlayer';
import UniversarlAudioPlayer from '../files/universalAudioPlayer';
import { Ionicons } from '@expo/vector-icons';
import { HStack } from '../ui/hstack';
import { FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useUserContext } from '@/contexts/userContext';
import { VStack } from '../ui/vstack';
import Avatar from './avatar';
import { Spinner } from '../ui/spinner';
import { Input, InputField, InputSlot } from '../ui/input';
import { Image } from '../ui/image';
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicatorWrapper, ActionsheetDragIndicator } from '../ui/actionsheet';
import { FormControl, FormControlLabel, FormControlLabelText } from '../ui/form-control';

const PostElemInPostsList = (props: any) => {

    const [ urls, setUrls ] = useState([]);
    const [ audioUrl, setAudioUrl ] = useState<string | null>(null);
    const [ isLiked, setIsLiked ] = useState(null);
    const [ text, setText ] = useState("");
    const [ comments, setComments ] = useState<any[]>([]);
    const [ loading, setLoading ] = useState<boolean>(false);
    const [ modalComments, setModalComments ] = useState<boolean>(false);

    const onCloseModalComments = () => {
        setModalComments(false);
    }
    const item = props.item;
    const folder_url = props.folder_url;
    const bucket = props.bucket;
    const progress = useSharedValue<number>(0);

    const { profile } = useUserContext();

    useEffect(()=> {
        console.log("ITEM :",item);
        getSignedUrlForFiles();
        fetchComments();
    }, []);

    const getSignedUrlForFiles = async() => {
        try{
            const { data: post_attachments, error: post_attachments_error } = await supabase.from('post_attachments').select('*').eq('post_id',item.id);
            if(post_attachments_error){
                console.error("Error when getting post_attachments from post in getSignedUrlForFiles function in components/profile/postElemInPostsList.tsx",post_attachments_error);
            }
            else{
                // console.log("Post_attach data : ", post_attachments);
                const urls: string[] = [];
                for(let post_attachment of post_attachments){
                    if(post_attachment.url){
                        urls.push(`${folder_url}/${post_attachment.url}`);
                    }
                    console.log("POST ATTACH :", post_attachment);
                }
                const { data, error } = await supabase.storage.from(bucket).createSignedUrls(urls, 1200);
                if(error){
                    console.error("Error when creating signedUrls in getSignedUrlForFiles function in components/profile/postElemInPostsList.tsx", error);
                }else{
                    console.log("DATA URLS :", data);
                    const signedUrls = data?.map((signedURL) => signedURL.signedUrl)
                    setUrls(signedUrls);
                }
                if(item.file_url){
                    const {data : audio_data, error: audio_error} = await supabase.storage.from(bucket).createSignedUrl(item.file_url,1200);
                    setAudioUrl(audio_data?.signedUrl ?? null);
                }
            }
        }catch(error: unknown){
            console.error("Error in getSignedUrlForFiles function in components/profile/postElemInPostsList.tsx", error);

        }finally{

        }
    }

    const fetchComments = async () => {
        try{
            setLoading(true);
            console.log("==============Fetching comments for post id: ", item.id);
            const { data, error } = await supabase.from('comments').select('*').eq('post_id', item.id);
            if (error) {
                console.error("Error fetching comments in fetchComments function in components/profile/postElemInPostsList.tsx", error);
            } else {
                console.log("Fetched comments: ", data);
                setComments(data);
            }
        }catch(error: unknown){
            console.error("Error in fetchComments function in components/profile/postElemInPostsList.tsx", error);
        } finally{
            setLoading(false);
        }

    }

    const defaultDataWith6Colors = [
        "#B0604D",
        "#899F9C",
        "#B3C680",
        "#5C6265",
        "#F5D399",
        "#F1F1F1",
    ];

    const onPressPagination = (index: number) => {
        ref.current?.scrollTo({
        /**
         * Calculate the difference between the current index and the target index
         * to ensure that the carousel scrolls to the nearest index
         */
        count: index - progress.value,
        animated: true,
        });
    };

    const togglePostReaction = async (postId: any, userId: any, action: any /* true=like, false=dislike */) => {
        // Step 1: Check existing reaction
        const { data: existing, error: fetchError } = await supabase
            .from('post_likes')
            .select('id, like')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Fetch error:', fetchError);
            return { error: fetchError };
        }

        // Step 2: If same reaction exists → delete
        if (existing && existing.like === action) {
            const { error: deleteError } = await supabase
            .from('post_likes')
            .delete()
            .eq('id', existing.id);

            if (deleteError) {
            console.error('Delete error:', deleteError);
            return { error: deleteError };
            }

            return { data: null, state: null };
        }
        // Step 3: Else insert or update (toggle to other reaction or create new)
        const { data, error: upsertError } = await supabase
            .from('post_likes')
            .upsert(
                {
                post_id: postId,
                user_id: userId,
                liked_at: new Date().toISOString(),
                like: action,
                },
            {
                onConflict: 'post_id,user_id',
            }
            );

        if (upsertError) {
            console.error('Upsert error:', upsertError);
            return { error: upsertError };
        }

        return { data, state: action };
    };

    const handleReaction = async (action: any) => {
        const { state, error } =  await togglePostReaction(item.id, profile?.user_id, action);
        if (!error) {
            setIsLiked(state);
            //  false, or null
        }
    }

    const renderComment = ({ item }: { item: any }) => (
        <Box style={{ borderBottomWidth:1, borderColor:"rgba(127,127,127,0.8)",  paddingVertical:10 }}>
            <HStack space="sm" style={{ alignItems: "center" }}>
                <Avatar user_id={item.user_id}/>
                <VStack>
                <Text style={{ fontWeight:"bold", color:"white"}}>{item.user_id}</Text>
                <Text style={{ color:"white" }}>{item.text}</Text>
                </VStack>
            </HStack>
        </Box>
    );

    const postComment = async () => {
        try{
            if (text.trim() === '') return;
            setLoading(true);
            const { data, error } = await supabase.from('comments').insert({
                post_id: item.id,
                user_id: profile.user_id,
                text: text,
            });
            if(error){
                console.error("Error when posting comment in postComment function in components/profile/postElemInPostsList.tsx", error);   
            }
        }catch(error: unknown){
            console.error("Error in postComment function in components/profile/postElemInPostsList.tsx", error);
        }finally{
            setLoading(false);
        }
    }

    // const CommentInput = React.memo(({ text, setText, postComment }: { text: string; setText: (t: string) => void; postComment: () => void }) => {
    //     return (
    //         <HStack space="sm" style={{ borderColor: "red", borderWidth: 1 }}>
    //             <Input variant="outline" size="md" style={styles.writingInput}>
    //                 <InputField
    //                     placeholder="Write message here..."
    //                     onChangeText={(t) => setText(t)}
    //                     value={text}
    //                     multiline
    //                     style={{ color: "black" }}
    //                 />
    //             </Input>
    //             <TouchableOpacity onPress={postComment}>
    //                 <Ionicons name="send-outline" size={32} color="white" />
    //             </TouchableOpacity>
    //         </HStack>
    //     );
    // });

    const ref = React.useRef<ICarouselInstance>(null);
    return (
        <>
            <Box>
                <Carousel
                    ref={ref}
                    data={urls}
                    height={340}
                    loop={false}
                    onProgressChange={progress}
                    pagingEnabled={true}
                    snapEnabled={true}
                    width={340}
                    style={{
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: 300,
                    }}
                    mode={"parallax"}
                    // modeConfig={{stackInterval:1}}
                    modeConfig={{
                        parallaxScrollingScale: 0.88,
                        parallaxScrollingOffset: 58,
                    }}
                    renderItem={renderItem({ rounded: true, imagesArray: urls})}
                    onConfigurePanGesture={(gesture) => {
                    gesture.activeOffsetX([-50,50]);
                    // gesture.minVelocity(0);
                    // gesture.activeOffsetY([-10,10]);
                    //Maybe try to find a way toactivate or not the carousel ? like if click one tile on it will made the picture carousel available.
                    //with enabled false.
                    return gesture;
                }}
                />
                <Pagination.Custom<{ color: string }>
                    progress={progress}
                    data={urls.map((color) => ({ color }))}
                    size={12}
                    dotStyle={{
                        borderRadius: 16,
                        backgroundColor: "#8899FF",
                    }}
                    activeDotStyle={{
                        borderRadius: 4,
                        width: 12,
                        height: 12,
                        overflow: "hidden",
                        backgroundColor: "#f1f1f1",
                    }}
                    containerStyle={{
                        gap: 5,
                        marginBottom: 10,
                        alignItems: "center",
                        height: 10,
                    }}
                    horizontal
                    onPress={onPressPagination}
                    customReanimatedStyle={(progress, index, length) => {
                        let val = Math.abs(progress - index);
                        if (index === 0 && progress > length - 1) {
                        val = Math.abs(progress - length);
                        }

                        return {
                        transform: [
                            {
                            translateY: interpolate(val, [0, 1], [0, 0], Extrapolation.CLAMP),
                            },
                        ],
                        };
                    }}
                />
            </Box>
            <Box style={{width:"80%", marginLeft:"10%", borderBottomColor:"rgba(127,127,127,0.8)", borderBottomWidth:1, marginBottom:25, paddingBottom:10 }}>
                <Box>
                    <HStack style={{paddingVertical:15}} space={"xl"}>
                        <TouchableOpacity onPress={async()=> {
                            await handleReaction(true);
                        }}>
                            {isLiked
                             ?
                            <Ionicons name="heart-outline" size={34} color="cyan" />
                            :
                            <Ionicons name="heart-outline" size={34} color="white" />
                            }
                        </TouchableOpacity>
                        <TouchableOpacity onPress={async()=> {
                            await handleReaction(false);
                        }}>
                            {isLiked == true || isLiked == null
                             ?
                             <Ionicons name="skull-outline" size={32} color="white" />
                             :
                             <Ionicons name="skull-outline" size={32} color="red" />
                            }
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {setModalComments(true);}}>
                            <Ionicons name="chatbubble-outline" size={32} color="white" />
                        </TouchableOpacity>
                    </HStack>
                </Box>
                {item.caption ?
                    <Text style={{color:"rgba(180,180,180,0.8)"}}>
                        {item.caption}
                    </Text>
                : 
                    <>
                    {item.file_url ?
                        <>
                        {/** AUDIO HERE */} 
                        {audioUrl ? 
                            <UniversarlAudioPlayer url={audioUrl}/>
                        :<></> }
                        </>
                    : 
                        <></>
                    }
                    </>
                }
                {/* <HStack space="sm" style={{borderColor:"red", borderWidth:1}}>
                    <Input variant="outline" size="md" style={styles.writingInput}>
                        <InputField 
                            // onFocus={() => setIsTextFocused(true)}
                            // onBlur={() => setIsTextFocused(false)}
                            placeholder="Write message here..." 
                            onChangeText={(text) => setText(text)} 
                            value={text}
                            multiline={true}
                            style={{color:"black"}}
                            />
                    </Input>
                    <TouchableOpacity onPress={postComment}>
                        <Ionicons name="send-outline" size={32} color="white" />
                    </TouchableOpacity>
                </HStack>      */}
            </Box>
            {/* <Actionsheet  onClose={onCloseModalComments} >*/}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding': undefined}
                >
                <Actionsheet isOpen={modalComments} onClose={onCloseModalComments}>
                    <ActionsheetBackdrop/>
                    <ActionsheetContent className="">
                        <ActionsheetDragIndicatorWrapper>
                            <ActionsheetDragIndicator/>
                        </ActionsheetDragIndicatorWrapper>
                        <VStack className="w-full pt-5">
                            <HStack space="md" className="justify-center items-cneter">
                                <Box>
                                    <Image
                                        source={{ uri: "https://i.imgur.com/UwTLr26.png" }}
                                        resizeMode="contain"
                                        className="flex-1"
                                    />
                                </Box>
                            </HStack>
                            <FormControl>
                                <FormControlLabel>
                                    <FormControlLabelText>
                                        Write a comment here ...
                                    </FormControlLabelText>
                                </FormControlLabel>
                                <Input className="w-full">
                                    <InputSlot>
                                        <Ionicons name="chatbubble-ellipses-outline" size={24} color="white" />
                                    </InputSlot>
                                    <InputField placeholder="CVC/CVV"/>
                                </Input>
                            </FormControl>
                        </VStack>
                    </ActionsheetContent>

                </Actionsheet>
            </KeyboardAvoidingView>
            {/* <Actionsheet  onClose={onCloseModalComments} >
                <ActionsheetBackdrop/>
                <ActionsheetContent style={{backgroundColor:"rgba(100,100,100,0.7)", paddingVertical: 50}}>
                    <Text style={{fontSize:32, fontWeight:"bold"}}>Comments</Text>
                    {loading ? (
                        <Spinner />
                    ) : (
                        <FlatList
                        data={comments}
                        renderItem={renderComment}
                        keyExtractor={(item) => item.id.toString()}
                        style={{ borderColor:"green", borderWidth:1 }}
                        />
                    )}
                    <HStack space="sm" style={{borderColor:"red", borderWidth:1}}>
                        <Input variant="outline" size="md" style={styles.writingInput}>
                            <InputField 
                                // onFocus={() => setIsTextFocused(true)}
                                // onBlur={() => setIsTextFocused(false)}
                                placeholder="Write message here..." 
                                onChangeText={(text) => setText(text)} 
                                value={text}
                                multiline={true}
                                style={{color:"black"}}
                                />
                        </Input>
                        <TouchableOpacity onPress={postComment}>
                            <Ionicons name="send-outline" size={32} color="white" />
                        </TouchableOpacity>
                    </HStack>
                        
                </ActionsheetContent>
            </Actionsheet> */}

        </>
    );

}

const styles = StyleSheet.create({
        writingInput:{
            width:"82%",
            backgroundColor:"rgba(255,255,255,1)", 
            borderRadius:15,
            borderColor:"rgba(150,150,150,0.7)",
            borderWidth:2,
            // height: 40,
            textAlignVertical: 'top',
        }
    });
export default memo(PostElemInPostsList);
