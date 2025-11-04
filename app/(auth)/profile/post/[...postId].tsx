import React, { useEffect, useState } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { useLocalSearchParams, useNavigation } from "expo-router";
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

export default function PostId(){

    const [showModal, setShowModal] = useState(false);

    const { postId } = useLocalSearchParams();
    const { theme, profile } = useUserContext();
    
    // const { selectedPost } = usePostStore();
    const selectedPost = usePostStore((state) => state.getPost(postId[0] as string));
    const post = selectedPost?.post_id === postId[0] ? selectedPost : null;
    const navigation = useNavigation();

    useEffect(() => {
        if(profile){
            console.log("POST :",post)
            navigation.setOptions({
                headerTitle:``,
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
                                    console.log("SETTING PICTURE");
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

    // console.log("DATASSSS :",postId[0]);
    // console.log("selectedPost :", selectedPost);
    // console.log("POST : ",post);

    const width = Dimensions.get("window").width;
    const ref = React.useRef<ICarouselInstance>(null);
    const progress = useSharedValue<number>(0);
    
    const styles = StyleSheet.create({
        mainContainer:{
            flex:1,
            backgroundColor: theme.backgroundColor1,
        },
        // carousel:{
        //     alignItems: "center",
        //     justifyContent: "center",
        //     width: "100%",
        //     height: 300,
        //     marginBottom:4
        // },
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
    if(post === null){
        console.log("POST NULL");
        return(
            <Box>
                <Text>No Post Found</Text>
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
				onSnapToItem={(index) => console.log("current index:", index)}
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
            <Modal isOpen={showModal} onClose={() => {setShowModal(false)}} size="md">
                <ModalBackdrop/>
                <ModalContent>
                    <ModalHeader>
                        <Text>Settings</Text>
                        <ModalCloseButton>
                        <Ionicons name="close" size={32} color={theme.iconColor}/>
                        </ModalCloseButton>
                    </ModalHeader>
                    <ModalBody>
                        <Text size="sm" className="text-typography-500">
                        Delete the post ?
                        </Text>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    )
}