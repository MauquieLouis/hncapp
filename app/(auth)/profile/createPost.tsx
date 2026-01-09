import React, { useEffect, useState } from "react";
import { Dimensions, KeyboardAvoidingView, StyleSheet, TouchableOpacity } from "react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import { Input, InputField } from "@/components/ui/input";
import ImagePostSelector from "@/components/profile/imagePostSelector";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { HStack } from "@/components/ui/hstack";
import * as ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values';
import { uploadAudio, uploadManyFilesOnBucket, uploadOneFileOnBucket } from "@/components/files/fileUpload";
import { supabase } from "@/libs/initSupabase";
import { useUserContext } from "@/contexts/userContext";
import * as MediaLibrary from 'expo-media-library';
import AudioRecorder from "@/components/conversations/audioRecorder";
import AudioAnimRecorder from "@/components/files/AudioAnimRecorder";
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import UniversarlAudioPlayer from "@/components/files/universalAudioPlayer";
import { generateBlurHashFromUri } from "@/components/files/imageEditor";
import Avatar from "@/components/profile/avatar";
import { usePostStore } from "@/contexts/store";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "expo-router";
import {
  Toast,
  ToastTitle,
  ToastDescription,
  useToast,
} from '@/components/ui/toast';

const CreatePost = () => {

    const [ text, setText ] = useState("");
    // const [ vocal, setVocal ] = useState(null);
    const [ legend, setLegend ] = useState<null | "text" | "vocal">(null);
    const [ assets, setAssets ] = useState<ImagePicker.ImagePickerAsset[]>([]);
    // const [ sendingAudio, setSendingAudio ] = useState(false);
    const [ audioUrl, setAudioUrl] = useState(null);
    const [ status, requestPermission ] = MediaLibrary.usePermissions();
    const [ sending, setSending ] = useState(false);

    const navigation = useNavigation();

    const { user_id } = useLocalSearchParams();
    const { profile, theme } = useUserContext();

    const { username, setNewFile } = usePostStore();
    const router = useRouter();
    const toast = useToast();
    
    useEffect(() => {
    if (!status?.granted) {
        requestPermission();
    }
    }, []);


    useEffect(() => {
        if(profile){
            navigation.setOptions({
                headerTitle:`Create a Post for`,
                //Create right part of the header 
                headerRight: () => {
                return(
                    <>
                        <Text style={{paddingRight:5, color:theme.textColor1}}>{username} </Text>
                        <Avatar user_id={user_id} width={36} height={36}/>
                    </>
                )
                }
            });
        }
    }, [profile]);

    const generateBlurhash = async (url: string, post_attachment_id: string, asset: any) => {
        try{
            const { data: signedUrlData, error: signedUrlError } = await supabase
                .storage
                .from('posts')
                .createSignedUrl(user_id+"/"+url, 3600);
            if(signedUrlError){
                console.error("Error when getting signedUrl in generateBlurhash function in createPost.tsx", signedUrlError);
            }

            console.log("INSIDE BLURHAHS")
            if(signedUrlData){
                console.log("ASSET before blur:", asset);
                const data = await generateBlurHashFromUri(signedUrlData?.signedUrl,asset.width, asset.height, 32,4,4);

                const { data: edited_attachment, error: error_attachment } = await supabase
                    .from('post_attachments')
                    .update({'blurhash' : data})
                    .eq('id',post_attachment_id).select();

                if(error_attachment){
                    console.error("Error when editing attachments", post_attachment_id," in generateBlurhash function in file /profile/createPost.tsx", error_attachment);
                }
                return data;
            }
        }catch(error: unknown){
            console.error("Error in generateBlurhash function in profile/post/createPost.tsx", error);
        }
    }

    const postPost = async () => {
        try{
            setSending(true);
            showToastPosting();
            let filenames;

            if (assets.length > 1) {
                // Many files
                filenames = await uploadManyFilesOnBucket(assets, 'posts', user_id);
            } else if (assets.length === 1) {
                // One file
                const singleFilename = await uploadOneFileOnBucket(assets[0], 'posts', user_id);
                filenames = [singleFilename]; // Wrap in array for consistency
            } else {
                // No file in the assets 
                console.info("NO FILE TO UPLOAD");
                return;
            }
            //Now the file is/are uploaded, upload the post data (check if it's text or audio)
            if(filenames){
                //Check for audio attachment if not set url to null
                let audio_name;
                if(audioUrl){
                    //Post the audio description here : 
                    audio_name = `${user_id}/Audio/${uuidv4()}.m4a`;
                    await uploadAudio(audioUrl, audio_name, 'posts');
                    //Create
                }else{
                    audio_name = null
                }
                // Create the post first (to get the id for post_attachments)
                const { data: post_data, error: error_data } = await supabase.from('posts').insert([
                    {
                        user_id: user_id,
                        caption: text,
                        visibility: 'public',
                        added_by: profile.user_id,
                        file_url: audio_name
                    }
                ]).select('*');

                if(error_data){
                    console.error("Error when inserting post in postPost function in profile/createPost.tsx", error_data);
                }
                else if(post_data){
                    // Create the post attachment.
                    let post_attachements: { post_id: any; type: any; url: any; size: any; filename: any; mimetype: any; }[] = [];
                    let position = 0;
                    for(let filename of filenames) {
                        position++;
                        post_attachements.push(
                            {
                                post_id: post_data[0].id,
                                type:filename.mimeType.split('/')[0], 
                                url:filename.newFileName,
                                size:filename.fileSize,
                                filename:filename.filename,
                                mime_type:filename.mimeType,
                                position:position
                            }
                        )
                    }
                    const {data: post_attach_data, error: post_attach_error } = await supabase.from('post_attachments')
                        .insert(post_attachements)
                        .select();
                    if(post_attach_error){
                        console.error("Error when inserting post_attachments in postPost function in profile/createPost.tsx", post_attach_error);
                    }else{
                        await generateBlurhash(post_attach_data[0].url, post_attach_data[0].id, assets[0]);
                    }
                }
                
            }else{
                console.warn("NO FILES PROVIDED IN POST...")
            }

        }catch(error: unknown) {
            console.error("Error in postPost function in profile/createPost.tsx: ", error);
        }finally{
            setSending(false);
            showToastSuccess();
            setNewFile(true);
            router.back();
        }
    }


    const showToastPosting = () => {
        const newId = Math.random().toString(36).substring(7);
        toast.show({
        id: newId,
        placement: "top",
        duration: 6000,
        render: ({id}) => {
            const uniqueToastId = 'toast-' + id;
            return(
            <Toast nativeID={uniqueToastId} action="muted" variant="solid">
                <ToastTitle>Posting</ToastTitle>
                <ToastDescription>
                    Posting ... ...
                </ToastDescription>
            </Toast>
            );
        }
        });
    }
    const showToastSuccess = () => {
        const newId = Math.random().toString(36).substring(7);
        toast.show({
        id: newId,
        placement: "top",
        duration: 6000,
        render: ({id}) => {
            const uniqueToastId = 'toast-' + id;
            return(
            <Toast nativeID={uniqueToastId} action="muted" variant="solid">
                <ToastTitle>Nice job *bitch*</ToastTitle>
                <ToastDescription>
                    Post successfully posted !
                </ToastDescription>
            </Toast>
            );
        }
        });
    }


    const height = Dimensions.get('window').height;
    const botH = height*0.28;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.backgroundColor1,
        },

        button: {
            fontSize: 20,
            textDecorationLine: 'underline',
            color: '#fff',
        },
        mainTitletext:{
            color:theme.textColor1,
            fontWeight:'600',
        },
        mainTitleZone:{
            // flex:1, 
            // height:"100%",
            paddingBottom:5, 
            justifyContent:"center", 
            alignItems:"center", 
            borderBottomWidth:1, 
            borderColor:"grey", 
            boxShadow:"0px 6px 12px rgba(0,0,0,0.1)"  
        },
        iconStyle:{
            // color:
        },
        descriptionActionBox:{
            position:"absolute",
            backgroundColor:theme.backgroundColor1,
            // flex:4, 
            bottom:0,
            left:0,
            height:botH, 
            width:"100%",
            padding:10, 
            borderTopWidth:1, 
            borderColor:"grey", 
            boxShadow:"0px 1px 8px rgba(0,0,0,0.7)"
        },
        descIconBoxStyle:{
            borderColor:theme.iconColor, 
            borderWidth:3, 
            padding:22, 
            borderRadius:10,
        },
        sendTopButton:{
            padding:7, 
            backgroundColor:"blue", 
            borderRadius:10, 
            boxShadow:"0px 1px 8px rgba(0,0,0,0.7)"
        },
        sendBottomButton:{
            padding:7, 
            backgroundColor:"blue", 
            borderRadius:10, 
            boxShadow:"0px 1px 8px rgba(0,0,0,0.7)",
            flexDirection:"row-reverse",
        },
        textSendButton:{
            justifyContent:"center",
            alignItems:"center",
            color:theme.iconColor,
            fontWeight:"300",
            fontSize:16,
        }
    });

    return (
        <Box style={styles.container}>
            <HStack style={styles.mainTitleZone}
            space="xl">
                <Text
                    style={styles.mainTitletext}
                    size="3xl">
                    Publish post
                </Text>
                {!sending ? 
                    <TouchableOpacity
                    style={styles.sendTopButton}
                    onPress={() => {
                        postPost();
                    }}>
                        <Ionicons name="send-outline" size={36} color={"white"}/>
                    </TouchableOpacity>
                :
                    <Spinner style={styles.sendTopButton}/>
                }

            </HStack>
            <ImagePostSelector setAssets={setAssets}/>
            <Box style={styles.descriptionActionBox}> 
                {/* TEXT INPUT ZONE */}
                {legend === "text" ? 
                <KeyboardAvoidingView>
                    <Textarea
                        size="md"
                        borderWidth={1}
                        borderColor="$borderLight"
                        borderRadius="$lg"
                        height="$20" // 👈 Ensures 5 lines are visible
                        p="$3"
                        >
                        <TextareaInput
                            placeholder="Type your message here..."
                            multiline
                            textAlignVertical="top" // 👈 Ensures text starts at top
                            style={{color:theme.textColor1, borderColor:theme.iconColor, borderWidth:2, fontSize:16}}
                            onChangeText={(text)=> setText(text)}
                            />
                    </Textarea>
                    <Box style={{justifyContent: 'center', alignItems: 'center'}}>
                        <TouchableOpacity onPress={() => { setLegend(null) }}>
                            <Ionicons name="close-circle" size={46} color={theme.iconColor}/>
                        </TouchableOpacity>
                        {text && text.trim() ? 
                            <>
                            {!sending ? 
                            <TouchableOpacity
                                style={styles.sendBottomButton}
                                onPress={() => {
                                    postPost();
                                }}>
                                    <HStack>
                                        <Center>
                                            <Text style={styles.textSendButton}>Publish the Post  </Text>
                                        </Center>
                                        <Ionicons name="send-outline" size={32} color={"white"}/>
                                    </HStack>
                            </TouchableOpacity>
                            :
                            <Spinner style={styles.sendTopButton}/>}
                            </>
                        :<></>}
                    </Box>
                </KeyboardAvoidingView>
                :
                <>
                    {legend === "vocal" ?
                    <>
                    <Box style={{justifyContent: 'flex-end', alignItems: 'flex-end', flexDirection:"row"}}>
                        {audioUrl ? 
                        <Box style={{paddingRight:35}}>
                            <UniversarlAudioPlayer url={audioUrl}/>
                        </Box>
                        : 
                        <></>   }
                        {/* <TouchableOpacity style={{ borderColor:'rgba(127,127,127,0.6)', borderWidth:3, padding:22, borderRadius:70 }}
                        onPress={() => setLegend("vocal")}>
                        <Ionicons name="mic-outline" size={70} color="rgba(127,127,127,0.8)" />
                        </TouchableOpacity> */}
                        { audioUrl ? 
                            <TouchableOpacity onPress={() => {
                                setAudioUrl(null);
                            }}>
                                <Ionicons name="trash-outline" size={46} color={theme.iconColor}/>
                            </TouchableOpacity>
                        :
                            <>
                            {/* Pour le param yDPZPos au lieu de -160 metre un pourcentage avec Dimension.screen width ect... */}
                            <AudioAnimRecorder DPZWidth={200} xDPZPos={0} DPZHeight={150} yDPZPos={-130} user_id={user_id} setAudioUrl={setAudioUrl}/>
                            {/* <AudioAnimRecorder DPZWidth={200}/> */}
                            </>
                        }
                    </Box>
                    <Box style={{justifyContent: 'flex-end', alignItems: 'flex-end', paddingTop:25 }}>
                        <TouchableOpacity onPress={() => { setLegend(null) }}>
                            <Ionicons name="close-circle" size={46} color={theme.iconColor}/>
                        </TouchableOpacity>
                    </Box>
                    {audioUrl ? 
                    <Center>
                        {!sending ?
                        <TouchableOpacity
                            style={styles.sendBottomButton}
                            onPress={() => {
                                postPost();
                            }}>
                                <HStack>
                                    <Center>
                                        <Text style={styles.textSendButton}>Publish the Post  </Text>
                                    </Center>
                                    <Ionicons name="send-outline" size={32} color={"white"}/>
                                </HStack>
                        </TouchableOpacity>
                        :
                        <Spinner style={styles.sendTopButton}/>
                        }

                    </Center>
                    :<></>}   
                    </> 
                    :
                    <Box style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                        <HStack space={"xl"}>
                            <Box>
                                <TouchableOpacity style={styles.descIconBoxStyle} 
                                onPress={() => setLegend("text")}>
                                    <Ionicons name="text-outline" size={70} color={theme.iconColor} />
                                </TouchableOpacity>
                            </Box>
                            <Box>
                                <TouchableOpacity style={styles.descIconBoxStyle}
                                onPress={() => setLegend("vocal")}>
                                    <Ionicons name="mic-outline" size={70} color={theme.iconColor} />
                                </TouchableOpacity>
                            </Box>
                        </HStack>
                    </Box>
                    }
                </>
                }
            </Box>
        </Box>
    )
}

export default CreatePost;