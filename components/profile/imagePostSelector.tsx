import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { TouchableOpacity, View, Image, Text } from "react-native";
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

const ImagePostSelector = (props: { setAssets: any }) => {

    const [ media, setMedia ] = useState<ImagePicker.ImagePickerAsset[]>([]);
     

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

            // setImages(result.assets[0].uri);
            // compressImage(result.assets[0].uri);
            // uploadImage(result.assets);
        }
    }

    const openVideo = async () => {
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

            // setImages(result.assets[0].uri);
            // compressImage(result.assets[0].uri);
            // uploadImage(result.assets);
        }
    }

    return(
        <Box style={{ flex:6, height:"100%", padding:"10%"}}>
            {/* IMAGE SELECTION ZONE */}
            <HStack style={{ justifyContent: 'center', alignItems: 'center', height:"15%", padding:1, marginBottom:16, flexDirection:"row"}} space={"md"}>
                <TouchableOpacity 
                    onPress={() => {
                        openVideo();
                    }}
                    style={{ width:"15%",  height:"100%", borderColor:"grey", borderWidth:5, borderRadius:16, justifyContent:"center", alignItems:"center"}}>
                    <Ionicons name="videocam-outline" size={24} color="grey"/>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => {
                        openCamera();
                    }}
                    style={{ width:"15%",  height:"100%", borderColor:"grey", borderWidth:5, borderRadius:16, justifyContent:"center", alignItems:"center"}}>
                    <Ionicons name="camera-outline" size={24} color="grey"/>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => {
                        pickImage();
                    }}
                    style={{ width:"15%",  height:"100%", borderColor:"grey", borderWidth:5, borderRadius:16, justifyContent:"center", alignItems:"center"}}>
                    <Ionicons name="image-outline" size={24} color="grey"/>
                </TouchableOpacity>
            </HStack>
            <Box>
                <ScrollView horizontal={true} >
                    {media.map((item, index) => (
                        <View key={index} style={{ marginRight: 16 }}>
                            {item.mimeType?.startsWith('image') ? (
                            // {item.type === 'image' ? (
                            <>
                            <Image
                                source={{ uri: item.uri }}
                                style={{ width: 220, height: 220, borderRadius: 8 }}
                                />
                            <Box style={{ position: 'absolute', top: 0, right: 0, padding: 4, backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: 8 }}>
                                <TouchableOpacity onPress={() => {
                                    setMedia(media.filter((_, i) => i !== index));
                                }}>
                                    <Ionicons name="close-circle" size={24} color="white" />
                                </TouchableOpacity>
                            </Box>
                            </>
                            ) : (
                                // <Text>VIDEO</Text>
                            <Video
                                source={{ uri: item.uri }}
                                rate={1.0}
                                volume={1.0}
                                isMuted={true}
                                // resizeMode="cover"
                                shouldPlay={false}
                                style={{ width: 100, height: 100, borderRadius: 8 }}
                            />
                            )}
                            <Text style={{ fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                            {item.type}
                            </Text>
                        </View>
                        ))}
                </ScrollView>
            </Box>
        </Box>
    )
}

export default ImagePostSelector;