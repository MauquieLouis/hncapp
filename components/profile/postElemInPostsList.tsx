import React, { useState, useEffect } from 'react';
import { supabase } from '@/libs/initSupabase';
import { Text } from '@/components/ui/text';
import { Box } from '@/components/ui/box'; 

import type { ICarouselInstance } from 'react-native-reanimated-carousel';
import Carousel, { Pagination } from "react-native-reanimated-carousel";
import { renderItem } from './render-item';
import { useSharedValue, interpolate, Extrapolation } from 'react-native-reanimated';
import AudioPlayer from '../conversations/audioPlayer';
import UniversarlAudioPlayer from '../files/universalAudioPlayer';

const PostElemInPostsList = (props: any) => {

    const [ urls, setUrls ] = useState([]);
    const [ audioUrl, setAudioUrl ] = useState<string | null>(null);

    const item = props.item;
    const folder_url = props.folder_url;
    const bucket = props.bucket;
    const progress = useSharedValue<number>(0);

    useEffect(()=> {
        console.log("ITEM :",item);
        getSignedUrlForFiles();
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
            <Box style={{width:"80%", marginLeft:"10%", borderTopColor:"white", borderTopWidth:1, }}>
                {item.caption ?
                    <Text>
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
            </Box>
        </>
    );

}

export default PostElemInPostsList;
