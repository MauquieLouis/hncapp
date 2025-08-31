import React, { Dimensions, StyleSheet, TouchableOpacity } from "react-native";
import { Modal, ModalBackdrop, ModalContent } from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import { Center } from "@/components/ui/center";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Ionicons } from "@expo/vector-icons";
import { useUserContext } from "@/contexts/userContext";

const ModalIcon = (props: any) => {

    const { theme } = useUserContext();

    const items = props.items
    const styles = StyleSheet.create({
        modalContentStyle:{
            // padding:2,
            position:"absolute", 
            left:props.myMessage ? 3 :Dimensions.get('window').width- (2*Dimensions.get('window').width/3)-3, 
            top: props.modalIconPosition,
            width: 2*Dimensions.get('window').width/3,
            height:85,
            padding:3,
            borderRadius:15,
            backgroundColor: theme.modalBackground,
            borderColor:theme.modalBackground
            // borderColor:"green",borderWidth:2
        },
        actionsheetContent: {
            backgroundColor: theme.modalBackground,
        },
        actionSheetHStack: {
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
            // padding: 4,
            // height: 150,
            // borderColor:"red",borderWidth:1
        },
        actionSheetBox: {
            flex: 1,
            padding: 4,
            backgroundColor: theme.modalBackground,
            alignItems: "center",
        },
        actionSheetText: {
            marginTop: 10,
            fontSize: 14,
            color: 'black',
        },
        separationBox:{
            borderTopColor:"rgba(0, 0, 0, 0.2)",
            borderTopWidth:1,
            height:1,
            marginTop:5,
            width:"90%",
            marginLeft:"4.5%",
            // paddingBottom
        },
        iconStyle: {
            width: 36,
            height: 36,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "white",
            borderRadius: 18,
            borderColor:"rgba(0, 0, 0, 0.10)",
            borderWidth:1,
            elevation:1,
            display: "flex",  // Ensure flex behavior,
            padding:0
        },
        iconTextStyle:{
            padding:0,
            margin:0,
            fontSize: 18,
            // color: "black",
            textAlign: "center",  // Ensures text stays centered
            textAlignVertical: "center", // Helps with Android-specific centering issues
            color: "black", 
            // borderColor:"blue", borderWidth:1
        },
        boxStyle: {
            width: "100%", 
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor:theme.modalBackground
        },
    });

    const emojis = ["👍", "👎", "😅", "😂", "😍", "😥", "❤"]

    return(
        <Modal isOpen={props.isOpen} onClose={props.onClose}>
            <ModalBackdrop/>
            <ModalContent style={styles.modalContentStyle}>
                <Center>
                    <HStack >
                    {emojis.map((emoji, index) => (
                        <TouchableOpacity key={index} style={styles.iconStyle} onPress={() => props.onPress(emoji)}>
                            <Box style={styles.boxStyle}>
                                <Text style={styles.iconTextStyle}>{emoji}</Text>
                            </Box>
                        </TouchableOpacity>
                    ))}
                    </HStack>
                </Center>
                <Box style={styles.separationBox}></Box>
                <Center>
                    <HStack space={"md"} style={styles.actionSheetHStack}>
                        {Object.entries(items).map(([key, { icon, onPress }]) => (
                            <TouchableOpacity
                                key={key}
                                onPress={onPress}
                                style={styles.actionSheetBox}
                            >
                                <Ionicons name={icon} size={28} color={theme.iconColor3}/>
                                {/* <Text style={styles.actionSheetText}>{key}</Text> */}
                            </TouchableOpacity>
                        ))}
                    </HStack>
                </Center>
            </ModalContent>
            {/**  That's a way to add a second modal item */}
            {/* <ModalContent style={{position:"absolute", left:0, top: 0}}>
                <Center>
                    <Text>MODAL Action</Text>
                </Center>
            </ModalContent> */}
        </Modal>
    );
}

export default ModalIcon;