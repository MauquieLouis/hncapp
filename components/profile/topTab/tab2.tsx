import React from "react";
import { Text } from "@/components/ui/text";
import { ScrollView, Animated } from "react-native";

const Tab2 = (props: any) => {

    return(
        <Animated.ScrollView
            contentContainerStyle={{padding:0}} scrollEventThrottle={16}
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: props.scrollY } } }],
                { useNativeDriver: true }
            )}
        >
           {Array.from({ length: 150 }).map((_, i) => (
            <Text key={i} style={{color:"blue"}}>
              Inner item {i + 1}
            </Text>
          ))}
        </Animated.ScrollView>
    )

}

export default Tab2;