import React, { Dimensions, TouchableOpacity, View, StyleSheet, Alert } from "react-native";
import { Image } from "@/components/ui/image";
import { useEffect, useRef, useState } from "react";
import { Center } from "@/components/ui/center";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { HStack } from '@/components/ui/hstack';
import { useUserContext } from "@/contexts/userContext";
import type { ICarouselInstance } from "react-native-reanimated-carousel";
import Carousel from "react-native-reanimated-carousel";
import { renderItem } from "./renderItem";
import { supabase } from "@/libs/initSupabase";
import { Modal, ModalContent, ModalHeader } from "@/components/ui/modal";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { Ionicons } from "@expo/vector-icons";
import VideoPlayer from "./video";
import VideoThumbNail from "./videoThumbnail";
import MessageActionSheet from "./messageActionSheet";
import * as Haptics from "expo-haptics";
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Spinner } from "../ui/spinner";

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
            // defaultIndex={props.indexOpenModal}
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
                    actionSheetTable:props.actionSheetTable,
                    openModalIconFunction:props.openModalIconFunction,
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
                onSnapToItem={(index) => {console.log("snap Item : ",index); props.setIndexOpenModal(index)}} //use to remember the item of the id when opening modal carousel.
                />
                :
                <>
                    {attachmentsUrls != null && attachmentsUrls.length && attachmentsUrls[0] != 'null' ? 
                        <TouchableOpacity onPress={() => {props.openModal(0)}} activeOpacity={1} onLongPress={() => {
                            console.log("attch", props.attachment.id);
                            // props.calculPositionFunction(props.attachment.id);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            // props.openActionSheetFunction(0);
                            props.openModalIconFunction();
                            }}>
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

    const onCloseModal = (_index: any) => {setOpenModal(false); setIndexOpenModal(_index);};
    const onCloseActionSheet = () => setShowActionSheet(false);

    const openModalFunction = (_index: any) => {
        console.log("INDEX :", _index);
        setOpenModal(true); 
        setIndexOpenModal(_index); 
    };
    const openActionSheetFunction = (_index: any) => { 
        setShowActionSheet(true); 
        setIndexOpenModal(_index);
    };

    const item = props.item;
    const { user } = useUserContext();
    const toast = useToast();
    // console.log("PROPS ATTACH : ", props.item.attachments);

    useEffect(() => {
        getAttachmentsUrls();
    }, []);

    const getAttachmentsUrls = async () => {
        try{
            // 1. Split attachments into local and remote
            const localUrls: ((prevState: never[]) => never[]) | string[] = [];
            const remoteAttachments: { index: number; url: string }[] = [];

            item.attachments.forEach((attachment: { local_path: string; url: any; }, index: string | number) => {
            if (attachment.local_path) {
                localUrls[index] = attachment.local_path;
            } else {
                remoteAttachments.push({ index, url: attachment.url });
            }
            });

            // 2. Generate signed URLs for remote attachments
            let signedUrls: string[] = [];
            if (remoteAttachments.length > 0) {
            const { data, error } = await supabase.storage
                .from("Conversations")
                .createSignedUrls(remoteAttachments.map(a => a.url), 5400);

            if (error) {
                console.error(
                "❌ Error creating signed URLs in components/attachment.tsx:",
                error
                );
            }

            signedUrls = data?.map(d => d.signedUrl) || [];

            // 3. Insert signed URLs into the correct positions
            remoteAttachments.forEach((remote, i) => {
                localUrls[remote.index] = signedUrls[i];
            });
            }
            // console.log("LOCALS URLS :",localUrls);
            setAttachmentsUrls(localUrls);
            // setLoadingUrls(true);
            // const urls = item.attachments.map((attachment: { url: any; local_path?: any }) =>
            //     attachment.local_path ?? attachment.url
            //   );
            // const { data, error } = await supabase.storage.from('Conversations').createSignedUrls(urls, 5400);
            // if(error){
            //     console.log("Error in Attachment when creatingSignedUrls function in components/attachment.tsx file :", error);
            // }
            // const signedUrls = data?.map((signedURL) => signedURL.signedUrl)
            // setAttachmentsUrls(signedUrls);

        }catch(error: unknown){
            console.log("Error in Attachment function in components/attachment.tsx file :", error);
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
            onPress: () => {console.log("DL Pressed");
                setTimeout(() => {downloadAttachment(attachmentsUrls[indexOpenModal], item.attachments[indexOpenModal].url)}, 1000);
                console.log("INDEX :",indexOpenModal,", ATTACHMENT URLS INDEX MODAL :", attachmentsUrls[indexOpenModal], ", ITEM :",item.attachments[indexOpenModal]) /*downloadAttachment(attachmentsUrls[indexOpenModal], item.attachments[indexOpenModal].name)*/;},
        }
    }
    if(item.sender_id == user.id){
        actionSheetTable["delete"] = {
            icon: "trash-outline",
            onPress: () => {console.log("Delete Pressed"); props.deleteFunction();},
        }
    }

    const downloadAttachment = async (url: string, filename: string) => {
        try{
            setLoadingUrls(true);
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Denied", "You need to allow access to save media.");
                return;
            }
            onCloseActionSheet();
            const fileUri = FileSystem.documentDirectory + filename.split('/')[1];
            const { uri } = await FileSystem.downloadAsync(url, fileUri);
            const asset = await MediaLibrary.createAssetAsync(uri);
            toast.show({
                duration: 1500,
                placement: "bottom",
                render: ({ id }) => {
                  const toastId = "toast-" + id
                  return (
                    <Toast
                      nativeID={toastId}
                      className="px-5 py-5 gap-10 shadow-soft-1 items-center flex-row mb-10"
                    >
                      <ToastTitle size="lg">FILE DOWNLOADED SUCCESSFULLY !</ToastTitle>
                    </Toast>
                  )
                },
              });
        }catch(error: unknown){ 
            console.log("Error in downloadAttachment function in components/attachment.tsx file :", error);
        }finally{
            setLoadingUrls(false);
        }
    }

    return(
        <>
        {loadingUrls ? <Spinner/>: 
        <>
            <Box>
                <HStack reversed={item.sender_id == user.id ? true : false} style={{paddingHorizontal:0}}>
                    <Box style={
                        item.sender_id == user.id ?
                        //My message
                        {}
                        :
                        //Other message
                        {}
                    } width={'85%'}>
                        <Box> 
                            <ImageDisplay 
                                attachment={item} 
                                openModal={openModalFunction} 
                                attachmentsUrls={attachmentsUrls} 
                                modal={false} 
                                openActionSheetFunction={openActionSheetFunction} 
                                actionSheetTable={actionSheetTable}
                                setIndexOpenModal={setIndexOpenModal}
                                indexOpenModal={indexOpenModal}
                                openModalIconFunction={props.openModalIconFunction}/>
                        </Box>
                    </Box> 
                </HStack>
                {/* --------- MODAL FOR CAROUSEL --------- */}
            </Box>
            <Modal
                style={{}}
                isOpen={openModal}
                onClose={() => {onCloseModal(indexOpenModal)}} >
                <ModalContent style={{width: '90%', height: '90%', backgroundColor:'rgba(0,0,0,0.93)', padding:0, borderWidth:0}}>
                    <ModalHeader style={{padding:10}}>
                        <Ionicons name="arrow-back-outline" size={32} color="white" onPress={onCloseModal}/>
                        <Ionicons name="menu-outline" size={32} color="white" onPress={() => {openActionSheetFunction(indexOpenModal)}}/>
                    </ModalHeader>
                    <ImageDisplay 
                        attachment={item} 
                        openModal={openModalFunction} 
                        attachmentsUrls={attachmentsUrls} 
                        index={indexOpenModal} 
                        modal={true} 
                        openActionSheetFunction={openActionSheetFunction} 
                        actionSheetTable={actionSheetTable}
                        setIndexOpenModal={setIndexOpenModal}
                        indexOpenModal={indexOpenModal}
                        openModalIconFunction={props.openModalIconFunction}/>
                </ModalContent> 
            </Modal>
            <MessageActionSheet items={actionSheetTable} showActionSheet={showActionSheet} onCloseActionSheet={onCloseActionSheet}/>
        </>
        }
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