import React from "react-native";
import { useRef, useState } from "react";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { HStack } from '@/components/ui/hstack';
import { useUserContext } from "@/contexts/userContext";
import type { ICarouselInstance } from "react-native-reanimated-carousel";
import Carousel from "react-native-reanimated-carousel";
import { renderItem } from "./renderItem";

const ImageDisplay = (props: any) => {

    const [ loadingImages, setLoadingImages ] = useState(false);

    const getImages = ()  => {
        try{

        }catch(error: unknown){

        }finally{

        }
    }
    const message = props.message;
    const ref = useRef<ICarouselInstance>(null);
    console.log("IMAGES :", message);
    return (
        // <Text>ATTACHMENTS</Text>
        <Box id="carousel-component">
            <Carousel
                ref={ref}
                autoPlayInterval={2000}
                // data={defaultDataWith6Colors}
                height={220}
                loop={true}
                pagingEnabled={true}
                snapEnabled={true}
                width={430 * 0.75}
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
                }}
                customConfig={() => ({ type: "positive", viewCount: 5 })}
                renderItem={renderItem({rounded: true, imagesArray:[]})}
            
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
                    {borderBlockColor:"red", borderWidth:1, backgroundColor:'lime'}
                    :
                    //Other message
                    {borderBlockColor:"blue", borderWidth:1, backgroundColor:'lime'}
                } width={'66%'}>
                    <Box> 
                        <ImageDisplay attachment={item}/>
                    </Box>
                </Box> 
            </HStack>
        </Box>
    )
}

export default Attachment;