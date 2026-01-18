import React, { View, StyleSheet, Button, TouchableOpacity, Text, Dimensions, Alert } from 'react-native';
import AudioWaves from '@/components/conversations/audioWaves';
import { Box } from '@/components/ui/box';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect, useCallback } from 'react';
// import Animated, { cancelAnimation, Easing, useAnimatedProps, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Svg, Rect, Circle, LinearGradient, Stop, Defs, Filter, G, FeGaussianBlur } from 'react-native-svg';
import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import MosaicList from '@/components/profile/topTab/mosaicList';
import Tab2 from '@/components/profile/topTab/tab2';
// import { Audio } from 'expo-av';
import { 
  useAudioPlayer,
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
  useAudioPlayerStatus
 } from 'expo-audio';

// const DRAGGABLE_SIZE = 60;
// const DROP_ZONE = { x: 100, y:400, width: 150, height: 150 };
const URL = "https://gfdgytrnltsbyforfdef.supabase.co/storage/v1/object/sign/Conversations/b88f3f22-9688-4128-bef9-3e06f434237e/Audio/01753f85-8853-407f-8716-8d49fdabc550.m4a?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mNGQ3NjFhOS1mYmViLTRjODMtOGU5ZS02ZWQxMmE5ZTA4NWQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJDb252ZXJzYXRpb25zL2I4OGYzZjIyLTk2ODgtNDEyOC1iZWY5LTNlMDZmNDM0MjM3ZS9BdWRpby8wMTc1M2Y4NS04ODUzLTQwN2YtODcxNi04ZDQ5ZmRhYmM1NTAubTRhIiwiaWF0IjoxNzY4NzU1NDg3LCJleHAiOjE3NjkzNjAyODd9.fN5JyG-NlC2rrO2gTJPEB9ufG_YjxUgWU5saDa0BF1A"
export default function AboutScreen() {

  //Player
  const player = useAudioPlayer(URL);
  const status = useAudioPlayerStatus(player)
  
  //Recorder
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const record = async () => {
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  }

  const stopRecording = async () => {
    await audioRecorder.stop();
  }

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if(!status.granted) {
        Alert.alert('Permission to acces microphone was denied');
      }
      setAudioModeAsync({
        playsInSilentMode:true,
        allowsRecording: true,
      });
    })();
  }, [])
  
  const loadAudio = async() => {

  }



  return(
    <View style={{flex:1}}>
      <View style={{width:"80%", marginLeft:"10%", marginTop:25}}>
        <Button title="Play Sound" onPress={() => player.play()}/>
          <View>
            <Text>Playing: {status.playing ? 'Yes' : 'No'}</Text>
            <Text>Current Time: {status.currentTime}s</Text>
            <Text>Duration: {status.duration}s</Text>
          </View>
      </View>
      <View style={{width:"80%", marginLeft:"10%", marginTop:25}}>
        <Button title={recorderState.isRecording ? 'Stop Recording' : 'Start Recording'} onPress={recorderState.isRecording ? stopRecording : record}/>
        <View>
          <Text>Recording: {recorderState.isRecording ? 'Yes' : 'No'}</Text>
          <Text>Duration: {Math.round(recorderState.durationMillis / 1000)}s</Text>
          <Text>Can Record: {recorderState.canRecord ? 'Yes' : 'No'}</Text>
        </View>
      </View>
    </View>
  );
  
  // const [isAnimating, setIsAnimating] = useState(false);
  // const [iconSize, setIconSize] = useState(32);
  // const [iconCenter, setIconCenter] = useState({ x: 0, y: 0 });
  // const [isEnabled, setIsEnabled] = useState(true);
  // const [ showZone, setShowZone ] = useState(false);
  // // const [ gestureEnabled, setGestureEnabled ] = useState(true);

  //   const toggleAnimation = () => {
  //     setIsAnimating(!isAnimating);
  //   };

  //   /*const pan = useRef(new Animated.ValueXY()).current;
  //   const dropZoneValues = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  //   const originalPosition = useRef({ x: 0, y: 0 });

  //   useEffect(() => {
  //     // Set the original position when the component mounts
  //     pan.setValue(originalPosition.current);
  //   }, [pan]);

  //   const panResponder = useRef(
  //     PanResponder.create({

  //       onStartShouldSetPanResponder: () => {
  //         console.log("ONPRESS IN");
  //         setIconSize(48);
  //         Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  //         setIsReleased(false);
  //         return true},

  //       onPanResponderGrant: () => {
  //         // console.log('onPanResponderGrant');
  //       },

  //       onPanResponderMove: (e, gesture) => {
  //           // console.log("MOVE.",gesture);
  //           if(!gestureEnabled) return;
  //         if(isDropZone(gesture) && !isReleased){
  //           setIsReleased(true);
  //           console.log("Dropped into the special zone !");
  //           // pan.removeAllListeners();
  //           // panResponder.panHandlers.
  //           forceRelease(e);
  //         }
  //         return Animated.event([null, { dx: pan.x, dy:pan.y}], {
  //           useNativeDriver: false,
  //         })(e, gesture)
  //       },

  //       onPanResponderRelease: (e, gesture) => {
  //         setIconSize(32);
  //         console.log("ON RELEASE !");
  //         if(isDropZone(gesture)) {
  //           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  //           console.log("Dropped into the special zone !");
  //         }
  //         // Animate back to the original position
  //         Animated.spring(pan, {
  //           toValue: originalPosition.current,
  //           useNativeDriver: false,
  //         }).start();
  //         setGestureEnabled(true);
  //       },
  //     })
  //   ).current;

  //   const width_screen = Dimensions.get('window').width; // -D-
  //   const width_mic_container = 70; // -A-
  //   const width_mic_icon = 60       // -B-
  //   const width_drop_zone = 170     // -C-
  //   let max_dx_mvt;                 // ? -E-
    
  //   const height_mic_container = 70;  // -X-
  //   const height_mic_icon = 60;       // -Y-
  //   const height_drop_zone = 130;     // -Z-
  //   let max_dy_mvt_pos, max_dy_mvt_neg;  // ? W+ et W-

  //   const isDropZone = (gesture: React.PanResponderGestureState) => {
  //     max_dx_mvt = width_screen-width_drop_zone-(width_mic_container-width_mic_icon);
  //     max_dy_mvt_neg = height_drop_zone-height_mic_container;
  //     max_dy_mvt_pos = height_mic_container-height_mic_icon;
  //     const { dx, dy } = gesture;

  //                                                                       // +50 car il y a la bottom tab bar en bas.
  //     if(dx < -max_dx_mvt && dy > -max_dy_mvt_neg && dy < max_dy_mvt_pos + 50 ){
  //       console.log(" ------- === INSIDE DROP ZONE === ------- !!!");
  //       // forceRelease();
  //       return true;
  //     }
  //     return false;
  //   };

  //   const forceRelease = (e: React.GestureResponderEvent) => {
  //     setGestureEnabled(false);

  //     console.log("Force Release");
  //     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  //     // forceRelease();
  //     pan.stopAnimation();
  //     panResponder.panHandlers.onResponderTerminate?.(e);
  //     pan.setValue(originalPosition.current);
  //     // pan.removeAllListeners();
  //     Animated.spring(pan, {
  //       toValue: originalPosition.current,
  //       useNativeDriver: false,
  //     }).start();
  //     // panResponder.panHandlers.onResponderEnd?.(e);
  //     setTimeout(() => setGestureEnabled(true), 500);
  //     // panResponder.panHandlers.term
  //     // return 
      
  //   }

  //   const handleIconLayout = (event) => {
  //     const layout = event.nativeEvent.layout;
  //     const centerX = layout.x + layout.width / 2;
  //     const centerY = layout.y + layout.height / 2;
  //     setIconCenter({ x: centerX, y: centerY });
  //     // console.log("LAYOUT INCON :", layout);
  //     // console.log('Icon Center:', { x: centerX, y: centerY });
  //   };*/

  //   const startX = useSharedValue(150);
  //   const startY = useSharedValue(150);
  //   const translateX = useSharedValue(0);
  //   const translateY = useSharedValue(0);

  //   const enableGesture = useSharedValue(true);

  //   const width_screen = Dimensions.get('window').width; // -D-
  //   const width_mic_container = 70; // -A-
  //   const width_mic_icon = 60       // -B-
  //   const width_drop_zone = 170     // -C-
  //   let max_dx_mvt;                 // ? -E-
    
  //   const height_mic_container = 70;  // -X-
  //   const height_mic_icon = 60;       // -Y-
  //   const height_drop_zone = 130;     // -Z-
  //   let max_dy_mvt_pos, max_dy_mvt_neg;  // ? W+ et W-

  //     const isInDropZone = useCallback((x: number,y: number) => {
  //       'worklet';
  //       // console.log("drpZ :", DROP_ZONE);
  //       max_dx_mvt = width_screen-width_drop_zone-(width_mic_container-width_mic_icon);
  //       max_dy_mvt_neg = height_drop_zone-height_mic_container;
  //       max_dy_mvt_pos = height_mic_container-height_mic_icon;
  //       // +50 car il y a la bottom tab bar en bas.
  //       if(x < -max_dx_mvt && y > -max_dy_mvt_neg && y < max_dy_mvt_pos + 50 ){
  //         console.log("drpZ :");
  //         // console.log(" ------- === INSIDE DROP ZONE === ------- !!!");
  //         return true;
  //       }
  //       return false;
  //     }, []);
      
  //     const onStartFunction = () => {
  //       setIsEnabled(true);
  //       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  //       console.log("START");
  //       setShowZone(true);
        
  //       //Afficher la DROP ZONE
  //     }
      
  //     const onEndFunction = () => {
  //       setIsEnabled(false);
  //       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  //       setShowZone(false);
  //       setTimeout(() => {setIsEnabled(true)}, 250)
  //     }

  //     const panGesture = Gesture.Pan()
  //     .enabled(isEnabled)
  //     .onTouchesUp(() => { // Touch Up // relacher
  //       console.log("UP");
  //       runOnJS(onEndFunction)();

  //     }).onTouchesDown(() => { //Touch down // appuyer
  //       console.log("DOWN");
  //       runOnJS(onStartFunction)();
  //     })
  //     .onStart((event) => { //Start Mouvement
  //       // runOnJS(onStartFunction)();
  //       // panGesture.enabled(true);
  //     })
  //     .onUpdate((event) => {
  //       // console.log("EVT :",event);
  //       translateX.value = event.translationX;
  //       translateY.value = event.translationY;
  //       // runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Soft);
  //       if(isInDropZone(translateX.value , translateY.value)){
  //         // runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Soft);
  //         console.log("DROP ZONE ---- Do Not Save Vocal Message");
  //         translateX.value = withSpring(0);
  //         translateY.value = withSpring(0);
  //         runOnJS(onEndFunction)();
  //       }
  //     })
  //     .onEnd((event) => {
  //       const finalX = translateX.value;
  //       const finalY = translateY.value;
  //       translateX.value = withSpring(0);
  //       translateY.value = withSpring(0);
        
  //     })


  //   // const gestureHandler = useAnimatedGestureHandler({
  //   //   onStart: (_, ctx) => {
  //   //     ctx.startX = translateX.value;
  //   //     ctx.startY = translateY.value;
  //   //   },
  //   //   onActive: (event, ctx) => {
  //   //     translateX.value = ctx.startX + event.translationX;
  //   //     translateY.value = ctx.startY + event.translationY;
  //   //   },
  //   //   onEnd: (event) => {
  //   //     const finalX = startX.value + translateX.value;
  //   //     const finalY = startY.value + translateY.value;
  
  //   //     if (isInDropZone(finalX, finalY)) {
  //   //       runOnJS(() => console.log("Dropped inside the zone!"))();
  //   //     }
  
  //   //     // Reset position
  //   //     translateX.value = withSpring(0);
  //   //     translateY.value = withSpring(0);
  //   //   },
  //   // });

  //   const animatedStyle = useAnimatedStyle(() => ({
  //     transform: [
  //       { translateX: translateX.value },
  //       { translateY: translateY.value },
  //     ],
  //   }));


  //   const { width } = Dimensions.get("window");
  //   const size = width*0.6;
  //   const strokeWidth = 12;
  //   const glowWidth = 16;
  //   const radius = (size - strokeWidth) / 2;
  //   const circumference = radius * 2 * Math.PI;
  //   const rotate = useSharedValue(0);
  //   useEffect(() => {
  //     rotate.value = withRepeat(withTiming(360, { duration: 1500, easing: Easing.linear }), -1, false);
  //   },[]);

  //   const animatedStyleC = useAnimatedStyle(() => ({
  //     transform: [{ rotate: `${rotate.value}deg`}],
  //   }))
    
  //   const TopTabs = createMaterialTopTabNavigator();
  //   const screenHeight = Dimensions.get('window').height;
  //     const HEADER_HEIGHT = screenHeight*0.35
  //     const headerVisible = useSharedValue(1)
    
  //     const headerAnimatedStyle = useAnimatedStyle(() => ({
  //       transform: [{translateY: withTiming(headerVisible.value ? 0 : -HEADER_HEIGHT, {duration: 200}) }],
  //       opacity: withTiming(headerVisible.value, { duration: 200}),
  //     }));
    
  //     const tabsAnimatedStyle = useAnimatedStyle(() => ({
  //       transform: [
  //         {
  //           translateY: withTiming(headerVisible.value ? 0 : -HEADER_HEIGHT+50, { duration: 200}),
  //         },
  //       ],
  //     }))

  //   return (
  //       <TopTabs.Navigator style={{}}
  //         key={headerVisible.value ? 'headerShown' : 'headerHidden'}
  //         screenOptions={{
  //             // swipeEnabled: false
  //             // lazy:true
  //         }}
  //         >
  //         <TopTabs.Screen name="tab1">
  //             { () => <MosaicList  headerVisible={headerVisible} headerHeight={HEADER_HEIGHT}/>}
  //         </TopTabs.Screen>
  //         <TopTabs.Screen name="tab2">
  //             { () => <Tab2  headerVisible={headerVisible} headerHeight={HEADER_HEIGHT}/>}
  //         </TopTabs.Screen>
  //         {/* <TopTabs.Screen name="tab1" getComponent={() => require("./mosaicList").default} options={{title:"Tab 1"}}/>
  //         <TopTabs.Screen name="tab2" getComponent={() => require("./tab2").default} options={{title:"Tab 2"}}/> */}
  //       </TopTabs.Navigator>
  //   );

  //   return (
  //     <>
  //       <Button title={isAnimating ? "Stop Animation" : "Start Animation"} onPress={toggleAnimation} />
  //       <AudioWaves svgWidth={200} svgHeight={50} waveformHeight={40} rectWidth={4} wavesNumber={20} yStart={10} isAnimating={!isAnimating}/>
  //       {showZone ? 
  //         <View style={styles.dropZone} />
  //       :
  //         <></>  
  //       }
  //       <GestureDetector gesture={panGesture}>
  //         <Animated.View
  //           style={[
  //             styles.draggable,
  //             animatedStyle
  //           ]}
  //           />
  //       </GestureDetector>
  //       <Animated.View style={[{ position: "absolute", marginTop:50 }, animatedStyleC]}>
  //                   <Svg width={size+30} height={size+30} viewBox={`0 0 ${size} ${size}`}>
  //                   <Defs>
  //                       {/* <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
  //                       <Stop offset="0%" stopColor="rgba(254, 103, 249, 0.6)" />
  //                       <Stop offset="25%" stopColor="rgba(62, 213, 255, 0.6)" />
  //                       <Stop offset="75%" stopColor="rgba(62, 213, 255, 0.6)" />
  //                       <Stop offset="100%" stopColor="rgba(254, 103, 249, 0.6)" />
  //                       </LinearGradient> */}
  //                       <LinearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
  //                       <Stop offset="0%" stopColor="rgba(254, 103, 249, 0.6)" />
  //                       <Stop offset="25%" stopColor="rgba(62, 213, 255, 0.6)" />
  //                       <Stop offset="75%" stopColor="rgba(62, 213, 255, 0.6)" />
  //                       <Stop offset="100%" stopColor="rgba(254, 103, 249, 0.6)" />
  //                       </LinearGradient>
        
  //                       {/* Outer Glow Gradient (Fades to White) */}
  //                       <LinearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
  //                       <Stop offset="0%" stopColor="rgba(254, 103, 249, 0.6)" stopOpacity="0.6" />
  //                       <Stop offset="25%" stopColor="rgba(62, 213, 255, 0.6)" stopOpacity="0.6"/>
  //                       <Stop offset="75%" stopColor="rgba(62, 213, 255, 0.6)"  stopOpacity="0.6"/>
  //                       <Stop offset="100%" stopColor="rgba(254, 103, 249, 0.6)" stopOpacity="0.6"/>
  //                       </LinearGradient>
  //                       <LinearGradient id="glowGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
  //                       <Stop offset="0%" stopColor="rgba(254, 103, 249, 0.8)" stopOpacity="0.4"/>
  //                       <Stop offset="25%" stopColor="rgba(62, 213, 255, 0.8)" stopOpacity="0.4"/>
  //                       <Stop offset="75%" stopColor="rgba(62, 213, 255, 0.8)" stopOpacity="0.4"/>
  //                       <Stop offset="100%" stopColor="rgba(254, 103, 249, 0.8)" stopOpacity="0.4"/>
  //                       </LinearGradient>
  //                       <LinearGradient id="glowGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
  //                       <Stop offset="0%" stopColor="rgba(254, 103, 249, 0.8)" stopOpacity="0.2"/>
  //                       <Stop offset="25%" stopColor="rgba(62, 213, 255, 0.8)" stopOpacity="0.2"/>
  //                       <Stop offset="75%" stopColor="rgba(62, 213, 255, 0.8)" stopOpacity="0.2"/>
  //                       <Stop offset="100%" stopColor="rgba(254, 103, 249, 0.8)" stopOpacity="0.2"/>
  //                       </LinearGradient>
        
  //                   </Defs>
  //                   {/* Outer Glow Stroke (Fades Outward) */}
  //                   <Circle
  //                       cx={size / 2}
  //                       cy={size / 2}
  //                       r={radius-10}
  //                       stroke="url(#glowGradient)"
  //                       strokeWidth={glowWidth} // Wider for glow effect
  //                       fill="none"
  //                       strokeDasharray={circumference}
  //                       strokeDashoffset={circumference * 0}
  //                       strokeLinecap="round"
  //                       opacity={0.5} // Make it blend better
  //                   />
  //                   <Circle
  //                       cx={size / 2}
  //                       cy={size / 2}
  //                       r={radius-10}
  //                       stroke="url(#glowGradient2)"
  //                       strokeWidth={glowWidth+3} // Wider for glow effect
  //                       fill="none"
  //                       strokeDasharray={circumference}
  //                       strokeDashoffset={circumference * 0}
  //                       strokeLinecap="round"
  //                       opacity={0.5} // Make it blend better
  //                   />
  //                   <Circle
  //                       cx={size / 2}
  //                       cy={size / 2}
  //                       r={radius-10}
  //                       stroke="url(#glowGradient3)"
  //                       strokeWidth={glowWidth+6} // Wider for glow effect
  //                       fill="none"
  //                       strokeDasharray={circumference}
  //                       strokeDashoffset={circumference * 0}
  //                       strokeLinecap="round"
  //                       opacity={0.5} // Make it blend better
  //                   />
        
  //                   {/* Main Stroke */}
  //                   <Circle
  //                       cx={size / 2}
  //                       cy={size / 2}
  //                       r={radius-10}
  //                       stroke="url(#mainGradient)"
  //                       strokeWidth={strokeWidth}
  //                       fill="none"
  //                       strokeDasharray={circumference}
  //                       strokeDashoffset={circumference * 0}
  //                       strokeLinecap="round"
  //                   />
  //                   </Svg>
  //               </Animated.View>
        
  //       {/* <View style={{borderColor:"red", borderWidth:1, width:"100%", height:250}}>
  //         <TouchableOpacity onPressIn={()=>{
  //               setTimeout(() => {
  //                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  //                   console.log("ON PRESS IN ! ABOUTSCREEN");
  //                   setIconSize(48);
  //                   // record();
  //                 }, 0);
                
  //               }}
  //               onPressOut={()=>{
  //                 setTimeout(() => {
  //                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  //                   setIconSize(32);
  //                   console.log("ON PRESS OUT ! ABOUTSCREEN");
  //                   // stopRecording();
  //                 }, 120);
  //               }}
  //               style={{padding: 8, backgroundColor: 'white', borderRadius: 50, elevation: 5, position: 'absolute', bottom: 1, right: 0}}
  //               {...panResponder.current.panHandlers}
  //             >
  //               <Ionicons name={'mic-outline'} color={'black'} size={iconSize} />
  //             </TouchableOpacity>
  //       </View> */}
  //       {/* <View style={styles.container}>
  //         <View style={styles.dCont}>
  //           <View
  //             onLayout={(event) => {
  //               const layout = event.nativeEvent.layout;
  //               dropZoneValues.current = layout;
  //               console.log("DROPZONE VALUES :", dropZoneValues);
  //             }}
  //             style={styles.dropZone}
  //             >
  //           <Text style={styles.text}>Drop Zone</Text>
  //           </View>
  //         </View>
  //         <View style={styles.cCont}>
  //           <TouchableOpacity onPress={() => {console.log("PRESS SIMPLE !!")}} onPressIn={() => {console.log("PRESS-IN! ! ! !")}} onPressOut={() => {console.log("PRESS-OUT !!!!")}}>

  //           <Animated.View
  //             {...panResponder.panHandlers}
  //             style={[pan.getLayout(), styles.circle]}
  //             onLayout={handleIconLayout}
  //             >
  //             <Ionicons name="mic-outline" size={iconSize} color="white" />
  //           </Animated.View>
  //           </TouchableOpacity>

  //         </View>
  //       </View> */}
  //     </>
      

  //   );
}

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#25292e',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderColor:"red",borderWidth:1
//   },
//   text: {
//     color: '#fff',
//   },
//   circle: {
//     borderColor:"green",borderWidth:1,
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: 'blue',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   // dropZone: {
//   //   width: 170,
//   //   height: 130,
//   //   backgroundColor: 'green',
//   //   justifyContent: 'center',
//   //   alignItems: 'center',
//   // },
//   cCont: {
//     position:"absolute",
//     right:0,
//     bottom:0,
//     width:70,
//     height:70,
//     borderColor:"yellow",borderWidth:1,
//   },
//   dCont: {
//     position:"absolute",
//     left:0,
//     bottom:0,
//     borderColor:"pink",borderWidth:2,

//   },
//   dropZone: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     width: DROP_ZONE.width,
//     height: DROP_ZONE.height,
//     backgroundColor: "rgba(0,0,255,0.2)",
//     borderRadius: 10,
//   },
//   draggable: {
//     width: DRAGGABLE_SIZE,
//     height: DRAGGABLE_SIZE,
//     backgroundColor: "red",
//     borderRadius: 30,
//     position: "absolute",
//     bottom:0,
//     right:0,
//   },
// });
