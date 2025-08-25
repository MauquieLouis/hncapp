import {  memo, useEffect, useRef, useState } from 'react';
import React, { View, StyleSheet, Button } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Svg, Rect } from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(Rect);




// const generateSinusoidalWaveform = (numPoints = 100) => {
//   return Array.from({ length: numPoints }, (_, index) => {
//     const angle = (index / numPoints) * Math.PI * 2; // Map index to angle in range [0, 2π]
//     const height = Math.sin(angle) * (WAVEFORM_HEIGHT / 2) + (WAVEFORM_HEIGHT / 2); // Scale and shift sine wave
//     return height;
//   });
// };
const generateFakeWaveform = (numPoints = 100, height: number) => {
  return Array.from({ length: numPoints }, () => Math.random() * height);
};
    
const AudioWaves = (props: any) => {
      
  // REQUIRED
  const SVG_WIDTH = props.svgWidth;
  const SVG_HEIGHT = props.svgHeight;
  const RECT_WIDTH = props.rectWidth;
  const WAVEFORM_HEIGHT = props.waveformHeight;

  const WAVES_NB = props.wavesNumber || 10;
  const waveform = generateFakeWaveform( WAVES_NB, WAVEFORM_HEIGHT );

  const minDuration = 400;
  const maxDuration = 680;

  const colorTables = ['#00FF00', '#FF0000', '#FFFFFF', '#FF00FF', '#FFFF00', '#00FFFF']

  useEffect(() => {
    toggleAnimation();
  }, [props.isAnimating])

  const color = useSharedValue('#FF0000');
  const heightValues = waveform.map((item) => useSharedValue(-item));

  const animatedProps = heightValues.map((height, index) =>
    useAnimatedProps(() => {
      return {
        height: height.value,
        fill: color.value,
      };
    })
  );
  
  const generateUniqueHeightSequence = (minDuration: number, maxDuration: number, waveformHeight: number) => {
    // Generate a unique sequence of animations for each rectangle
    return withSequence(
      withTiming(-Math.random() * waveformHeight, {
        duration: Math.random() * (maxDuration - minDuration) + minDuration,
        easing: Easing.inOut(Easing.ease),
      }),
      withTiming(-Math.random() * waveformHeight, {
        duration: Math.random() * (maxDuration - minDuration) + minDuration,
        easing: Easing.inOut(Easing.ease),
      }),
      withTiming(-Math.random() * waveformHeight, {
        duration: Math.random() * (maxDuration - minDuration) + minDuration,
        easing: Easing.inOut(Easing.ease),
      }),
      withTiming(-Math.random() * waveformHeight, {
        duration: Math.random() * (maxDuration - minDuration) + minDuration,
        easing: Easing.inOut(Easing.ease),
      })
    );
  };

  const generateUniqueColorSequence = (minDuration: number, maxDuration: number) => {
    //Color Sequence
    return withSequence(
      withTiming(colorTables[Math.floor(Math.random()*colorTables.length)], {
        duration: Math.random()*(maxDuration-minDuration)+minDuration,
        easing: Easing.inOut(Easing.ease),
      }), 
      withTiming(colorTables[Math.floor(Math.random()*colorTables.length)], {
        duration: Math.random()*(maxDuration-minDuration)+minDuration,
        easing: Easing.inOut(Easing.ease),
      }), 
      withTiming(colorTables[Math.floor(Math.random()*colorTables.length)], {
        duration: Math.random()*(maxDuration-minDuration)+minDuration,
        easing: Easing.inOut(Easing.ease),
      }), 
      withTiming(colorTables[Math.floor(Math.random()*colorTables.length)], {
        duration: Math.random()*(maxDuration-minDuration)+minDuration,
        easing: Easing.inOut(Easing.ease),
      })
    );
  }

  
  const startAnimation = () => {
    heightValues.forEach((height) => {
      height.value = withRepeat(generateUniqueHeightSequence(minDuration, maxDuration, WAVEFORM_HEIGHT), Infinity, true);
    });
    color.value = withRepeat(
      generateUniqueColorSequence(minDuration, maxDuration),
    Infinity, true);
  };

  const stopAnimation = () => {
    heightValues.forEach((height) => {
      cancelAnimation(height);
    });
    cancelAnimation(color);
  };


  const toggleAnimation = () => {
    if (props.isAnimating) {
      stopAnimation();
    } else {
      startAnimation();
    }
    // setIsAnimating(!props.isAnimating);
  };


  return (
    <View style={styles.container}>
      <View style={{width:SVG_WIDTH, height:SVG_HEIGHT}}>
        <Svg width={SVG_WIDTH} height={SVG_HEIGHT} style={{borderWidth:1, borderColor:"cyan"}}>
          {waveform.map((item, index) => {
            const space= (SVG_WIDTH / waveform.length)- RECT_WIDTH
            return <AnimatedRect
            key={index}
            animatedProps={animatedProps[index]}    
            x={index*(space+RECT_WIDTH)} 
            y={SVG_HEIGHT-props.yStart-2} 
            width={RECT_WIDTH} 
            />
          })}
        </Svg>
      </View>
      {/* <Button title={ ? "Stop Animation" : "Start Animation"} onPress={toggleAnimation} /> */}
    </View>
  );
}

export default memo(AudioWaves);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
  },
});
