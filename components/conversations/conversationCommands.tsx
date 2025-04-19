import React, { TouchableOpacity, StyleSheet, Keyboard, Animated, Dimensions } from 'react-native';
import { useEffect, useRef, useState } from 'react';
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
import { Textarea, TextareaInput } from '../ui/textarea';
import { TextInput } from 'react-native';
import { v6 as uuidv6 } from 'uuid';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const ConversationCommands = (props: any) => {

    const [ loadingSend, setLoadingSend ] = useState(false);
    const [ inputHeight, setInputHeight ] = useState(40);
    const [ inputWidth, setInputWidth ] = useState('59%');
    const [ iconSize, setIconSize ] = useState(32);
    const [ isTextFocused, setIsTextFocused ] = useState(false);
    
    const inputRef = useRef(null);

    const maxHeight = 100;
    const convId = props.convId;
    const text = props.text;
    const setText = props.setText;
    const sendTextMessage = props.sendTextMessage;
    const sendTypingEvent = props.sendTypingEvent;


    useEffect(() => {
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setIsTextFocused(false);
            setInputWidth("59%");
        });
        const keyboardOpenListener = Keyboard.addListener('keyboardDidShow', () => {
            setIsTextFocused(true);
            setInputWidth("85%");
        })
        
        return() => {
            keyboardDidHideListener.remove();
        }
    }, []);

    const { width: screenWidth } = Dimensions.get("window");
    const animatedWidth = useRef(new Animated.Value(screenWidth * 0.59)).current; // Initial width
    useEffect(() => {
        Animated.timing(animatedWidth, {
            toValue: isTextFocused? screenWidth*0.78 : screenWidth*0.59,
            duration: 300,
            useNativeDriver:false
        }).start();
    }, [isTextFocused])

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
            selectionLimit: 10,
        });
        if(!result.canceled){
            // setImages(result.assets[0].uri);
            // compressImage(result.assets[0].uri);
            uploadImage(result.assets);
        }
    }

    const compressImage = async(uri: string) => {
        console.log("COMPRESS URI :", uri);
        const fileSize = await FileSystem.getInfoAsync(uri).then(info => info.size);
        console.log("FileSize :", fileSize);
        const manipRes = await ImageManipulator.manipulate(uri).renderAsync();
        console.log("MANIP RES :", manipRes.uri);
        if(fileSize > 500*1024){
            return(manipRes.saveAsync({compress:0.5}));
        }else if (fileSize > 1000*1024){
            return(manipRes.saveAsync({compress:0.45}));
        }else if(fileSize > 1600*1024) {
            return(manipRes.saveAsync({compress:0.40}));
        }else{
            return(manipRes.saveAsync({compress:0.8}));
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

    const styles = StyleSheet.create({
        mainHStack:{
            backgroundColor:'rgba(0,0,0,0)', 
            position:'absolute', 
            bottom:0, 
            left:0, 
            width:"100%",
            height: 'auto', // Allow it to grow dynamically
            flexDirection: 'row',
            alignItems: 'flex-end', // Make sure everything aligns at the bottom
            padding: 3,
            // borderColor:"red", borderWidth:1
        },
        writingZoneBox:{
            justifyContent:'center', 
            alignItems:'center', 
            paddingLeft:2, 
            paddingRight:2,
            height:'100%',
            flexDirection: "column-reverse",
            // borderColor:"red", borderWidth:1
        },
        writingInput:{
            backgroundColor:"rgba(255,255,255,1)", 
            borderRadius:15,
            borderColor:"rgba(150,150,150,0.7)",
            borderWidth:2,
            height: Math.max(40, inputHeight),
            textAlignVertical: 'top',
        },
        itemBox:{
            width:'13%',
            minHeight:50,
            // borderColor:"green",
            // borderWidth:1
        },
        itemBoxArrow:{
            width:'7%',
            minHeight:50,
            justifyContent:"center",
            alignItems:"center",
        },
        itemIcon: {
            padding: 8, 
            backgroundColor: 'white', 
            borderRadius: 50, 
            elevation: 5, 
            position: 'absolute', 
            bottom: 1, 
            right: 0,
        },
        itemIconArrow: {
            padding: 3, 
            backgroundColor: 'white', 
            borderRadius: 50, 
            elevation: 5, 
            // justifyContent:"center",
            // alignItems:"center",
        },
        Audio: {
            zIndex:10
        }
    })

    const handleContentSizeChange = (event: any) => {
        const contentHeight = event.nativeEvent.contentSize.height;
        if (contentHeight <= maxHeight) {
            setInputHeight(contentHeight);
        } else {
            setInputHeight(maxHeight);
        }
      };

    return(
        <HStack style={styles.mainHStack}>
            
            {/** ============== TEXT WRITING ZONE =============== */}
            <Animated.View style={[styles.writingZoneBox, {width: animatedWidth}]}>
                <Input variant="outline" size="md" style={styles.writingInput}>
                    <InputField 
                        ref={inputRef}
                        onFocus={() => setIsTextFocused(true)}
                        onBlur={() => setIsTextFocused(false)}
                        scrollEnabled={inputHeight >= maxHeight}
                        placeholder="Write message here..." 
                        onChangeText={(text) => {setText(text); sendTypingEvent()}} 
                        value={text}
                        multiline={true}
                        onContentSizeChange={handleContentSizeChange}
                        style={{color:"black"}}
                        />
                </Input>
                {/* <Textarea>
                    <TextareaInput placeholder='Write message here...'/>
                </Textarea> */}
            </Animated.View>

            {/** ============== IMAGE =============== */}
            {isTextFocused ? 
                <Box style={styles.itemBoxArrow}>
                    <TouchableOpacity
                        style={styles.itemIconArrow}
                        onPress={() => {
                            // pickImage();
                            console.log("ACTION MENU DEPLOY !");
                            setIsTextFocused(false);
                            inputRef.current?.blur();
                        }}
                    >
                        <Ionicons name={'chevron-back-outline'} color={'black'} size={16}/>
                    </TouchableOpacity>
                </Box>
                // <></>
            : 
                <><Box style={styles.itemBox}>
                    {loadingSend ? 
                    <Spinner size="large" color={"blue"}/>: 
                    <TouchableOpacity 
                    style={styles.itemIcon}
                    onPress={() => {
                        pickImage();
                    }}>
                        <Ionicons name={'image-outline'} color={'black'} size={iconSize} />
                    </TouchableOpacity>
                    }
                </Box>

                {/** ============== AUDIO RECORD =============== */}
                <Box style={[styles.itemBox, styles.Audio]}>
                    {loadingSend ? 
                    <Spinner size="large" color={"blue"}/>: 
                    <AudioRecorder sendMessageFunction={sendTextMessage} convId={convId} styleIcon={styles.itemIcon} iconSize={iconSize}/>
                }
                </Box></>
            }

            {/** ============== SEND TEXT MESSAGE =============== */}
            <Box style={styles.itemBox}>
                {loadingSend ? 
                <Spinner size="large" color={"blue"}/>: 
                <TouchableOpacity 
                    style={styles.itemIcon}
                    onPress={() => {
                        sendTextMessage(false, 'text');
                    }}>
                    <Ionicons name={'send-outline'} color={'black'} size={iconSize} />
                </TouchableOpacity>
                }
            </Box>
        </HStack>
    );
}

export default ConversationCommands;
