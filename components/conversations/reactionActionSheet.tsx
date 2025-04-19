import React, { StyleSheet, TouchableOpacity } from "react-native";
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent } from "@/components/ui/actionsheet"
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { useUserContext } from "@/contexts/userContext";
import { memo } from "react";
import { ItemLayout } from "react-native-reanimated-carousel/lib/typescript/components/ItemLayout";
import { VStack } from "../ui/vstack";

const ReactionActionSheet = (props: any) => {

    const { user } = useUserContext();
    
    // items = props.items;
    // console.log("REACTION LIST :", props.reactions);
    return(
        <Actionsheet isOpen={props.showReactionActionSheet} onClose={props.onCloseReactionActionSheet} useRNModal={false}>
            <ActionsheetBackdrop />
            <ActionsheetContent style={styles.actionsheetContent}>
                <Text>REACTIONS</Text>
                <VStack space={'lg'} style={styles.actionSheetHStack}>
                    {Object.entries(props.reactions).map(([key, { reaction, user_id }]) => (
                        <HStack key={key}>
                            <Text key={key} style={styles.actionSheetText}>{reaction} : {user_id}</Text>
                            {user_id === user.id ? 
                                <TouchableOpacity onPress={() => {props.deleteFunction()}}>
                                    <Ionicons name="close-circle" size={32} color="black" />
                                </TouchableOpacity>
                            :
                            <></>
                            }
                        </HStack>
                    ))}
                </VStack>
            </ActionsheetContent>
        </Actionsheet>
    );
    
}

export default memo(ReactionActionSheet);

const styles = StyleSheet.create({
    actionsheetContent: {
        backgroundColor: 'white',
    },
    actionSheetHStack: {
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 4,
        // height: 150,
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