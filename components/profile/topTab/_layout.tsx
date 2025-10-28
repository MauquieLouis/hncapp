import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import { Dimensions, View } from "react-native";
import MosaicList from "./mosaicList";
import Tab2 from "./tab2";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useUserContext } from "@/contexts/userContext";

const TopTabs = createMaterialTopTabNavigator();

// const { Navigator } = createMaterialTopTabNavigator();
// const TopTabs = withLayoutContext(Navigator);
const height = Dimensions.get('screen').height;

export default function TopTabLayout(props: any){

    const { theme } = useUserContext();

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

    const iconStyle={
        //Color for focused tab
        focused_color: theme.iconFocusedColor,
        //Color for not focused tab
        not_focused_color : theme.iconNotFocusedColor,
        //Size of tab icons
        size:26,
        //Show text of the tab icon
        show_text:false,
        //Size of the center icons
        center_size:56,
    }

    function colorIconTab(props: { focused: any; }){
        return props.focused ? iconStyle.focused_color : iconStyle.not_focused_color;
    }

    return(
        // <NavigationContainer>
        <Animated.View
            style={[{
                flex:1,
                // transform:[{ translateY: tabsTranslate }],
                paddingTop: props.headerHeight
            }, props.tabsAnimatedStyle]}>
            <TopTabs.Navigator style={{ /*borderColor:'lime', borderWidth:3*/}}
                key={props.headerVisible.value ? 'headerShown' : 'headerHidden'}
                screenOptions={{
                    
                    // swipeEnabled: false
                    // lazy:true
                    
                    // ta
                    tabBarActiveTintColor: iconStyle.focused_color,
                    tabBarInactiveTintColor:iconStyle.not_focused_color,
                    tabBarShowLabel:false,
                    tabBarStyle:{backgroundColor:theme.backgroundColor2,borderTopWidth:0}
                }}
                >
                <TopTabs.Screen name="tab1" options={{
                    tabBarIcon: props => <Ionicons name="grid" color={colorIconTab(props)} size={24}/>
                }}>
                    { () => <MosaicList 
                        headerVisible={props.headerVisible} 
                        headerHeight={props.headerHeight} 
                        isScrolling={props.isScrolling}
                        profileId={props.profileId}
                        />}
                </TopTabs.Screen>
                <TopTabs.Screen name="tab2" options={{
                    tabBarIcon: props => <Ionicons name="film" color={colorIconTab(props)} size={24}/>
                }}>
                    { () => <Tab2 scrollY={props.scrollY} headerVisible={props.headerVisible} headerHeight={props.headerHeight} isScrolling={props.isScrolling}/>}
                </TopTabs.Screen>
                {/* <TopTabs.Screen name="tab1" getComponent={() => require("./mosaicList").default} options={{title:"Tab 1"}}/>
                <TopTabs.Screen name="tab2" getComponent={() => require("./tab2").default} options={{title:"Tab 2"}}/> */}
            </TopTabs.Navigator>
        </Animated.View>
        // </NavigationContainer>
    );
}