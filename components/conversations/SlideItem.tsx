import React, { useMemo, useState } from "react";
import {
  ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewProps,
} from "react-native";
import type { AnimatedProps } from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import VideoPlayer from "./video";
import VideoThumbNail from "./videoThumbnail";
import { Actionsheet, ActionsheetContent } from "../ui/actionsheet";
import MessageActionSheet from "./messageActionSheet";

interface Props extends AnimatedProps<ViewProps> {
  style?: StyleProp<ImageStyle>;
  index?: number;
  rounded?: boolean;
  source?: ImageSourcePropType;
  imagesArray?: any;
  openModal?: Function;
  attachments?: any;
  resizeMode?: string;
  modalOpen?: boolean;
  actionSheetTable?: object;
  openModalIconFunction?: Function;
}

export const SlideItem: React.FC<Props> = (props) => {

  const [ showActionSheet, setShowActionSheet ] = useState(false);
  
  const onCloseActionSheet = () => setShowActionSheet(false);
  const openActionSheetFunction = (_index: any) => { 
      setShowActionSheet(true); 
  };
  const { style, index = 0, rounded = false, testID, imagesArray, openModal, attachments, resizeMode, modalOpen, actionSheetTable, openModalIconFunction, ...animatedViewProps } = props;

  const source = useMemo(
    () => props.source || imagesArray[index % imagesArray.length],
    [index, props.source]

  );
  const type = useMemo(
    () => attachments[index % attachments.length].type,
    [attachments[index % attachments.length].type]
  );

  return (
    <Animated.View testID={testID} style={{ flex: 1, elevation:5, borderRadius:15 }} {...animatedViewProps}>
      <TouchableOpacity 
        onPress={() => openModal && openModal(index)} activeOpacity={1} style={{ height:"100%"}} 
        onLongPress={() => {
          console.log("Long Pressed", index);  
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
          openModalIconFunction && openModalIconFunction();
          // openActionSheetFunction(index);
        }}>
        {type.startsWith("video/") ? 
          <>
          {modalOpen == false ?
              <VideoThumbNail uri={source} width={'100%'} height={'100%'} borderRadius={15} resizeMode={resizeMode}/>
          : 
              <VideoPlayer uri={source} width={'100%'} height={'100%'} borderRadius={15} resizeMode={resizeMode}/>
          }
          </>

          : 
            <Animated.Image
            style={[style, styles.container, rounded && { borderRadius: 15 }]}
            resizeMode={resizeMode}
            src={source}
            />
        }
        <View style={styles.overlay}>
          <View style={styles.overlayTextContainer}>
              {imagesArray.length != 1 ?
                <>
                  <Text style={styles.overlayText}>{index+1}/{imagesArray.length}</Text>
                  { attachments[index % attachments.length].type.startsWith("video/") ? 
                  <Ionicons name={'videocam-outline'} color={'white'} size={16} /> :<></> }
                </>
              :
                <></>
              }
          </View>
          {type.startsWith("video/") ? 
            <>
            {modalOpen == false ?
            <View style={styles.overlayVideo}>
                <Ionicons name={'videocam-outline'} color={'white'} size={26}/>
            </View>
            :<></>}
            </>
              :<></>
          }
        </View>
      </TouchableOpacity>
      {modalOpen ? <></> :
      <></>
      // <MessageActionSheet items={actionSheetTable} showActionSheet={showActionSheet} onCloseActionSheet={onCloseActionSheet}/>
      }
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
},
  overlayVideo: {
    backgroundColor: "rgba(0, 0, 0, 0.56)",
    padding: 14,
    borderRadius: 10,
    minWidth: 30,
    minHeight: 30,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "rgba(255, 255, 255, 0.56)",
    borderWidth: 2
},

overlayText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
},
overlayTextContainer: {
    position:"absolute",
    right: 6,
    bottom: 6,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    padding: 10,
    borderRadius: 10,
    minWidth: 30,
    minHeight: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});