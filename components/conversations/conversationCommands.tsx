import React, { TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Input, InputField } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/libs/initSupabase';
import { Ionicons } from '@expo/vector-icons';
import { HStack } from '@/components/ui/hstack';
import { Box } from '@/components/ui/box';

import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AudioRecorder from './audioRecorder';
import { ImageManipulator, useImageManipulator } from 'expo-image-manipulator';


const ConversationCommands = (props: any) => {

    const [ loadingSend, setLoadingSend ] = useState(false);
    const convId = props.convId;
    const text = props.text;
    const setText = props.setText;
    const sendTextMessage = props.sendTextMessage;
    const sendTypingEvent = props.sendTypingEvent;
    /** -----------------------------------------
     *  ==== ====  P I C K   I M A G E  ==== ====
     */
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            // allowsEditing: true,
            aspect: [4,3],
            quality:1,
            base64: true,
            allowsMultipleSelection: true,
        });
        if(!result.canceled){
            // setImages(result.assets[0].uri);
            resizeImage(result.assets[0].uri);
            uploadImage(result.assets);
        }
    }

    const compressImage = async(uri: string) => {
        const fileSize = await FileSystem.getInfoAsync(uri).then(info => info.size);
        const manipRes = await ImageManipulator.manipulate(uri).renderAsync();
        if(fileSize > 500*1024){
            return(manipRes.saveAsync({compress:0.5}));
        }else if (fileSize > 1000*1024){
            return(manipRes.saveAsync({compress:0.45}));
        }else if(fileSize > 1600*1024) {
            return(manipRes.saveAsync({compress:0.40}));
        }
    }

    const compressVideo = async(uri: string) => {
        /** TODO */
        /**
         * Find an open source library to compress video from local uri
         */
    }

    /** ---------------------------------------------
     *  ==== ====  U P L O A D   I M A G E  ==== ====
     * @param file 
     */
    const uploadImage = async (files: ImagePicker.ImagePickerAsset[]) => {
        try{
            //Create the attachement and send Message
            setLoadingSend(true);
            const message_id = await sendTextMessage(true, 'attachment');
            console.log("message iD :", message_id);
            for(let file of files as ImagePicker.ImagePickerAsset[]){
                // const filename = uuidv6();
                
                const { data: attach_data, error: attach_error } = await supabase.from('attachments').insert({
                    message_id: message_id,
                    url: convId+'/'+file.fileName,
                    type: file.mimeType,
                    size: file.fileSize
                });
                if(attach_error){
                    console.log("Error in uploadImage function when inserting new attachement in [...convId].tsx :", attach_error);

                }
                // console.log("FILE simple :", file);
                if(file.type == 'video'){
                    const fileContent = await FileSystem.readAsStringAsync(file.uri, {encoding: FileSystem.EncodingType.Base64});
                    const {data, error} = await supabase.storage.from('Conversations')
                    .upload(convId+'/'+file.fileName, decode(fileContent),
                    {cacheControl: '3600', upsert:false, contentType:file.mimeType});
                    if(error){
                        console.log("Error in uploadImage function when uploading new image in [...convId].tsx :", error);
                    }
                    console.log("DATA UPLOAD:", data);
                }else{
                    console.log("NOT A VIDEO :");
                    const fileResized = await resizeImage(file.uri);
                    const fileContent = await FileSystem.readAsStringAsync(fileResized.uri, {encoding: FileSystem.EncodingType.Base64});
                    const {data, error} = await supabase.storage.from('Conversations')
                    .upload(convId+'/'+file.fileName, decode(fileContent as string),
                    {cacheControl: '3600', upsert:false, contentType:file.mimeType});
                    if(error){ 
                        console.log("Error in uploadImage function when uploading new image in [...convId].tsx :", error);
                    }
                }
                //Upload the file on supabase
            }
        }catch(error:unknown){
            console.log("Error in uploadImage function [...convId].tsx :", error);
        }finally{
            setLoadingSend(false);
        }
    }

    const styles = StyleSheet.create({
        mainHStack:{
            // paddingTop:15, 
            backgroundColor:'rgba(0,0,0,0)', 
            position:'absolute', 
            bottom:0, 
            left:0, 
            width:"100%",
            height:54,
        },
        writingZoneBox:{
            justifyContent:'center', 
            alignItems:'center', 
            paddingLeft:4, 
            paddingRight:4,
            width:'59%',
        },
        writingInput:{
            backgroundColor:"rgba(255,255,255,1)", 
            borderRadius:15,
            borderColor:"rgba(50,50,50,0.7)",
            height:42,
        },
        itemBox:{
            width:'13%',
            // borderColor:"green",
            // borderWidth:1
        },
        itemIcon: {
            padding: 8, 
            backgroundColor: 'white', 
            borderRadius: 50, 
            elevation: 5, 
            position: 'absolute', 
            bottom: 1, 
            right: 0
        },
        Audio: {
            zIndex:10
        }
    })

    return(
        <HStack style={styles.mainHStack}>
            
            {/** ============== TEXT WRITING ZONE =============== */}
            <Box style={styles.writingZoneBox}>
                <Input variant="outline" size="md" style={styles.writingInput}>
                    <InputField 
                        placeholder="Write message here..." 
                        onChangeText={(text) => {setText(text); sendTypingEvent()}} 
                        value={text}
                        style={{color:"black"}}
                        />
                </Input>
            </Box>

            {/** ============== IMAGE =============== */}
            <Box style={styles.itemBox}>
                {loadingSend ? 
                <Spinner size="large" color={"blue"}/>: 
                <TouchableOpacity 
                style={styles.itemIcon}
                onPress={() => {
                    pickImage();
                }}>
                    <Ionicons name={'image-outline'} color={'black'} size={32} />
                </TouchableOpacity>
                }
            </Box>

            {/** ============== AUDIO RECORD =============== */}
            <Box style={[styles.itemBox, styles.Audio]}>
                {loadingSend ? 
                <Spinner size="large" color={"blue"}/>: 
                <AudioRecorder sendMessageFunction={sendTextMessage} convId={convId} styleIcon={styles.itemIcon}/>
            }
            </Box>

            {/** ============== SEND TEXT MESSAGE =============== */}
            <Box style={styles.itemBox}>
                {loadingSend ? 
                <Spinner size="large" color={"blue"}/>: 
                <TouchableOpacity 
                    style={styles.itemIcon}
                    onPress={() => {
                        sendTextMessage(false, 'text');
                    }}>
                    <Ionicons name={'send-outline'} color={'black'} size={32} />
                </TouchableOpacity>
                }
            </Box>
        </HStack>
    );
}

export default ConversationCommands;
