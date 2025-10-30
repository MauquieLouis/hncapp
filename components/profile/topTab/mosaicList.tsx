import React, { useCallback, useEffect, useRef } from "react";
import { Text } from "@/components/ui/text";
import { Dimensions, FlatList, TouchableOpacity } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useFocusEffect, useIsFocused, useNavigation } from "@react-navigation/native";
import { supabase } from "@/libs/initSupabase";
import { useUserContext } from "@/contexts/userContext";
import { HStack } from "@/components/ui/hstack";
import { Image } from "expo-image";
import { v6 as uuidv6 } from 'uuid';
import 'react-native-get-random-values';
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { usePostStore } from "@/contexts/store";

const MosaicList = (props: any) => {

    const [ mosaicData, setMosaicData ] = React.useState<any[]>([]);

    const scrollRef = useRef(null);
    const scrollY = useSharedValue(0);
    const { profile } = useUserContext();

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y
        },
        onBeginDrag: () => {
            props.isScrolling.value = true;
            //When scrollBegin
        },
        onEndDrag: () => {
            props.isScrolling.value = false;
            if (scrollY.value > 0 && props.headerVisible.value === 1) {
                props.headerVisible.value = 0
            } else if (scrollY.value <= 0 && props.headerVisible.value === 0) {
                props.headerVisible.value = 1
            }
        },
        onMomentumEnd: () => {
            if (scrollY.value > 0 && props.headerVisible.value === 1) {
                props.headerVisible.value = 0
            } else if (scrollY.value <= 0 && props.headerVisible.value === 0) {
                props.headerVisible.value = 1
            }
            props.isScrolling.value = false;
        },
    })

    useFocusEffect(
        useCallback(() => {
        if (scrollY.value > 0) {
            props.headerVisible.value = 0
        } else {
            props.headerVisible.value = 1
        }
        }, [])
    );

    const page = 1; // page actuelle
    const pageSize = 10; // nombre de posts par page
    const getMosaicPosts = async() => {
        try{
            //-----------------------
            //---------------------- /|\
            // -------------------- / | \ 
            // ------------------- /__.__\
            //DONT FORGET TO UNCOMMENT 'and pa.position = 1' IN THE SUPABASE RPC FUNCTION otherwise, it migth be a random picture.
            const { data, error } = await supabase
            .rpc('get_user_posts', {
                user_uuid: props.profileId,
                limit_count: pageSize,
                offset_count: (page - 1) * pageSize
            });
            if (error) {
                console.error(error);
            } else {
                // console.log("DATA ;", data);
                const attachmentUrls = data
                .map((post: { attachment_url: any; }) => post.attachment_url)
                .filter((url: null) => url !== null).map((url: string) => `${props.profileId}/`+url);
                // console.log("Attachment URLs:", attachmentUrls);
                const { data: signedUrlsData, error: signedUrlsError } = await supabase.storage.from('posts').createSignedUrls(attachmentUrls, 3600);
                if(signedUrlsError){
                    console.error("Error while creating signed URLs:", signedUrlsError);
                }else{
                    // if (!data) return;
                    const allAttachmentUrls = data
                    .flatMap((post: { attachment_urls: string[] }) =>
                        (post.attachment_urls || [])
                        .filter(url => url !== null)
                        .map(url => `${props.profileId}/${url}`)
                    );

                    // 2️⃣ Créer les signed URLs pour toutes les attachments
                    const { data: signedUrlsData, error: signedUrlsError } = await supabase
                    .storage
                    .from('posts')
                    .createSignedUrls(allAttachmentUrls, 3600);

                    if (signedUrlsError) {
                    console.error("Error while creating signed URLs:", signedUrlsError);
                    return;
                    }

                    // 3️⃣ Construire une map (clé = chemin complet du fichier → valeur = signed URL)
                    const signedUrlMap: Record<string, string> = {};
                    signedUrlsData?.forEach(entry => {
                    const path = entry.path;
                    if (!path) return;
                    if (entry.signedUrl) {
                        // Préchargement pour fluidifier le rendu
                        Image.prefetch(entry.signedUrl);
                        signedUrlMap[path] = entry.signedUrl;
                    }
                    });

                    // 4️⃣ Remplacer les URLs normales par les signed URLs dans chaque post
                    const finalDataWithSignedUrls = data.map((post: { attachment_urls: string[] }) => {
                    const signedUrls = (post.attachment_urls || []).map(url => {
                        const fullPath = `${props.profileId}/${url}`;
                        return signedUrlMap[fullPath] || null;
                    }).filter(Boolean); // Supprime les éventuels null

                    return {
                        ...post,
                        signedUrls, // ✅ tableau de signed URLs
                    };
                    });

                    // 5️⃣ Grouper par 3 pour ton affichage mosaïque
                    const groupedByThree = groupByThree(finalDataWithSignedUrls);
                    setMosaicData(groupedByThree);
                    console.log("Final Data with signed URLs:", finalDataWithSignedUrls);
                }
            }
        }catch(error: unknown){
            console.error("Error when getting Mosaic Posts in getMosaicPosts function, in mosaicList.tsx:", error);
        }
    }
    useEffect(() => {
        getMosaicPosts();
    }, []);

    const groupByThree = <T,>(inputArray: T[]): T[][] => {
        const result: T[][] = [];
        for(let i=0; i<inputArray.length; i+=3){
            const groupe = inputArray.slice(i, i+3);
            result.push(groupe);
        }
        return result;
    }
 
    const numbers: number[] = Array.from({ length: 150 }, (_, i) => i + 1);
    const widthScreen = Dimensions.get('window').width;
    const renderItem = ({ item }: any) => (
        <HStack style={{/*borderColor:'red', borderWidth:1*/}} key={uuidv6()}>
            {item.map((subItem: any) => (
                // <Text key={subItem.post_id} style={{color:"green", marginRight:10}}>
                //   {`#${subItem.attachments_count}`}
                // </Text>
                <TouchableOpacity key={subItem.post_id} onPress={() => {
                    if (profile) {
                        //Maybe faire un prefetch ici des images du post ici
                        // console.log("SubItem clicked:", subItem);
                        usePostStore.getState().setSelectedPost(subItem);
                        // console.log("post :", usePostStore.getState().selectedPost);
                        router.push(`/profile/post/${subItem.post_id}`);
                    }
                }}>
                    <Image source={subItem.signedUrls[0]} style={{width:widthScreen/3,height:widthScreen/2}} 
                        placeholder={"../../../assets/images/adaptive-icon.png"}/>
                    {subItem.attachments_count > 1 ?
                    <Text style={{position:'absolute', top:5, right:5, color:'white', backgroundColor:'rgba(0,0,0,0.3)', paddingHorizontal:2, borderRadius:6, fontSize:12}}>
                        <Ionicons name={"albums"} color={"#DEDEDE"} size={18}/>
                        {/* {`+${subItem.attachments_count}`} */}
                    </Text>
                    :
                    <></>
                    }
                </TouchableOpacity>
            ))}
        </HStack>
      );

    return(
        <Animated.FlatList
            ref={scrollRef}
            contentContainerStyle={{padding:0}} 
            scrollEventThrottle={16}
            onScroll={onScroll}
            data={mosaicData}
            renderItem={renderItem}
            ListFooterComponent={<HStack style={{/*borderColor:'red', borderWidth:1*/}} key={uuidv6()}>
                <TouchableOpacity onPress={() => {}} style={{width:widthScreen/3,height:widthScreen/2.4, borderColor:'gray', borderWidth:1}}>
                </TouchableOpacity>
        </HStack>}
        />
    )
}

export default MosaicList;
