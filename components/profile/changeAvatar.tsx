import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { ImageManipulator, useImageManipulator } from 'expo-image-manipulator';
import { v6 as uuidv6 } from 'uuid';
import 'react-native-get-random-values';

import { compressImage } from '@/components/files/imageEditor';
import { supabase } from '@/libs/initSupabase';
import { decode } from 'base64-arraybuffer';


const ChangeAvatar = (props: any) => {

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
            uploadAvatar(result.assets[0]);
        }
    }

    //TODO !!
    const uploadAvatar = async (file: ImagePicker.ImagePickerAsset) => {
        try{
            const ext = (file.fileName ?? '').split('.').pop();
            const fileName = uuidv6()+"."+ext;
            const resizedfile = await compressImage(file.uri);
            const fileContent = await FileSystem.readAsStringAsync(resizedfile?.uri, {encoding: FileSystem.EncodingType.Base64});
            const { data, error } = await supabase.storage.from('avatars')
                .upload(props.userId+'/'+fileName, decode(fileContent as string), {cacheControl: '3600', upsert: false, contentType: file.mimeType});
            if(error){
                console.error("Error when uploading avatar in uploadAvatar function in components/profile/changeAvatar.tsx", error);
            }else{
                // Update the profile with the new avatar URL
                // const { data: publicURL } = supabase.storage.from('avatars').getPublicUrl(data.path);
                const { data: updt, error: updt_error } = await supabase.from('avatars').update({is_current: false})
                    .eq('user_id', props.userId); 
                if(updt_error){
                    console.error("Error updating all previous avatars in uploadAvatar function in components/profile/changeAvatar.tsx", updt_error);
                }
                const { data: avatar_data, error: avatar_error } = await supabase.from('avatars')
                    .insert({user_id: props.userId, image_url: props.userId+'/'+fileName, is_current: true, added_by: props.added_by});
                if(avatar_error){
                    console.error("Error inserting new avatar in uploadAvatar function in components/profile/changeAvatar.tsx", avatar_error);
                }

            }
            }catch(error: unknown){
            console.error("Error in uploadAvatar function in components/profile/changeAvatar.tsx", error);
        }finally{
        }
    }

    const ICON_SIZE = 32;

    return(
<       TouchableOpacity 
        onPress={() => {
            pickImage();
        }}
        style={{position:"absolute",
        bottom:2, 
        right:2, 
        borderColor:"white", 
        borderWidth:2, 
        borderRadius:15, 
        padding:5,
        backgroundColor:"rgba(0,0,0,0.5)"}}>
                <Ionicons name="camera-reverse-outline" size={ICON_SIZE} color="white" />
        </TouchableOpacity>
    );
}

export default ChangeAvatar;