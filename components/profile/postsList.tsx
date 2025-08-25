import React, { useEffect, useState } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { FlatList, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Modal } from "react-native";
import { useUserContext } from "@/contexts/userContext";
import { supabase } from "@/libs/initSupabase";
import PostElemInPostsList from "./postElemInPostsList";
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper } from "../ui/actionsheet";
import { Spinner } from "../ui/spinner";
import { HStack } from "../ui/hstack";
import { Input, InputField, InputSlot } from "../ui/input";
import { Ionicons } from "@expo/vector-icons";
import { VStack } from "../ui/vstack";
import { Image } from "../ui/image";
import Avatar from "./avatar";
import { FormControl, FormControlLabel, FormControlLabelText } from "../ui/form-control";
// import { Modal, ModalBackdrop, ModalCloseButton, ModalContent, ModalHeader } from "../ui/modal";


const PostsList = (props: { height: any; user_id: string; folder_url: string }) => {

    const [ postsList, setPostsList ] = useState<any[]>([]);

    const { profile } = useUserContext();


    useEffect(() => {
        getFirstPosts();
    }, []);
    
    const getFirstPosts = async () => {
        try{
            const { data, error } = await supabase.from('posts').select('*').eq('user_id', props.user_id);
            if(error){
                console.error("Error when fetching posts in getFirstPosts function in components/profile/postsList.tsx", error);
            }
            if(data){
                setPostsList(data);
            }
        }catch(error){
            console.error("Error in getFirstPosts function in components/profile/postsList.tsx", error);
        }finally{

        }
    }

    const renderItemFlatList = ({item, index}: {item: any, index: any}) => {
        return <PostElemInPostsList item={item} folder_url={props.folder_url} bucket={'posts'}/>
    }

    return(
        <Box style={{height:props.height, width:"100%", padding:5}}>
            <FlatList
                data={postsList}
                renderItem={renderItemFlatList}
            /> 
        </Box>
    );

}


const styles = StyleSheet.create({
        writingInput:{
            width:"82%",
            backgroundColor:"rgba(255,255,255,1)", 
            borderRadius:15,
            borderColor:"rgba(150,150,150,0.7)",
            borderWidth:2,
            height: 40,
            textAlignVertical: 'top',
        }
});

export default PostsList;