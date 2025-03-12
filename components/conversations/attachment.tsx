import React, { Dimensions, TouchableOpacity, View, StyleSheet } from "react-native";
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
import { Modal, ModalBackdrop, ModalContent, ModalHeader } from "../ui/modal";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import VideoPlayer from "./video";
import VideoThumbNail from "./videoThumbnail";
import * as Haptics from "expo-haptics";
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent } from "../ui/actionsheet";
import ZoomableImage from "./ZoomableImage";
import MessageActionSheet from "./messageActionSheet";

const ImageDisplay = (props: any) => {

    const attachments = props.attachment;
    const attachmentsUrls = props.attachmentsUrls;
    let index;
    if(props.index){
        index = props.index;
    }else{
        index = 0;
    }
    let height, height2, width, moveSize, resizeMode;
    let mode: "horizontal-stack" | "vertical-stack" | undefined;
    if(props.modal == true){
        height=Dimensions.get('window').height * 0.85;
        height2=height;
        width=Dimensions.get('window').width * 0.9;
        moveSize=Dimensions.get('window').width * 2,5;
        resizeMode="contain";
        mode="left-align";
    }else{
        height=220;
        height2=height*1.1;
        width=Dimensions.get('window').width *0.64;
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
                    resizeMode:resizeMode,
                    modalOpen:props.modal,
                    actionSheetTable:props.actionSheetTable
                })}
                scrollAnimationDuration={460}
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
                <>
                    {attachmentsUrls != null && attachmentsUrls.length && attachmentsUrls[0] != 'null' ? 
                        <TouchableOpacity onPress={props.openModal} activeOpacity={1} onLongPress={() => {Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);props.openActionSheetFunction(1);}}>
                        <Center style={{ 
                            alignItems: "center",
                            justifyContent: "center",
                            width:"100%",
                            height: height2,
                             }}>
                                {attachments.attachments[0].type.startsWith("video/") ? 
                                <>
                                    {props.modal == false ?
                                        <>
                                        <VideoThumbNail uri={attachmentsUrls[0]} width={width} height={height} borderRadius={15} resizeMode={resizeMode}/>
                                            <View style={styles.overlay}>
                                                <View style={styles.overlayVideo}>
                                                    <Ionicons name={'videocam-outline'} color={'white'} size={26}/>
                                                </View>
                                            </View>
                                        </>
                                    : 
                                        <VideoPlayer uri={attachmentsUrls[0]} width={width} height={height} borderRadius={15} resizeMode={resizeMode}/>
                                    }
                                </>
                                : 
                                    <Image
                                    width={width}
                                    height={height}
                                    // style={[{}]}
                                    borderRadius={15}
                                    elevation={5}
                                    size='none'
                                    source={attachmentsUrls[0]}
                                    alt={"One CenteredPicture sended"}
                                    resizeMode={resizeMode}
                                    />
                                    // <ZoomableImage
                                    //     uri={attachmentsUrls[0]}
                                    //     width={width}
                                    //     height={height}
                                    //     resizeMode={resizeMode}
                                    // />
                                }
                        </Center>
                        </TouchableOpacity>
                        :
                        <></>}
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
    const [ showActionSheet, setShowActionSheet ] = useState(false);

    const onCloseModal = () => setOpenModal(false);
    const onCloseActionSheet = () => setShowActionSheet(false);
    const openModalFunction = (_index: any) => {
        setOpenModal(true); 
        setIndexOpenModal(_index); 
    };
    const openActionSheetFunction = (_index: any) => { 
        setShowActionSheet(true); 
        setIndexOpenModal(_index);
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

    const actionSheetTable: { [key: string]: { icon: string; onPress: () => void; } } = {
        "info": {
            icon: "information-circle-outline",
            onPress: () => {console.log("Info Pressed")},
        },
        "download": {
            icon: "download-outline",
            onPress: () => {console.log("DL Pressed"); },
        }
    }
    if(item.sender_id == user.id){
        actionSheetTable["delete"] = {
            icon: "trash-outline",
            onPress: () => {console.log("Delete Pressed"); deleteMessageAndAttachement();},
        }
    }

    const deleteMessageAndAttachement = async () => {
        try{
            //SOFT DELETE THE MESSAGE
            const { data: data_soft_delete_msg, error: error_soft_delete_msg } = await supabase.from('messages').update({deleted_at:new Date().toISOString()}).eq('id',item.id);
            //DELETE ALL THE ASSOCIATED ATTACHMENTS
            const { data: deleted_attachments, error: error_deleted_attachment } = await supabase.from('attachments').delete().eq('message_id',item.id).select();
            //DELETE ASSOCIATED ATTACHMENTS IN STORAGE
            if(deleted_attachments){
                    const urls: string[] = deleted_attachments.map(item => item.url);
                    console.log("URLS TO DELETE : ",urls);
                    const { data: data_delete_attachment, error: error_delete_attachment } = await supabase.storage.from('Conversations').remove(urls);
                    if(error_delete_attachment){
                        console.log("Error in deleteMessage function when deleting attachment in components/attachment.tsx file :", error_delete_attachment);
                    }
            }
            if(error_soft_delete_msg){
                console.log("Error in deleteMessage function when soft deleting msg in components/attachment.tsx file :", error_soft_delete_msg);
            }
            if(error_deleted_attachment){
                console.log("Error in deleteMessage function when deleting attachment in components/attachment.tsx file :", error_deleted_attachment);
            }
        }catch(error: unknown){
            console.log("Error in deleteMessage function in components/attachment.tsx file :", error);
        }finally{

        }
    }

    // console.log("ITEM USER AND USER : ",item, " / USER :",user.id);
    return(
        <>
            <Box>
                <HStack reversed={item.sender_id == user.id ? true : false} style={{paddingHorizontal:5}}>
                    <Box style={
                        item.sender_id == user.id ?
                        //My message
                        {}
                        :
                        //Other message
                        {}
                    } width={'76%'}>
                        <Box> 
                            <ImageDisplay 
                                attachment={item} 
                                openModal={openModalFunction} 
                                attachmentsUrls={attachmentsUrls} 
                                modal={false} 
                                openActionSheetFunction={openActionSheetFunction} 
                                actionSheetTable={actionSheetTable}/>
                        </Box>
                    </Box> 
                </HStack>
                {/* --------- MODAL FOR CAROUSEL --------- */}
            </Box>
            <Modal
                style={{}}
                isOpen={openModal}
                onClose={onCloseModal} >
                <ModalContent style={{width: '90%', height: '90%', backgroundColor:'rgba(0,0,0,0.93)', padding:0, borderWidth:0}}>
                    <ModalHeader style={{padding:10}}>
                        <Ionicons name="arrow-back-outline" size={32} color="white" onPress={onCloseModal}/>
                        <Ionicons name="menu-outline" size={32} color="white" onPress={openActionSheetFunction}/>
                    </ModalHeader>
                    <ImageDisplay attachment={item} openModal={openModalFunction} attachmentsUrls={attachmentsUrls} index={indexOpenModal} modal={true} openActionSheetFunction={openActionSheetFunction}/>

                </ModalContent> 
            </Modal>
            <MessageActionSheet items={actionSheetTable} showActionSheet={showActionSheet} onCloseActionSheet={onCloseActionSheet}/>
        </>

    )
}

export default Attachment;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
},
  overlayVideo: {
    backgroundColor: "rgba(0, 0, 0, 0.56)",
    padding: 14,
    borderRadius: 10,
    minWidth: 30,
    minHeight: 30,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "rgba(255, 255, 255, 0.56)",
    borderWidth: 2
},
  ActionSheetHStack: {
    width:"100%",
    justifyContent:"space-between",
    alignItems:"center",
    padding:4,
    height:150,
  },
  ActionSheetBox: {
    flex:1,
    padding:4,
    backgroundColor:"white",
    alignItems:"center",
  }
});