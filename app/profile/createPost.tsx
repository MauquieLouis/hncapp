import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { useLocalSearchParams } from 'expo-router';
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


const CreatePost = () => {

    const [ text, setText ] = useState("");
    const [ vocal, setVocal ] = useState(null);
    const [ legend, setLegend ] = useState<null | "text" | "vocal">(null);
    const [ assets, setAssets ] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [ sendingAudio, setSendingAudio ] = useState(false);
    const [ audioUrl, setAudioUrl] = useState(null);

    const [status, requestPermission] = MediaLibrary.usePermissions();

    useEffect(() => {
    if (!status?.granted) {
        requestPermission();
    }
    }, []);

    const { poster_id, user_id } = useLocalSearchParams();
    const { profile } = useUserContext();

    const postPost = async () => {
        try{
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
                //Create the post first (to get the id for post_attachments)
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
                    //Create the post attachment.
                    let post_attachements: { post_id: any; type: any; url: any; size: any; filename: any; mimetype: any; }[] = [];
                    for(let filename of filenames) {
                        post_attachements.push(
                            {
                                post_id: post_data[0].id,
                                type:filename.mimeType.split('/')[0], 
                                url:filename.newFileName,
                                size:filename.fileSize,
                                filename:filename.filename,
                                mime_type:filename.mimeType,
                            }
                        )
                    }
                    const {data: post_attach_data, error: post_attach_error } = await supabase.from('post_attachments').insert(post_attachements).select();
                    if(post_attach_error){
                        console.error("Error when inserting post_attachments in postPost function in profile/createPost.tsx", post_attach_error);
                    }
                }
                
            }else{
                console.warn("NO FILES PROVIDED IN POST...")
            }

        }catch(error: unknown) {
            console.error("Error in postPost function in profile/createPost.tsx: ", error);
        }finally{

        }
    }


    return (
        <Box style={{flex:1}}>
            <HStack style={{ flex:1, height:"100%", justifyContent:"center", alignItems:"center", borderBottomWidth:1, borderColor:"grey", boxShadow:"0px 6px 12px rgba(0,0,0,0.1)" }}
            space="xl">
                <Text
                    size="3xl"
                >
                    Create a Post
                </Text>
                <TouchableOpacity
                style={{ padding:7, backgroundColor:"blue", borderRadius:10, boxShadow:"0px 1px 8px rgba(0,0,0,0.7)" }}
                onPress={() => {
                    postPost();
                }}>
                    <Ionicons name="send-outline" size={36} color={"white"}/>
                </TouchableOpacity>
            </HStack>
            <ImagePostSelector setAssets={setAssets}/>
            <Box style={{flex:4, height:"100%", padding:10, borderTopWidth:1, borderColor:"grey", boxShadow:"0px 1px 8px rgba(0,0,0,0.7)"}}> 
                {/* TEXT INPUT ZONE */}
                {legend === "text" ? 
                <>
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
                            />
                    </Textarea>
                    <Box style={{justifyContent: 'center', alignItems: 'center'}}>
                        <TouchableOpacity onPress={() => { setLegend(null) }}>
                            <Ionicons name="close-circle" size={46} color={"black"}/>
                        </TouchableOpacity>
                    </Box>
                </>
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
                            <Ionicons name="trash-outline" size={46} color={'black'}/>
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
                            <Ionicons name="close-circle" size={46} color={"black"}/>
                        </TouchableOpacity>
                    </Box>
                    </> 
                    :
                    <Box style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                        <HStack space={"xl"}>
                            <Box>
                                <TouchableOpacity style={{ borderColor:'rgba(127,127,127,0.6)', borderWidth:3, padding:22, borderRadius:10 }} 
                                onPress={() => setLegend("text")}>
                                    <Ionicons name="text-outline" size={70} color="rgba(127,127,127,0.8)" />
                                </TouchableOpacity>
                            </Box>
                            <Box>
                                <TouchableOpacity style={{ borderColor:'rgba(127,127,127,0.6)', borderWidth:3, padding:22, borderRadius:10 }}
                                onPress={() => setLegend("vocal")}>
                                    <Ionicons name="mic-outline" size={70} color="rgba(127,127,127,0.8)" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },

  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
});


export default CreatePost;