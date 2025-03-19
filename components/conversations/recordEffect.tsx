import { Box } from '@/components/ui/box';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect, useCallback } from 'react';
import React, { Dimensions } from 'react-native';
// import Animated, { cancelAnimation, Easing, useAnimatedProps, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Svg, Rect, Circle, LinearGradient, Stop, Defs} from 'react-native-svg';
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withRepeat, withTiming, Easing } from 'react-native-reanimated';


const RecordEffect = (props: any) => {

    const { width } = Dimensions.get("window");
    const size = props.width;
    // const radius = props.radius
    const strokeWidth = 2;
    const glowWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const rotate = useSharedValue(0);

    useEffect(() => {
        rotate.value = withRepeat(withTiming(360, { duration: 1500, easing: Easing.linear }), -1, false);
    },[]);

    const animatedStyleC = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotate.value}deg`}],
    }));

    return(
        <Animated.View style={[{ position: "absolute", marginTop:50, zIndex:-1 }, animatedStyleC]}>
            <Svg width={size+30} height={size+30} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
                <LinearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="rgba(254, 103, 249, 0.6)" />
                <Stop offset="25%" stopColor="rgba(62, 213, 255, 0.6)" />
                <Stop offset="75%" stopColor="rgba(62, 213, 255, 0.6)" />
                <Stop offset="100%" stopColor="rgba(254, 103, 249, 0.6)" />
                </LinearGradient>

                {/* Outer Glow Gradient (Fades to White) */}
                <LinearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="rgba(254, 103, 249, 0.6)" stopOpacity="0.6" />
                <Stop offset="25%" stopColor="rgba(62, 213, 255, 0.6)" stopOpacity="0.6"/>
                <Stop offset="75%" stopColor="rgba(62, 213, 255, 0.6)"  stopOpacity="0.6"/>
                <Stop offset="100%" stopColor="rgba(254, 103, 249, 0.6)" stopOpacity="0.6"/>
                </LinearGradient>
                <LinearGradient id="glowGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="rgba(254, 103, 249, 0.8)" stopOpacity="0.4"/>
                <Stop offset="25%" stopColor="rgba(62, 213, 255, 0.8)" stopOpacity="0.4"/>
                <Stop offset="75%" stopColor="rgba(62, 213, 255, 0.8)" stopOpacity="0.4"/>
                <Stop offset="100%" stopColor="rgba(254, 103, 249, 0.8)" stopOpacity="0.4"/>
                </LinearGradient>
                <LinearGradient id="glowGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="rgba(254, 103, 249, 0.8)" stopOpacity="0.2"/>
                <Stop offset="25%" stopColor="rgba(62, 213, 255, 0.8)" stopOpacity="0.2"/>
                <Stop offset="75%" stopColor="rgba(62, 213, 255, 0.8)" stopOpacity="0.2"/>
                <Stop offset="100%" stopColor="rgba(254, 103, 249, 0.8)" stopOpacity="0.2"/>
                </LinearGradient>

            </Defs>
            {/* Outer Glow Stroke (Fades Outward) */}
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius-10}
                stroke="url(#glowGradient)"
                strokeWidth={glowWidth} // Wider for glow effect
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * 0}
                strokeLinecap="round"
                opacity={0.5} // Make it blend better
            />
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius-10}
                stroke="url(#glowGradient2)"
                strokeWidth={glowWidth+3} // Wider for glow effect
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * 0}
                strokeLinecap="round"
                opacity={0.5} // Make it blend better
            />
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius-10}
                stroke="url(#glowGradient3)"
                strokeWidth={glowWidth+3} // Wider for glow effect
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * 0}
                strokeLinecap="round"
                opacity={0.5} // Make it blend better
            />

            {/* Main Stroke */}
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius-10}
                stroke="url(#mainGradient)"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * 0}
                strokeLinecap="round"
            />
            </Svg>
        </Animated.View>
    );
}

export default RecordEffect;