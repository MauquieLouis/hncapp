import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { TouchableOpacity, View, Image, Text, StyleSheet } from "react-native";
import { Box } from "@/components/ui/box";


import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import AudioRecorder from '@/components/conversations/audioRecorder';
import { ImageManipulator, useImageManipulator } from 'expo-image-manipulator';
import { Textarea, TextareaInput } from '../ui/textarea';
import { TextInput } from 'react-native';
import { v6 as uuidv6 } from 'uuid';
import 'react-native-get-random-values';
import { supabase } from "@/libs/initSupabase";
import { ScrollView } from "react-native-gesture-handler";
import { Video } from "expo-av";
import * as DocumentPicker from 'expo-document-picker';
import { HStack } from "@/components/ui/hstack";
import { useUserContext } from "@/contexts/userContext";
import {
  Toast,
  ToastTitle,
  ToastDescription,
  useToast,
} from '@/components/ui/toast';

const ImagePostSelector = (props: { setAssets: any }) => {

    const [ media, setMedia ] = useState<ImagePicker.ImagePickerAsset[]>([]);
     
    const { theme } = useUserContext();

    const toast = useToast();

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            // allowsEditing: true,
            // aspect: [4,3],
            quality:1,
            // base64: true,
            allowsMultipleSelection: true,
            selectionLimit: 9,
        });
        // if(!result.canceled){
        //     setMedia(result.assets);
        //     // setImages(result.assets[0].uri);
        //     // compressImage(result.assets[0].uri);
        //     // uploadImage(result.assets);
        // }
        console.log("~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-");
        console.log(" ~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-");
        console.log("~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-");
        console.log("\t")
        console.log("\t Don't forget to change the image picker in this pickImage fct components/profile/imagePostSelector.tsx");
        console.log("\t")
        console.log("~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-");
        console.log(" ~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-");
        console.log("~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-~=*°*=~-"); 
        // const result = await DocumentPicker.getDocumentAsync({
        //     type: ['image/*', 'video/*'],
        //     multiple: true,
        // }); 

        if(!result.canceled){
            setMedia(result.assets);
            props.setAssets(result.assets);
            // setImages(result.assets[0].uri);
            // compressImage(result.assets[0].uri);
            // uploadImage(result.assets);
        }
    }

    const openCamera = async () => {
        if(media.length >= 9 ){
            showToastMediaLimit();
            return;
        }
        const permissions = await ImagePicker.requestCameraPermissionsAsync();
        if(!permissions.granted) {
            console.warn("Camera permissions not granted");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['videos', 'images'],
            quality: 1,
        });
        if(!result.canceled){
            setMedia((prev) => [...prev, ...result.assets]);
            props.setAssets((prev: any) => [...prev, ...result.assets]);
        }
    }

    const openVideo = async () => {
        if(media.length >= 9 ){
            showToastMediaLimit();
            return;
        }
        const permissions = await ImagePicker.requestCameraPermissionsAsync();
        if(!permissions.granted) {
            console.warn("Camera permissions not granted");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['videos'],
            quality: 1,
            videoMaxDuration: 60,
        });
        if(!result.canceled){
            setMedia((prev) => [...prev, ...result.assets]);
            props.setAssets((prev) => [...prev, ...result.assets]);
        }
    }

    const showToastMediaLimit = () => {
        const newId = Math.random().toString(36).substring(7);
        toast.show({
        id: newId,
        placement: "top",
        duration: 6000,
        render: ({id}) => {
            const uniqueToastId = 'toast-' + id;
            return(
            <Toast nativeID={uniqueToastId} action="muted" variant="solid">
                <ToastTitle>Media Limit !</ToastTitle>
                <ToastDescription>
                    You can oly have 9 Media. 
                </ToastDescription>
            </Toast>
            );
        }
        })
    }

    const styles = StyleSheet.create({
        mainBox:{
            flex:6, 
            height:"100%", 
            padding:"10%"
        },
        hstackAction:{
            justifyContent: 'center', 
            alignItems: 'center', 
            height:"15%", 
            padding:1, 
            marginBottom:16, 
            flexDirection:"row"
        },
        touchableIcon:{
            width:"15%",  
            height:50, 
            borderColor:theme.iconColor, 
            borderWidth:2, 
            borderRadius:4, 
            justifyContent:"center", 
            alignItems:"center"
        },
        deletePictureIcon:{
            position: 'absolute', 
            top: 0, 
            right: 0, 
            padding: 4, 
            backgroundColor: 'rgba(0, 0, 0, 0.3)', 
            borderRadius: 8 
        },
        imageStyle:{
            width: 260, 
            height: 260, 
            borderRadius: 8 
        }
    });

    return(
        <Box style={styles.mainBox}>
            {/* IMAGE SELECTION ZONE */}
            <HStack style={styles.hstackAction} space={"md"}>
                <TouchableOpacity 
                    onPress={() => {
                        openVideo();
                    }}
                    style={styles.touchableIcon}>
                    <Ionicons name="videocam-outline" size={28} color={theme.iconColor}/>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => {
                        openCamera();
                    }}
                    style={styles.touchableIcon}>
                    <Ionicons name="camera-outline" size={28} color={theme.iconColor}/>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => {
                        pickImage();
                    }}
                    style={styles.touchableIcon}>
                    <Ionicons name="image-outline" size={28} color={theme.iconColor}/>
                </TouchableOpacity>
            </HStack>
            <Box>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
                    {media.map((item, index) => (
                        <View key={index} style={{ marginRight: 16 }}>
                            {item.mimeType?.startsWith('image') ? (
                            <>
                            <Image
                                source={{ uri: item.uri }}
                                style={styles.imageStyle}
                                />
                            <Box style={styles.deletePictureIcon}>
                                <TouchableOpacity onPress={() => {
                                    setMedia(media.filter((_, i) => i !== index));
                                }}>
                                    <Ionicons name="close-circle-outline" size={24} color="white" />
                                </TouchableOpacity>
                            </Box>
                            </>
                            ) : (
                            <>
                                <Video
                                    source={{ uri: item.uri }}
                                    rate={1.0}
                                    volume={1.0}
                                    isMuted={true}
                                    // resizeMode="cover"
                                    shouldPlay={true}
                                    style={styles.imageStyle}
                                    />
                                <Box style={styles.deletePictureIcon}>
                                    <TouchableOpacity onPress={() => {
                                        setMedia(media.filter((_, i) => i !== index));
                                    }}>
                                        <Ionicons name="close-circle-outline" size={24} color="white" />
                                    </TouchableOpacity>
                                </Box>
                            </>
                            )}
                        </View>
                        ))}
                </ScrollView>
            </Box>
        </Box>
    )
}

export default ImagePostSelector;