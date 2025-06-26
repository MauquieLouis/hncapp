import React, { useState, useEffect } from 'react';
import { supabase } from '@/libs/initSupabase';
import { Text } from '@/components/ui/text';
import { Box } from '@/components/ui/box'; 

import type { ICarouselInstance } from 'react-native-reanimated-carousel';
import Carousel, { Pagination } from "react-native-reanimated-carousel";
import { renderItem } from './render-item';
import { useSharedValue, interpolate, Extrapolation } from 'react-native-reanimated';

const PostElemInPostsList = (props: any) => {

    const [ urls, setUrls ] = useState([]);

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
        <Box>
            <Carousel
                ref={ref}
                data={urls}
                height={300}
                loop={false}
                onProgressChange={progress}
                pagingEnabled={true}
                snapEnabled={true}
                width={320}
                style={{
					alignItems: "center",
					justifyContent: "center",
					width: "100%",
					height: 300,
                    borderColor:"white",
                    borderWidth:1
				}}
				mode={"parallax"}
                // modeConfig={{stackInterval:1}}
                modeConfig={{
					parallaxScrollingScale: 1,
					parallaxScrollingOffset: 0,
				}}
                renderItem={renderItem({ rounded: true, imagesArray: urls})}
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
    );

}

export default PostElemInPostsList;
