import React, { useEffect, useState } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { usePostStore } from "@/contexts/store";
import { Image } from "expo-image";
import Carousel, { ICarouselInstance, Pagination } from "react-native-reanimated-carousel";
import { renderItem } from "@/components/posts/render-item";
import { Dimensions, StyleSheet, TouchableOpacity } from "react-native";
import { Extrapolation, interpolate, useSharedValue } from "react-native-reanimated";
import { useUserContext } from "@/contexts/userContext";
import PostAction from "@/components/posts/postAction";
import { Ionicons } from "@expo/vector-icons";
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalHeader } from "@/components/ui/modal";
import { HStack } from "@/components/ui/hstack";
import { Center } from "@/components/ui/center";
import { supabase } from "@/libs/initSupabase";

export default function PostId(){

    const [ showModal, setShowModal ] = useState(false);
    const [ validateDelete, setValidateDelete ] = useState(false);

    const { postId } = useLocalSearchParams();
    const { theme, profile } = useUserContext();
    const router = useRouter();
    
    const selectedPost = usePostStore((state) => state.getPost(postId[0] as string));
    const { setDeletedItem } = usePostStore();
    const post = selectedPost?.post_id === postId[0] ? selectedPost : null;
    const navigation = useNavigation();

    useEffect(() => {
        if(profile){
            navigation.setOptions({
                headerTitle:``,
                //Create right part of the header 
                headerRight: () => {
                return(
                    <>
                        <Text 
                            style={{color:theme.textColor1}}>
                            Added by 
                            <Text style={{fontWeight:"300", color:theme.textColor2}}>
                                {' '}@{post.added_by_name}
                            </Text>
                        </Text>
                        {post.added_by == profile.user_id ? 
                        <>
                            <Text style={{color:theme.textColor3}}> (Me)</Text>
                            <TouchableOpacity style={{paddingLeft:12}}
                                onPress={() => {
                                    setShowModal(true);
                                }}>
                                <Ionicons name="settings-outline" size={28} color={theme.iconColor}/>
                            </TouchableOpacity>
                        </>
                        :
                        <></>}
                    </>
                )
                }
            });
        }
    }, [profile]);

    const width = Dimensions.get("window").width;
    const ref = React.useRef<ICarouselInstance>(null);
    const progress = useSharedValue<number>(0);
    
    const styles = StyleSheet.create({
        mainContainer:{
            flex:1,
            backgroundColor: theme.backgroundColor1,
        },
        dotStyle:{
            width: 5,
            height: 5,
            borderRadius: 12,
            backgroundColor: theme.iconNotFocusedColor,
        },
        activeDotStyle:{
            borderRadius: 12,
            width: 8,
            height: 8,
            overflow: "hidden",
            backgroundColor: theme.iconFocusedColor,
        },
        containerStyle:{
            gap: 5,
            marginVertical:8,
            alignItems: "center",
            height: 10,
        },
        modalTextActionStyle:{
            color:theme.textColor2,
            fontSize:13,
            fontWeight:300,
        },
        modalBodyStyle:{
            backgroundColor:theme.backgroundColor2,
        },
    });

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

    const handleDeleteFile = async() => {
        try{
            //First delete the file from bucket and local if it exist,
            const full_path_urls = []
            for(const file of post.attachment_urls){
                full_path_urls.push(post.user_id+"/"+file);
            }
            //Delete the files (array)
            const {data: delete_file_data, error: delete_file_error } = await supabase.storage.from('posts')
                .remove(full_path_urls);
            if(delete_file_error){
                console.error("Error when deleting files from bucket in handleDeleteFile function in [...postId].tsx", delete_file_error, "\n the file tab : ", full_path_urls);
            }else{
                //Delete audio if one exists
                if(post.file_url){
                    const { data: delete_audio_data, error:delete_audio_error } = await supabase.storage.from('posts')
                    .remove([post.file_url]);
                    if(delete_audio_error){
                        console.error("Error when deleting associated audio in handleDeleteFile function in [...postId].tsx", delete_audio_error);
                    }
                }
                //Second delete the attachments from db, it delete in cascade like, comment, post_attachments.
                const { data: delete_post_data, error: delete_post_error } = await supabase.from('posts')
                .delete().eq('id', post.post_id);
                if(delete_post_error){
                    console.error("Error when deleting post in handleDeleteFile function in [...postId].tsx file", delete_file_error);
                }
            }
            setDeletedItem(post.post_id);
        }catch(error: unknown){
            console.error("Error in handleDeleteFile function in [...postId].tsx", error);
        }
    }

    if(post === null){
        console.warn("POST NULL, in [...postId].tsx before return, this might be an issue, (maybe post has been deleted while someone was on a profile and didn't disappear from mosaic");
        return(
            <Box>
                <Text>Post doesn't exist anymore (might have been deleted by the owner)</Text>
            </Box>
        )
    }

    return(
        <Box style={styles.mainContainer}>
            <Carousel
                ref={ref}
				loop={false}
				width={width}
				height={width*1.3}
				snapEnabled={true}
                onProgressChange={progress}
				pagingEnabled={true}
				data={post.signedUrls}
				style={{ width: "100%" }}
				// onSnapToItem={(index) => }
				renderItem={renderItem({ rounded: true, imagesArray: post.signedUrls})}
			/>

            <Pagination.Custom<{ color: string }>
                progress={progress}
                data={post.signedUrls.map((color) => ({ color }))}
                size={12}
                dotStyle={styles.dotStyle}
                activeDotStyle={styles.activeDotStyle}
                containerStyle={styles.containerStyle}
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
            <PostAction post={post}/>
            <Modal isOpen={showModal} onClose={() => {setShowModal(false); setValidateDelete(false);}} size="md">
                <ModalBackdrop/>
                <ModalContent style={styles.modalBodyStyle}>
                    <ModalHeader>
                        <Text style={styles.modalTextActionStyle}>Settings</Text>
                        <ModalCloseButton>
                            <Ionicons name="close" size={32} color={theme.iconColor}/>
                        </ModalCloseButton>
                    </ModalHeader>
                    <ModalBody>
                        <Text size="sm" className="text-typography-500">
                        Delete the post ?
                        </Text>
                        <HStack space="4xl" style={{marginTop:8}}>
                            <Center style={{paddingRight:15}}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setValidateDelete(!validateDelete);
                                    }}>
                                    <Ionicons name="trash-outline" size={32} color={theme.iconColor}/>
                                </TouchableOpacity>
                            </Center>
                            {validateDelete ? 
                            <>
                                <TouchableOpacity onPress={() => {
                                    handleDeleteFile();
                                    router.back();
                                }}>
                                    <Ionicons name="checkmark" size={32} color={theme.iconColor}/>
                                    <Text style={styles.modalTextActionStyle}>Delete</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => {
                                    setValidateDelete(false);
                                    setShowModal(false);
                                }}>
                                    <Ionicons name="close" size={32} color={theme.iconColor}/>
                                    <Text style={styles.modalTextActionStyle}>Cancel</Text>
                                </TouchableOpacity>
                            </>
                            :<></>}
                        </HStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    )
}