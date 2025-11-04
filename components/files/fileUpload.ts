import { supabase } from "@/libs/initSupabase";
import * as ImagePicker from 'expo-image-picker';
import { v6 as uuidv6 } from 'uuid';
import 'react-native-get-random-values';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { compressImage, generateBlurHashFromUri } from "./imageEditor";


/**
 * 
 * @param file the result.asset to upload
 * @param bucket the bucket where the file is uploaded
 * @param folder the folder(s) in the bucket where the file is uploaded 
 * @param name OPTIONNAL : name of the file (not working now).
 * 
 * @return the file object with a newFileName field
 */
export async function uploadOneFileOnBucket(file: any, bucket: any, folder: any, name?: any) {

    try{
        const ext = (file.fileName ?? '').split('.').pop();
        const fileName = uuidv6()+"."+ext;
         if(file.type == 'video'){
                const fileContent = await FileSystem.readAsStringAsync(file.uri, {encoding: FileSystem.EncodingType.Base64});
                const {data, error} = await supabase.storage.from(bucket)
                .upload(folder+'/'+fileName, decode(fileContent),
                {cacheControl: '3600', upsert:false, contentType:file.mimeType});
                if(error){
                    console.error("Error in uploadImage function when uploading new video in components/files/fileUpload.ts :", error);
                }
            }else{
                const fileResized = await compressImage(file.uri);
                const fileContent = await FileSystem.readAsStringAsync(fileResized?.uri, {encoding: FileSystem.EncodingType.Base64});
                const {data, error} = await supabase.storage.from(bucket)
                .upload(folder+'/'+fileName, decode(fileContent as string),
                {cacheControl: '3600', upsert:false, contentType:file.mimeType});
                if(error){ 
                    console.error("Error in uploadImage function when uploading new image in components/files/fileUpload.ts :", error);
                }
            }
            file.newFileName = fileName;
            // const blurhash = await generateBlurHashFromUri(file.uri, 32, 4, 4);
            // console.log("BLURHASH ----> : ", blurhash);
        return file; //{fileName: fileName, originalFileName: file.fileName};
    }catch(error: unknown){
        console.error("Error in uploadOneFile in components/files/fileUpload.ts", error);
    }finally{

    }
}

/**
 * 
 * @param file the result.asset to upload
 * @param bucket the bucket where the file is uploaded
 * @param folder the folder(s) in the bucket where the file is uploaded 
 * @param name OPTIONNAL : name of the file (not working now).
 * @returns an array with the fileName of the uploaded files
 */
export async function uploadManyFilesOnBucket(files: any, bucket: any, folder: any, names?: any) {
    try{

        const fileNames = [];
        for(let file of files as ImagePicker.ImagePickerAsset[]){
            let name = await uploadOneFileOnBucket(file, bucket, folder);
            fileNames.push(name);
        }
        return fileNames;
    }catch(error: unknown){
        console.error("Error in uploadManyFilesOnBucket in  components/files/fileUpload.ts", error);
    }finally{

    }
}

export async function uploadAudio(uri: any, audioName: string, bucket: string){
    try{
      const response = await fetch(uri);
      const blob = await response.blob(); //Allows to get blob.size
      const fileName = audioName;

      const base64audio = await FileSystem.readAsStringAsync(uri, {encoding: FileSystem.EncodingType.Base64});
      const audioBuffer = Uint8Array.from(atob(base64audio), (c) => c.charCodeAt(0)).buffer;
      const { data, error } = await supabase.storage.from(bucket).upload(fileName, audioBuffer, {contentType: 'audio/m4a',});
      if (error){
        console.error("Error when uploading audio in uploadAudio function in components/files/fileUpload.ts", error);
      }
    }catch(error: unknown){
      console.error("ERROR : error in uploadAudio function in components/files/fileUpload.ts", error);
    }finally{

    }
  }