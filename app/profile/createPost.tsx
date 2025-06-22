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
import { uploadManyFilesOnBucket, uploadOneFileOnBucket } from "@/components/files/fileUpload";
import { supabase } from "@/libs/initSupabase";
import { useUserContext } from "@/contexts/userContext";
import * as MediaLibrary from 'expo-media-library';


const CreatePost = () => {


    const [ text, setText ] = useState("");
    const [ vocal, setVocal ] = useState(null);
    const [ legend, setLegend ] = useState<null | "text" | "vocal">(null);
    const [ assets, setAssets ] = useState<ImagePicker.ImagePickerAsset[]>([]);


    const [status, requestPermission] = MediaLibrary.usePermissions();

    useEffect(() => {
    if (!status?.granted) {
        requestPermission();
    }
    }, []);

    const { poster_id, user_id } = useLocalSearchParams();
    const { profile } = useUserContext();

    useEffect(() => {
        console.log("Poster ID: ", poster_id);
        console.log("User ID: ", user_id);
        // Here you can add logic to handle the creation of a post
        // For example, you might want to fetch user data or initialize a form
    }, []);

    useEffect(() => {
        console.log("Legend changed: ", legend);
    },[legend]);

    
    const postPost = async () => {
        try{
            console.log("ASSETS :", assets);
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
                console.log("NO FILE TO UPLOAD");
                return;
            }
            //Now the file is/are uploaded, upload the post data (check if it's text or audio)
            if(filenames){
                console.log("fileNames :", filenames);
                //Create the post first (to get the id for post_attachments)
                const { data: post_data, error: error_data } = await supabase.from('posts').insert([
                    {
                        user_id: user_id,
                        caption: text,
                        visibility: 'public',
                        added_by: profile.user_id,
                        //file_url: TBD
                    }
                ]).select('*');

                if(error_data){
                    console.error("Error when inserting post in postPost function in profile/createPost.tsx", error_data);
                }
                else if(post_data){
                    console.log("POST DATA :", post_data);
                    //Create the post attachment.
                    let post_attachements: { post_id: any; type: any; url: any; size: any; filename: any; mimetype: any; }[] = [];
                    for(let filename of filenames) {
                        console.log("filename isolated :",filename);
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
                    else{
                        console.log("Data post attach data :", post_attach_data);
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

    // const uploadImage = async (files: ImagePicker.ImagePickerAsset[]) => {
    //         try{
    //             //Create the attachement and send Message
    //             // for(let file in files as ImagePicker.ImagePickerAsset[]){
    //             //     console.log("FILE :", files[file].fileName);
    //             // }
    //             // return;
    //             // setLoadingSend(true);
    //             const fileNames = [];
    //             for(let file of files as ImagePicker.ImagePickerAsset[]){
    //                 // const filename = uuidv6();
    //                 const ext = (file.fileName ?? '').split('.').pop();
    //                 const fileName = uuidv6()+"."+ext;
    //                 console.log("NEW FILENAME : ", fileName);
    //                 fileNames.push(fileName);
    //                 // console.log("FILE simple :", file);
    //                 if(file.type == 'video'){
    //                     const fileContent = await FileSystem.readAsStringAsync(file.uri, {encoding: FileSystem.EncodingType.Base64});
    //                     const {data, error} = await supabase.storage.from('Conversations')
    //                     .upload(convId+'/'+fileName, decode(fileContent),
    //                     {cacheControl: '3600', upsert:false, contentType:file.mimeType});
    //                     if(error){
    //                         console.log("Error in uploadImage function when uploading new image in [...convId].tsx :", error);
    //                     }
    //                     console.log("DATA UPLOAD:", data);
    //                 }else{
    //                     console.log("NOT A VIDEO :");
    //                     const fileResized = await compressImage(file.uri);
    //                     console.log("FILE RESIZED :", fileResized?.uri);
    //                     const fileContent = await FileSystem.readAsStringAsync(fileResized?.uri, {encoding: FileSystem.EncodingType.Base64});
    //                     const {data, error} = await supabase.storage.from('Conversations')
    //                     .upload(convId+'/'+fileName, decode(fileContent as string),
    //                     {cacheControl: '3600', upsert:false, contentType:file.mimeType});
    //                     if(error){ 
    //                         console.log("Error in uploadImage function when uploading new image in [...convId].tsx :", error);
    //                     }
    //                     console.log("DATA UPLOAD:", data);
    //                 }
    //                 //Upload the file on supabase
    //             }
    //             const message_id = await sendTextMessage(true, 'attachment');
    //             console.log("message iD :", message_id);
    //             let index = 0;
    //             for(let file of files as ImagePicker.ImagePickerAsset[]){
    //                 const fileName = fileNames[index];
    //                 index++;
    //                 console.log("FILE :", file.fileName);
    //                 const { data: attach_data, error: attach_error } = await supabase.from('attachments').insert({
    //                     message_id: message_id,
    //                     url: convId+'/'+fileName,
    //                     type: file.mimeType,
    //                     size: file.fileSize
    //                 });
    //                 if(attach_error){
    //                     console.log("Error in uploadImage function when inserting new attachement in [...convId].tsx :", attach_error);
    
    //                 }
    //             }
                
    //         }catch(error:unknown){
    //             console.log("Error in uploadImage function [...convId].tsx :", error);
    //         }finally{
    //             setLoadingSend(false);
    //         }
    //     }


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
                    console.log("CREATE POST ", legend); postPost();
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
                    <Box style={{justifyContent: 'center', alignItems: 'center'}}>
                        <TouchableOpacity style={{ borderColor:'rgba(127,127,127,0.6)', borderWidth:3, padding:22, borderRadius:70 }}
                                    onPress={() => setLegend("vocal")}>
                                        <Ionicons name="mic-outline" size={70} color="rgba(127,127,127,0.8)" />
                                    </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setLegend(null) }}>
                            <Ionicons name="close-circle" size={46} color={"black"}/>
                        </TouchableOpacity>
                    </Box>
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