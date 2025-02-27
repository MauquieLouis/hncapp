import React, { Dimensions, View } from "react-native";
import { Image } from "@/components/ui/image";
import { useEffect, useRef, useState } from "react";
import { Text } from "@/components/ui/text";
import { Center } from "@/components/ui/center";
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

            // console.log("MAP ATTACHED :", attachments.attachments)
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
            // console.log("DATA SIGNED URL :", data);
            const signedUrls = data?.map((signedURL) => signedURL.signedUrl)
            // console.log("SIGNED URLS : ", signedUrls);
            setImages(signedUrls);

        }catch(error: unknown){
            console.log("Error in ImageDisplay function in components/attachment.tsx file :", error);
        }finally{
            setLoadingImages(false);
        }
    }

    const ref = useRef<ICarouselInstance>(null);
    // console.log("IMAGES :", attachments);
    console.log("IMAGES :", images);
    return (
        // <Text>ATTACHMENTS</Text>
        <Box id={"carousel-component"+props.id}>
            {images.length != 1 ?
            <Carousel
            key={props.id}
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
                    borderWidth:2,
                    borderColor:"purple"
                }}
                mode={"horizontal-stack"}
                modeConfig={{
                    snapDirection: "left",
                    stackInterval: 18,
                    rotateZDeg:65,
                    // scaleInterval:0.08,
                    // opacityInterval:100,
                    moveSize: Dimensions.get('window').width * 0.72 //It let a bit elem of the picture on the screen.
                }}
                // enabled={false}
                customConfig={() => ({ type: "positive", viewCount: 5 })}
                renderItem={renderItem({rounded: true, imagesArray:images})}
                scrollAnimationDuration={660}
                onConfigurePanGesture={(gesture) => {
                    gesture.activeOffsetX([-50,50]);
                    // gesture.minVelocity(0);
                    // gesture.activeOffsetY([-10,10]);
                    //Maybe try to find a way to activate or not the carousel ? like if click one tile on it will made the picture carousel available.
                    //with enabled false.
                    return gesture;
                }}
                //onSnapToItem //use to remember the item of the id when opening modal carousel.
                />
                :
                // <></>
                <>
                    {images != null && images.length && images[0] != 'null' ? 
                        <Center style={{ 
                            alignItems: "center",
                            justifyContent: "center",
                            width: Dimensions.get('window').width * 0.64,
                            height: 240,
                            width:"100%",
                            borderColor:'green', borderWidth:1
                             }}>
                        <Image
                            width="90%"
                            height={220}
                        
                            // style={[{}]}
                            borderRadius={15}
                            size='none'
                            source={images[0]}
                            alt={"One CenteredPicture sended"}
                            resizeMode="cover"
                            />
                        </Center>
                        :
                        <></> }
                </>
                }
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