import React, { Dimensions } from "react-native";
import { useEffect, useRef, useState } from "react";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { HStack } from '@/components/ui/hstack';
import { useUserContext } from "@/contexts/userContext";
import type { ICarouselInstance } from "react-native-reanimated-carousel";
import Carousel from "react-native-reanimated-carousel";
import { renderItem } from "./renderItem";
import { supabase } from "@/libs/initSupabase";

const ImageDisplay = (props: any) => {

    const [ images, setImages] = useState([]);
    const [ loadingImages, setLoadingImages ] = useState(false);

    useEffect(() => {
        getImages();
    }, []);

    const attachments = props.attachment;
    const getImages = async ()  => {
        try{
            setLoadingImages(true);

            const urls = attachments.attachments.map((attachment: { url: any; }) => attachment.url);
            console.log(urls);
            
            const { data, error } = await supabase.storage.from('Conversations').createSignedUrls(urls, 5400);
            if(error){
                console.log("Error in ImageDisplay when creatingSignedUrls function in components/attachment.tsx file :", error);
            }
            // const downloadPromises = urls.map(async (filePath: string) => {
            //     const { data, error } = await supabase.storage.from('Conversations')
            //     .download(filePath);
            //     if (error) {
            //         throw error;
            //     }
            //     const url = URL.createObjectURL(data);
            //     return url;
            // });
            // const imageUrls = await Promise.all(downloadPromises);
            // console.log("IMAGES URLS :", data);
            const signedUrls = data?.map((signedURL) => signedURL.signedUrl)
            console.log("SIGNED URLS : ", signedUrls);
            setImages(signedUrls);

        }catch(error: unknown){
            console.log("Error in ImageDisplay function in components/attachment.tsx file :", error);
        }finally{
            setLoadingImages(false);
        }
    }

    const defaultDataWith6Colors = [
        "#B0604D",
        "#899F9C",
        "#899F9C",
    ];

    const ref = useRef<ICarouselInstance>(null);
    // console.log("IMAGES :", attachments);
    return (
        // <Text>ATTACHMENTS</Text>
        <Box id="carousel-component">
            <Carousel
                ref={ref}
                autoPlayInterval={2000}
                data={images}
                height={220}
                loop={false}
                pagingEnabled={true}
                snapEnabled={true}
                width={Dimensions.get('window').width * 0.64}
                style={{
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: 240,
                }}
                mode={"horizontal-stack"}
                modeConfig={{
                    snapDirection: "left",
                    stackInterval: 18,
                    rotateZDeg:65,
                    scaleInterval:0.08,
                    opacityInterval:1,
                    moveSize: Dimensions.get('window').width * 0.65 //It let a bit elem of the picture on the screen.
                }}
                customConfig={() => ({ type: "positive", viewCount: 5 })}
                renderItem={renderItem({rounded: true, imagesArray:images})}
                scrollAnimationDuration={660}
                
            />
        </Box>
    );
}

const Attachment = (props: any) => {

    const item = props.item;
    const { user } = useUserContext();
    return(
        <Box>
            <HStack reversed={item.sender_id == user.id ? true : false} style={{paddingHorizontal:5}}>
                <Box style={
                    item.sender_id == user.id ?
                    //My message
                    {borderBlockColor:"red", borderWidth:1}
                    :
                    //Other message
                    {borderBlockColor:"blue", borderWidth:1, backgroundColor:'lime'}
                } width={'76%'}>
                    <Box> 
                        <ImageDisplay attachment={item}/>
                    </Box>
                </Box> 
            </HStack>
        </Box>
    )
}

export default Attachment;