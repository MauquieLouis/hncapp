import React, { useMemo } from "react";
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

interface Props extends AnimatedProps<ViewProps> {
  style?: StyleProp<ImageStyle>;
  index?: number;
  rounded?: boolean;
  source?: ImageSourcePropType;
  imagesArray?: any;
  openModal?: Function;
  attachments?: any;
}

export const SlideItem: React.FC<Props> = (props) => {
  const { style, index = 0, rounded = false, testID, imagesArray, openModal, attachments, ...animatedViewProps } = props;

  const source = useMemo(
    () => props.source || imagesArray[index % imagesArray.length],
    [index, props.source]

  );
  const type = useMemo(
    () => attachments[index % attachments.length].type,
    [attachments[index % attachments.length].type]
  );

  return (
    <Animated.View testID={testID} style={{ flex: 1 }} {...animatedViewProps}>
      <TouchableOpacity onPress={() => openModal && openModal(index)} activeOpacity={1}>
        {type.startsWith("video/") ? 
          <Video
          source={{uri: source}}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode="cover"
          shouldPlay={false}
          useNativeControls
          style={{ width: '100%', height: 220, borderRadius: 15 }}
          />
          : 
          <Animated.Image
          style={[style, styles.container, rounded && { borderRadius: 15 }]}
          // source={source}
          resizeMode="cover"
          src={source}
          />
        }
      </TouchableOpacity>
      <View style={styles.overlay}>
        <View style={styles.overlayTextContainer}>
            {imagesArray.length != 1 ?
                <Text style={styles.overlayText}>{index+1}/{imagesArray.length}</Text>
            :
                <></>
            }
        </View>
      </View>
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