import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, runOnJS } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const ZoomableImage = (props: any) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Image size
  const IMAGE_WIDTH = props.width;
  const IMAGE_HEIGHT = props.height;

  // Get max translation based on zoom
  const getMaxTranslation = (zoom: number) => {
    return {
      x: (IMAGE_WIDTH * zoom - width) / 2,
      y: (IMAGE_HEIGHT * zoom - height) / 2,
    };
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = event.scale;
    })
    .onEnd(() => {
      scale.value = withTiming(1, { duration: 300 }); // Reset zoom on release
    });

    
    // Pan Gesture (Move)
    // const panGesture = Gesture.Pan()
    // .onUpdate((event) => {
    //     if (scale.value > 1) {
    //         // const maxTrans = getMaxTranslation(scale.value);
    //         const maxTranslateX = (IMAGE_WIDTH * scale.value - width) / 2;
    //         const maxTranslateY = (IMAGE_HEIGHT * scale.value - height) / 2;
    //         translateX.value = Math.min(maxTranslateX, Math.max(-maxTranslateX, event.translationX));
    //         translateY.value = Math.min(maxTranslateY, Math.max(-maxTranslateY, event.translationY));
    //       }
    // })
    // .onEnd(() => {
    //     if (scale.value === 1) {
    //         // Ensure smooth reset to original position after a small delay
    //         translateX.value = withDelay(200, withTiming(0, { duration: 300 }));
    //         translateY.value = withDelay(200, withTiming(0, { duration: 300 }));
    //     }
    // });
    
    // const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

    // Apply animation styles
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value },
        // { translateX: translateX.value },
        // { translateY: translateY.value },
      ],
    }));

  const styles = StyleSheet.create({
    container: {
    //   flex: 1,
    //   justifyContent: 'center',
    //   alignItems: 'center',
    //   backgroundColor: '#fff',
      borderColor:"blue", borderWidth:1
    },
    image: {
    borderColor:"red", borderWidth:1,
      width: props.width,
      height: props.height,
    },
  });
  return (
    // <GestureHandlerRootView>
      <GestureDetector gesture={pinchGesture}>
        <Animated.Image
          source={{ uri: props.uri }}
          style={[styles.image, animatedStyle]}
          resizeMode={props.resizeMode}
        />
      </GestureDetector>
    // </GestureHandlerRootView>
  );
};


export default ZoomableImage;
