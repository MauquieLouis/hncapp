import React, { Dimensions, View } from "react-native";
import * as RN from "react-native";
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
import { Modal, ModalBackdrop, ModalContent } from "../ui/modal";
import { Video } from "expo-av";

const ImageDisplay = (props: any) => {

    const attachments = props.attachment;
    const attachmentsUrls = props.attachmentsUrls;
    let index;
    if(props.index){
        index = props.index;
    }else{
        index = 0;
    }
    // RN.Image.getSize()
    let height, height2, width, moveSize, resizeMode, mode;
    if(props.modal == true){
        // RN.Image.getSize()
        height=Dimensions.get('window').height * 0.9;
        height2=height;
        width=Dimensions.get('window').width * 0.79;
        moveSize=Dimensions.get('window').width * 2,5;
        resizeMode="contain";
        mode="left-align";
    }else{
        height=220;
        height2=height*1.1;
        width=Dimensions.get('window').width *0.64
        moveSize=Dimensions.get('window').width * 0.72;
        resizeMode="cover";
        mode="horizontal-stack";
    }
    const ref = useRef<ICarouselInstance>(null);
    return (
        <Box id={"carousel-component"+props.id}>
            {attachmentsUrls.length != 1 ?
            <Carousel
                key={props.id}
                ref={ref}
                autoPlayInterval={2000}
                data={attachmentsUrls}
                height={height}
                loop={false}
                pagingEnabled={true}
                snapEnabled={true}
                defaultIndex={index}
                width={width}
                style={{
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: height2,
                    borderWidth:2,
                    borderColor:"purple"
                }}
                mode={mode}
                modeConfig={{
                    snapDirection: "left",
                    stackInterval: 18,
                    rotateZDeg:65,
                    // scaleInterval:0.08,
                    // opacityInterval:100,
                    moveSize: moveSize//It let a bit elem of the picture on the screen.
                }}
                // enabled={false}
                customConfig={() => ({ type: "positive", viewCount: 5 })}
                renderItem={renderItem({rounded: true,
                    imagesArray:attachmentsUrls,
                    openModalFunction:props.openModal, 
                    attachments:attachments.attachments,
                    resizeMode:resizeMode
                })}
                scrollAnimationDuration={660}
                onConfigurePanGesture={(gesture) => {
                    gesture.activeOffsetX([-50,50]);
                    // gesture.minVelocity(0);
                    // gesture.activeOffsetY([-10,10]);
                    //Maybe try to find a way toactivate or not the carousel ? like if click one tile on it will made the picture carousel available.
                    //with enabled false.
                    return gesture;
                }}
                //onSnapToItem //use to remember the item of the id when opening modal carousel.
                />
                :
                // <></>
                <>
                    {attachmentsUrls != null && attachmentsUrls.length && attachmentsUrls[0] != 'null' ? 
                        <Center style={{ 
                            alignItems: "center",
                            justifyContent: "center",
                            width: Dimensions.get('window').width * 0.64,
                            height: 240,
                            width:"100%",
                            borderColor:'green', borderWidth:1
                             }}>
                        {attachments.attachments[0].type.startsWith("video/") ? 
                        <>
                            { console.log("THIS IS A VIDEO :", attachments.attachments[0].type, attachmentsUrls[0]) }
                            <Video
                                source={{uri: attachmentsUrls[0]}}
                                rate={1.0}
                                volume={1.0}
                                isMuted={false}
                                resizeMode="cover"
                                shouldPlay={false}
                                useNativeControls
                                style={{ width: '88%', height: 220, borderRadius: 15 }}
                            />
                        </>
                        : 
                        <>
                            { console.log("THIS NOT IS A VIDEO :", attachments.attachments[0].type, attachmentsUrls[0]) }
                            <Image
                            width="88%"
                            height={220}
                            // style={[{}]}
                            borderRadius={15}
                            size='none'
                            source={attachmentsUrls[0]}
                            alt={"One CenteredPicture sended"}
                            resizeMode="cover"
                            />
                        </>
                        }
                        </Center>
                        :
                        <></> }
                </>
                }
        </Box>
    );
}

const Attachment = (props: any) => {

    const [ openModal, setOpenModal ] = useState(false);
    const [ indexOpenModal, setIndexOpenModal ] = useState(0);
    const [ loadingUrls, setLoadingUrls ] = useState(false);
    const [ attachmentsUrls, setAttachmentsUrls ] = useState([]);

    const onCloseModal = () => setOpenModal(false);
    const openModalFunction = (_index: any) => {
        setOpenModal(true); 
        setIndexOpenModal(_index); 
        console.log("INDEX OPEN :", _index); 
    };

    const item = props.item;
    const { user } = useUserContext();

    useEffect(() => {
        getAttachmentsUrls();
    }, []);

    const getAttachmentsUrls = async () => {
        try{
            setLoadingUrls(true);
            const urls = item.attachments.map((attachment: { url: any; }) => attachment.url);
            const { data, error } = await supabase.storage.from('Conversations').createSignedUrls(urls, 5400);
            if(error){
                console.log("Error in ImageDisplay when creatingSignedUrls function in components/attachment.tsx file :", error);
            }
            const signedUrls = data?.map((signedURL) => signedURL.signedUrl)
            setAttachmentsUrls(signedUrls);

        }catch(error: unknown){
            console.log("Error in ImageDisplay function in components/attachment.tsx file :", error);
        }finally{
            setLoadingUrls(false);
        }
    }

    return(
        <>
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
                            <ImageDisplay attachment={item} openModal={openModalFunction} attachmentsUrls={attachmentsUrls} modal={false}/>
                        </Box>
                    </Box> 
                </HStack>
                {/* --------- MODAL FOR CAROUSEL --------- */}
            </Box>
            <Modal
                style={{ borderColor:'red', borderWidth:1}}
                isOpen={openModal}
                onClose={onCloseModal} >
                <ModalBackdrop/>
                <ModalContent style={{width: '90%', height: '90%', borderColor:'lime', borderWidth:1}}>
                    <ImageDisplay attachment={item} openModal={openModalFunction} attachmentsUrls={attachmentsUrls} index={indexOpenModal} modal={true}/>

                    <Text>MODAL TEST</Text>
                </ModalContent> 
            </Modal>
        </>

    )
}

export default Attachment;