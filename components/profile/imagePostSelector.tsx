import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity } from "react-native";
import { Box } from "@/components/ui/box";


import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AudioRecorder from './audioRecorder';
import { ImageManipulator, useImageManipulator } from 'expo-image-manipulator';
import { Textarea, TextareaInput } from '../ui/textarea';
import { TextInput } from 'react-native';
import { v6 as uuidv6 } from 'uuid';
import 'react-native-get-random-values';

const ImagePostSelector = () => {

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            // allowsEditing: true,
            aspect: [4,3],
            quality:1,
            base64: true,
            allowsMultipleSelection: true,
            selectionLimit: 10,
        });
        if(!result.canceled){
            // setImages(result.assets[0].uri);
            // compressImage(result.assets[0].uri);
            uploadImage(result.assets);
        }
    }

    const uploadImage = async (files: ImagePicker.ImagePickerAsset[]) => {
            try{
                //Create the attachement and send Message
                // for(let file in files as ImagePicker.ImagePickerAsset[]){
                //     console.log("FILE :", files[file].fileName);
                // }
                // return;
                setLoadingSend(true);
                const fileNames = [];
                for(let file of files as ImagePicker.ImagePickerAsset[]){
                    // const filename = uuidv6();
                    const ext = (file.fileName ?? '').split('.').pop();
                    const fileName = uuidv6()+"."+ext;
                    console.log("NEW FILENAME : ", fileName);
                    fileNames.push(fileName);
                    // console.log("FILE simple :", file);
                    if(file.type == 'video'){
                        const fileContent = await FileSystem.readAsStringAsync(file.uri, {encoding: FileSystem.EncodingType.Base64});
                        const {data, error} = await supabase.storage.from('Conversations')
                        .upload(convId+'/'+fileName, decode(fileContent),
                        {cacheControl: '3600', upsert:false, contentType:file.mimeType});
                        if(error){
                            console.log("Error in uploadImage function when uploading new image in [...convId].tsx :", error);
                        }
                        console.log("DATA UPLOAD:", data);
                    }else{
                        console.log("NOT A VIDEO :");
                        const fileResized = await compressImage(file.uri);
                        console.log("FILE RESIZED :", fileResized?.uri);
                        const fileContent = await FileSystem.readAsStringAsync(fileResized?.uri, {encoding: FileSystem.EncodingType.Base64});
                        const {data, error} = await supabase.storage.from('Conversations')
                        .upload(convId+'/'+fileName, decode(fileContent as string),
                        {cacheControl: '3600', upsert:false, contentType:file.mimeType});
                        if(error){ 
                            console.log("Error in uploadImage function when uploading new image in [...convId].tsx :", error);
                        }
                        console.log("DATA UPLOAD:", data);
                    }
                    //Upload the file on supabase
                }
                const message_id = await sendTextMessage(true, 'attachment');
                console.log("message iD :", message_id);
                let index = 0;
                for(let file of files as ImagePicker.ImagePickerAsset[]){
                    const fileName = fileNames[index];
                    index++;
                    console.log("FILE :", file.fileName);
                    const { data: attach_data, error: attach_error } = await supabase.from('attachments').insert({
                        message_id: message_id,
                        url: convId+'/'+fileName,
                        type: file.mimeType,
                        size: file.fileSize
                    });
                    if(attach_error){
                        console.log("Error in uploadImage function when inserting new attachement in [...convId].tsx :", attach_error);
    
                    }
                }
                
            }catch(error:unknown){
                console.log("Error in uploadImage function [...convId].tsx :", error);
            }finally{
                setLoadingSend(false);
            }
        }

    return(
        <Box style={{ flex:6, borderColor:"blue", borderWidth:1, height:"100%", padding:"10%"}}>
            {/* IMAGE SELECTION ZONE */}
            <TouchableOpacity 
                onPress={() => {
                    console.log("Open image picker or camera here");
                }}
            style={{ width:"100%",  height:"100%", borderColor:"grey", borderWidth:5, borderRadius:16, justifyContent:"center", alignItems:"center"}}>
                <Ionicons name="camera-outline" size={86} color="grey"/>
            </TouchableOpacity>
        </Box>
    )
}

export default ImagePostSelector;