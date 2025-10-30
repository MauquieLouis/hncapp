import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/libs/initSupabase";
import { sendPhoneNotification } from "../notifications/notificationSender";
import { useUserContext } from "@/contexts/userContext";
import Avatar from "../profile/avatar";
import { Center } from "../ui/center";
import { router } from "expo-router";

const PostAction = (props: any) => {

    const [ urls, setUrls ] = useState<string[]>([]);
    const [ audioUrl, setAudioUrl ] = useState<string | null>(null);
    const [ isLiked, setIsLiked ] = useState<boolean | null >(null);
    const [ text, setText ] = useState("");
    const [ comments, setComments ] = useState<any[]>([]);
    const [ loading, setLoading ] = useState<boolean>(false);
    const [ modalComments, setModalComments ] = useState<boolean>(false);
    const [ commentNumber, setCommentNumber ] = useState<number>(0);
    const [ likeNumber, setLikeNumber ] = useState<number>(0);
    const [ dislikeNumber, setDislikeNumber ] = useState<number>(0);
    const [ notificationToken, setNotificationToken ] = useState<string | null>(null);
    const [ likeActionSheet, setLikeActionSheet ] = useState<boolean>(false);
    const [ dislikeActionSheet, setDislikeActionSheet ] = useState<boolean>(false);

    const { profile, theme } = useUserContext();
    const { post } = props;


    useEffect(()=> {
        getLikeAndDislikeCounts();
    }, []);

    const getLikeAndDislikeCounts = async () => {
            try{
                const { data, error } = await supabase.from('post_likes').select('like, user_id').eq('post_id', post.post_id);
                if(error){
                    console.error("Error when fetching likes and dislikes in getLikeAndDislikeCounts function in components/profile/postElemInPostsList.tsx", error);
                }
                if(data && Array.isArray(data)){
                    const likeCount = data.filter(like => like.like === true).length;
                    const dislikeCount = data.filter(like => like.like === false).length;
                    setLikeNumber(likeCount);
                    setDislikeNumber(dislikeCount);
                    const didILike = data.find(like => like.user_id === profile?.user_id);
                    if(didILike){
                        setIsLiked(didILike.like);
                    }
                    else if (didILike == false){
                        setIsLiked(false);
                    }
                }
    
            }catch(error: unknown){
                console.error("Error in getLikeAndDislikeCounts function in components/profile/postElemInPostsList.tsx", error);
            }finally{
    
            }
    
        }

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
            ).select();


        if (upsertError) {
            console.error('Upsert error:', upsertError);
            return { error: upsertError };
        }
        const { data: notificationData, error: notificationError } =
        await supabase.rpc('insert_or_update_notification', {
            _recipient_id: post.user_id,
            _actor_id: profile?.user_id,
            _type: 'post_liked',
            _object_id: data[0].id,
        });
        if( notificationError ){
            console.error("Error when inserting/updating notification in togglePostReaction function in components/profile/postElemInPostsList.tsx", notificationError);
        }

        return { data, state: action };
    };

    const handleLike=async()=>{
        if(isLiked === true){
            setLikeNumber(prev => prev - 1);
        } else if (isLiked === false){
            setLikeNumber(prev => prev + 1);
            setDislikeNumber(prev => prev - 1);
        }else{
            setLikeNumber(prev => prev + 1);
        }
    }

    const handleDislike=async()=>{
        if(isLiked === false){
            setDislikeNumber(prev => prev - 1);
        } else if (isLiked === true){
            setDislikeNumber(prev => prev + 1);
            setLikeNumber(prev => prev - 1);
        }else{
            setDislikeNumber(prev => prev + 1);
        }
    }

    const handleReaction = async (action: any) => {
        if(isLiked === null){
            //SEND NOTIF, because it should means it's liked or disliked for the first time
            await sendPhoneNotification(
                notificationToken ? [notificationToken] : [],
                action ? "You get a like on your post" : "You get a disliked on your post",
                "New reaction on your post",
            );
        }
        const { state, error } =  await togglePostReaction(post.post_id, profile?.user_id, action);
        if (!error) {
            setIsLiked(state);
            //  false, or null
        }
    }

    const styles = StyleSheet.create({
        IconText: {
            fontSize: 12,
            color: "grey",
            position: "absolute",
            bottom: -6,
            right: -12,
            // borderColor:"red",
            // borderWidth:1,
        },
        HStackSection:{
            paddingLeft:10,
            paddingBottom:12,
        },
        addedByText:{
            paddingHorizontal:8,
            textAlignVertical:"bottom",
            color: theme.textColor1
        }
    });
    const icon_size = 32;
    const notSelectedIconColor= theme.iconNotFocusedColor;
    const selectedHeartIconColor= theme.iconFocusedColor;
    const selectedSkulltIconColor= theme.iconFocusedColor;

    return(
        <Box>
            <HStack id="icon-action-post" space={"4xl"} style={styles.HStackSection}>
                <Box>
                    <HStack id="like-post-action">
                        <TouchableOpacity onPress={async()=> {
                            await handleLike();
                            await handleReaction(true);
                        }}>
                            {isLiked
                                ?
                            <Ionicons name="heart" size={icon_size} color={selectedHeartIconColor} />
                            :
                            <Ionicons name="heart-outline" size={icon_size} color={notSelectedIconColor} />
                            }
                        </TouchableOpacity>
                        {likeNumber > 0 ? 
                            <TouchableOpacity 
                            style={{padding:0, margin:0, justifyContent:"center", alignItems:"center"}} 
                            onPress={() => {setLikeActionSheet(true);}}>
                                <Text style={styles.IconText}>{likeNumber}</Text>
                            </TouchableOpacity>
                        :<></>}
                    </HStack>
                </Box>
                <Box>
                    <HStack id="dislike-post-action">
                        <TouchableOpacity onPress={async()=> {
                            await handleDislike();
                            await handleReaction(false);
                        }}>
                            {isLiked == true || isLiked == null
                                ?
                                <Ionicons name="skull-outline" size={32} color={notSelectedIconColor} />
                                :
                                <Ionicons name="skull" size={32} color={selectedSkulltIconColor} />
                            }
                        </TouchableOpacity>
                        {dislikeNumber > 0 ?
                            <TouchableOpacity 
                            style={{padding:0, margin:0, justifyContent:"center", alignItems:"center"}} 
                            onPress={() => {setDislikeActionSheet(true);}}>
                                <Text style={styles.IconText}>{dislikeNumber}</Text>
                            </TouchableOpacity>
                        :<></>}
                    </HStack>
                </Box>
                <Box>
                    <HStack id="comment-post-action">
                        <TouchableOpacity onPress={() => {
                            console.log("COMMENT ACTION HERE")
                        }}>
                            <Ionicons name="chatbubble-outline" size={32} color="grey" />
                        </TouchableOpacity>
                        {commentNumber > 0 ?
                            <Box style={{position:"absolute", borderColor:theme.borderColorDark, borderWidth:2, right:-13, top:-7, borderRadius:10, padding:2}}>
                                <Text style={styles.IconText}>{commentNumber}</Text>
                            </Box>
                        :<></>}
                    </HStack>
                </Box>
            </HStack>
            <HStack id="addedBy-section" style={styles.HStackSection}>
                <TouchableOpacity onPress={() => {
                    router.push(`/profile/${post.added_by}`);
                }}>
                    <HStack space={"xs"}>
                        <Center>
                            <Ionicons name="arrow-redo-outline" size={30} color={theme.iconNotFocusedColor}/>
                        </Center>
                        <Avatar user_id={post.added_by} width={35} height={35}/>
                        <Text style={styles.addedByText}>{post.added_by_name}</Text>
                    </HStack>
                </TouchableOpacity>
            </HStack>
        </Box>
    )
}

export default PostAction;