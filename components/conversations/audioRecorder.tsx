import React, {Alert, TouchableOpacity, PanResponder, StyleSheet, Dimensions } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioModule } from 'expo-audio';
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/libs/initSupabase";
import * as FileSystem from 'expo-file-system';
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Box } from "@/components/ui/box";
import RecordEffect from "./recordEffect";
import { Spinner } from "../ui/spinner";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";

const DROP_ZONE = { width: 207, height: 130 };

const AudioRecorder = (props: any) =>{

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState<Boolean>(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [ iconSize, setIconSize ] = useState(props.iconSize);
  const [ showDeletionZone, setShowDeleteZone ] = useState(false);
  const [ isGestureEnabled, setIsGestureEnabled ] = useState(true);
  const [ initialWidth, setInitialWidth ] = useState(50);
  const [ itemWidth, setItemWidth ] = useState(50);
  const [ saveInitialWidth, setSaveInitalWidth] = useState(true);
  const [ position, setPosition ] = useState({x:0, y:0});
  const [ sendingAudio, setSendingAudio] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const viewRef = useRef<Animated.View>(null);
  const toast = useToast();
  

  const measurePosition = () => {
    if(viewRef.current){
      viewRef.current.measure((x: any, y: any, width: any, height: any, pageX: any, pageY: any) => {
        console.log("Position", x,y,width,height,pageX,pageY);
        setPosition({ x: pageX, y: pageY });
      });
    }
  }
  useEffect(() => {
    console.log("RECORDING DETECTED ", recording);
  }, [recording]);

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
      recordingRef.current = recording;
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };
  
  const stopRecording = async (isValid: boolean) => {
    console.log('Stopping recording..');
    if (recordingRef.current) {
      await recordingRef.current.stopAndUnloadAsync();
      if(!isValid) return;
      console.log("SOUND SAVING !")
      await Audio.setAudioModeAsync(
        {
          allowsRecordingIOS: false,
        }
      );
      const uri = recordingRef.current.getURI();
      // Load the recording to get duration
      if (uri) {
        const { sound } = await Audio.Sound.createAsync({uri});
        const status = await sound.getStatusAsync();
        if(status.isLoaded){
          console.log("DURATION :", status.durationMillis);
          const durationMillis = status.durationMillis || 0; // Get duration in milliseconds
          const durationSeconds = durationMillis / 1000; // Convert to seconds
          if (durationSeconds < 1.5) {
            console.warn('Recording too short, discarding...');
            toast.show({
              duration: 1200,
              placement: "bottom",
              render: ({ id }) => {
                const toastId = "toast-" + id
                return (
                  <Toast
                    nativeID={toastId}
                    className="px-3 py-3 gap-10 shadow-soft-1 items-center flex-row mb-10"
                  >
                    <ToastTitle size="lg">Audio message is too short.</ToastTitle>
                  </Toast>
                )
              },
            });
            return null; // Don't upload if less than 2 sec
          }
          //Send message here
          console.log('Recording stopped and stored at', uri);
          const audio_name = `${props.convId}/Audio/${uuidv4()}.m4a`;
          await uploadAudio(uri, audio_name);
        }
        setRecording(null);

        //Add attachment
      } else {
        console.error('Recording URI is null');
        return;
      }
    }else{
      console.log("RECORDING NOT EXISTING... in stop recording function", recording);
    }
  };

  const uploadAudio = async (uri: any, audioName: string) => {
    try{
      setSendingAudio(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = audioName;

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
    }finally{
      setSendingAudio(false);
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

  /** =========================================================
   *  =            G E S T U R E   G E S T I O N              =
      =========================================================*/

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const width_screen = Dimensions.get('window').width; // -D-
  const width_mic_container = itemWidth; // -A-
  const width_mic_icon = itemWidth       // -B-
  const width_drop_zone = DROP_ZONE.width+16    // -C-
  let max_dx_mvt;                 // ? -E-
  
  const height_mic_container = itemWidth;  // -X-
  const height_mic_icon = itemWidth;       // -Y-
  const height_drop_zone = DROP_ZONE.height;     // -Z-
  let max_dy_mvt_pos, max_dy_mvt_neg;  // ? W+ et W-

  const isInDropZone = useCallback((x: number,y: number) => {
    'worklet';
    max_dx_mvt = width_screen-width_drop_zone-(width_mic_container-width_mic_icon);
    max_dy_mvt_neg = height_drop_zone-height_mic_container;
    max_dy_mvt_pos = height_mic_container-height_mic_icon;
    if(x < -max_dx_mvt && y > -max_dy_mvt_neg && y < max_dy_mvt_pos ){
      console.log("drpZ :");
      return true;
    }
    return false;
  }, []);

  /** ==============================================
   *                START FUNCTIONS
  ============================================== */ 
  const onStartFunction = () => {
    setIsGestureEnabled(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    console.log("START");
    changeItemWidth(initialWidth*2);
    setShowDeleteZone(true);
    setIconSize(initialWidth*1.6);
    setIsRecording(true);
    record();
  }
  
  /** ==============================================
  *                 END FUNCTIONS 
  ============================================== */
  const commonEndFunction = () => {
    setIsGestureEnabled(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    setShowDeleteZone(false);
    setTimeout(() => {setIsGestureEnabled(true)}, 250)
    setIsRecording(false);
    setIconSize(32);
    changeItemWidth(initialWidth);
  }

  const onEndFunction = () => {
    setTimeout(() => {
      stopRecording(true);
      commonEndFunction();
    }, 100);
    //Save vocal message here
    // console.log("Save vocal message");
  }
  
  const onEndDeletionFunction = () => {
    setTimeout(() => {
      stopRecording(false);
      commonEndFunction();
    }, 75);
    //Do not save the vocal message.
    // console.log("/!\\ Do NOT save vocal message /!\\")
  }

  const changeItemWidth = (w: number) => {
    setItemWidth(w);
  }

  const panGesture = Gesture.Pan()
  .enabled(isGestureEnabled)
  .onTouchesUp(() => {
    console.log("UP");
    runOnJS(onEndFunction)();
  })
  .onTouchesDown(() => {
    console.log("DOWN");
    runOnJS(onStartFunction)();
  })
  .onUpdate((event) => {
    translateX.value = event.translationX;
    translateY.value = event.translationY;
    if(isInDropZone(translateX.value, translateY.value)){
      console.log("IN DROP ZONE");
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      runOnJS(onEndDeletionFunction)();
      //End function + Vocal Deletion //Maybe create a different function
    }
  })
  .onEnd((event) => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value},
      { translateY: translateY.value},
    ],
  }));

  const styles = StyleSheet.create({
  container:{
  },
  dropZone: {
    position: "absolute",
    bottom: 0,
    left: -position.x,
    width: DROP_ZONE.width,
    height: DROP_ZONE.height,
    borderColor:"rgba(239, 62, 62, 0.49)",
    borderWidth:10,
    borderRadius: 20,
    justifyContent:"center",
    alignItems:'center',
  },
  draggable: {
    padding: 8, 
    backgroundColor: 'white', 
    borderRadius: itemWidth/2, 
    elevation: 5, 
    // position: 'absolute', 
    // bottom: 1, 
    // right: 0,
    width:itemWidth,
    height:itemWidth,
    left:1.5,
    // bottom:1,
    zIndex:15,
    justifyContent:"center",
    alignItems:"center",
    // borderColor:"red", borderWidth:1
  },
});

  return(
    <>
      {showDeletionZone ? 
        <Box style={styles.dropZone}>
          <Ionicons name={'trash-outline'} color={'rgba(127,0,0,0.25)'} size={iconSize} />
        </Box>
        :
        <></>  
      }
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[
          styles.draggable,
          animatedStyle
        ]} onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          if(saveInitialWidth == true){
            measurePosition();
            setInitialWidth(width);
            setSaveInitalWidth(false);
          }
          setItemWidth(width);
        }}
        ref={viewRef}>
          {sendingAudio ? 
          <Spinner size="large" color={"blue"}/>
          :
          <>
            <Ionicons name={'mic-outline'} color={'black'} size={iconSize} />
            {isRecording ?
              <RecordEffect width={itemWidth}/>
              :
              <></>
            }
          </>
          }
        </Animated.View>
      </GestureDetector>
    </>
  );
}

export default AudioRecorder;
