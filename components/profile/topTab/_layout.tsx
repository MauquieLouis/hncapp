import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import { Dimensions, View } from "react-native";
import MosaicList from "./mosaicList";
import Tab2 from "./tab2";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";

const TopTabs = createMaterialTopTabNavigator();

// const { Navigator } = createMaterialTopTabNavigator();
// const TopTabs = withLayoutContext(Navigator);
const height = Dimensions.get('screen').height;

export default function TopTabLayout(props: any){

    // const HEADER_HEIGHT = 200;
    // const SCREEN_HEIGHT = Dimensions.get("window").height;
    // // Tabs translation (they move up with the header)
    // const tabsTranslate = props.scrollY.interpolate({
    //     inputRange: [0, HEADER_HEIGHT],
    //     outputRange: [0, -HEADER_HEIGHT],
    //     extrapolate: "clamp",
    // });

    // // Tabs height — grows as header disappears
    // const tabsHeight = props.scrollY.interpolate({
    //     inputRange: [0, HEADER_HEIGHT],
    //     outputRange: [SCREEN_HEIGHT - HEADER_HEIGHT, SCREEN_HEIGHT],
    //     extrapolate: "clamp",
    // });


    return(
        // <NavigationContainer>
        <Animated.View
            style={[{
                flex:1,
                // transform:[{ translateY: tabsTranslate }],
                paddingTop: props.headerHeight
            }, props.tabsAnimatedStyle]}>
            <TopTabs.Navigator style={{ borderColor:'lime', borderWidth:2}}>
                <TopTabs.Screen name="tab1">
                    { () => <MosaicList scrollY={props.scrollY}/>}
                </TopTabs.Screen>
                <TopTabs.Screen name="tab2">
                    { () => <Tab2 scrollY={props.scrollY} headerVisible={props.headerVisible} headerHeight={props.headerHeight}/>}
                </TopTabs.Screen>
                {/* <TopTabs.Screen name="tab1" getComponent={() => require("./mosaicList").default} options={{title:"Tab 1"}}/>
                <TopTabs.Screen name="tab2" getComponent={() => require("./tab2").default} options={{title:"Tab 2"}}/> */}
            </TopTabs.Navigator>
        </Animated.View>
        // </NavigationContainer>
    );
}