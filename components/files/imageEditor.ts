import { ImageManipulator, useImageManipulator } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';


export async function compressImage(uri: string) {
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