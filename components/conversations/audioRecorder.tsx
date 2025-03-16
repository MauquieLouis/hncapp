import React, {Alert, TouchableOpacity} from "react-native";
import { useEffect, useState } from "react";
import { useAudioRecorder, RecordingOptions, AudioModule, RecordingPresets } from 'expo-audio';
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/libs/initSupabase";
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

const AudioRecorder = (props: any) =>{

  // const [recording, setRecording] = useState<boolean>(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [ iconSize, setIconSize ] = useState(32);

  // const audioRecorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  // const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const record = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission..');
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };
  
  const stopRecording = async () => {
    console.log('Stopping recording..');
    setRecording(null);
    if (recording) {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync(
        {
          allowsRecordingIOS: false,
        }
      );
      const uri = recording.getURI();
      // Load the recording to get duration
      // const { sound, status } = await recording.createNewLoadedSoundAsync();
      // const test = sound
      if (uri) {
        const { sound } = await Audio.Sound.createAsync({uri});
        const status = await sound.getStatusAsync();
        if(status.isLoaded){
          console.log("DURATION :", status.durationMillis);
          const durationMillis = status.durationMillis || 0; // Get duration in milliseconds
          const durationSeconds = durationMillis / 1000; // Convert to seconds
          if (durationSeconds < 1.5) {
            console.warn('Recording too short, discarding...');
            return null; // Don't upload if less than 2 sec
          }
          //Send message here
          console.log('Recording stopped and stored at', uri);
          const audio_name = `${props.convId}/Audio/${uuidv4()}.m4a`;
          await uploadAudio(uri, audio_name);
          
        }
        //Add attachment
      } else {
        console.error('Recording URI is null');
        return;
      }

    }else{
      console.log("RECORDING NOT EXISTING... in stop recording function");
    }
    // setRecording(false);
  };

  const uploadAudio = async (uri: any, audioName: string) => {
    try{
      const response = await fetch(uri);
      console.log("RESPONSE :", response);
      const blob = await response.blob();
      console.log("RESPONSE :", blob);
      const fileName = audioName;
      console.log("RESPONSE :", fileName);


      const base64audio = await FileSystem.readAsStringAsync(uri, {encoding: FileSystem.EncodingType.Base64});
      const audioBuffer = Uint8Array.from(atob(base64audio), (c) => c.charCodeAt(0)).buffer;
      const { data, error } = await supabase.storage.from('Conversations').upload(fileName, audioBuffer, {contentType: 'audio/m4a',});
      console.log("DATA :",data);
      if (error){
        console.log("Error when uploading audio in uploadAudio function in audioRecorder.tsx", error);
      }

      const message_id = await props.sendMessageFunction(true, "audio");
      const { data: attach_data, error: attach_error } = await supabase.from('attachments').insert({
          message_id: message_id,
          url: audioName,
          type: 'audio/m4a',
          size: blob.size
      });
      if(attach_error){
        console.log("Error in stopRecording function when inserting new attachement in audioRecorder.tsx :", attach_error);

      }

    }catch(error: unknown){
      console.log("ERROR : error in uploadAudio function in audioRecorder.tsx", error);
    }
  }

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }
    })();
  }, []);

    return(
      <TouchableOpacity onPressIn={()=>{
        setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            console.log("ON PRESS IN !");
            setIconSize(64);
            record();
          }, 120);
        
        }}
        onPressOut={()=>{
          setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            setIconSize(32);
            console.log("ON PRESS OUT !");
            stopRecording();
          }, 120);
        }}
        style={{padding: 8, backgroundColor: 'white', borderRadius: 50, elevation: 5, position: 'absolute', bottom: 1, right: 0}}
      >
        <Ionicons name={'mic-outline'} color={'black'} size={iconSize} />
      </TouchableOpacity>
    );
}

export default AudioRecorder;
