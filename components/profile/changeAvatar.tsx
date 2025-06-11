import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { ImageManipulator, useImageManipulator } from 'expo-image-manipulator';


const ChangeAvatar = () => {

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

    //TODO !!
    //const uploadAvatar 

    const ICON_SIZE = 32;

    return(
<       TouchableOpacity 
        onPress={() => {
        console.log("EDIT PROFILE PICTURE");
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