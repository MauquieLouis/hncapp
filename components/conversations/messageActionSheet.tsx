import React, { StyleSheet, TouchableOpacity } from "react-native";
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent } from "@/components/ui/actionsheet"
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { useUserContext } from "@/contexts/userContext";

const MessageActionSheet = (props: any) => {

    const { user } = useUserContext();
    
    items = props.items;
    return(
        <Actionsheet isOpen={props.showActionSheet} onClose={props.onCloseActionSheet} useRNModal={true}>
            <ActionsheetBackdrop />
            <ActionsheetContent style={styles.actionsheetContent}>
                <HStack space={'lg'} style={styles.actionSheetHStack}>
                    {Object.entries(items).map(([key, { icon, onPress }]) => (
                        <TouchableOpacity
                            key={key}
                            onPress={onPress}
                            style={styles.actionSheetBox}
                        >
                            <Ionicons name={icon} size={32} color="black" />
                            <Text style={styles.actionSheetText}>{key}</Text>
                        </TouchableOpacity>
                    ))}
                </HStack>
            </ActionsheetContent>
        </Actionsheet>
    );
    
}

export default MessageActionSheet;

const styles = StyleSheet.create({
    actionsheetContent: {
        backgroundColor: 'white',
    },
    actionSheetHStack: {
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 4,
        height: 150,
    },
    actionSheetBox: {
        flex: 1,
        padding: 4,
        backgroundColor: "white",
        alignItems: "center",
    },
    actionSheetText: {
        marginTop: 10,
        fontSize: 14,
        color: 'black',
    },
  });