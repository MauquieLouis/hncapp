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
    const [ text, setText ] = useState("");
    const [ comments, setComments ] = useState<any[]>([]);
    const [ loading, setLoading ] = useState<boolean>(false);
    const [ modalComments, setModalComments ] = useState<boolean>(false);

    const { profile } = useUserContext();

    const onCloseModalComments = () => {
        setModalComments(false);
    }

    useEffect(() => {
        console.log("PROPS :", props);
        getFirstPosts();
    }, []);
    
    useEffect(() => {
        // getFirstPosts();
        console.log("Post list changed !!! :", postsList);
    }, [postsList]);

    const getFirstPosts = async () => {
        try{
            const { data, error } = await supabase.from('posts').select('*').eq('user_id', props.user_id);
            if(error){
                console.error("Error when fetching posts in getFirstPosts function in components/profile/postsList.tsx", error);
            }
            if(data){
                console.log("DATA POSTS for user", profile.user_id, "data : ", data);
                setPostsList(data);
            }
        }catch(error){
            console.error("Error in getFirstPosts function in components/profile/postsList.tsx", error);
        }finally{

        }
    }

    const fetchComments = async () => {
            try{
                setLoading(true);
                console.log("==============Fetching comments for post id: ", item.id);
                const { data, error } = await supabase.from('comments').select('*').eq('post_id', item.id);
                if (error) {
                    console.error("Error fetching comments in fetchComments function in components/profile/postElemInPostsList.tsx", error);
                } else {
                    console.log("Fetched comments: ", data);
                    setComments(data);
                }
            }catch(error: unknown){
                console.error("Error in fetchComments function in components/profile/postElemInPostsList.tsx", error);
            } finally{
                setLoading(false);
            }
    
        }


    const renderComment = ({ item }: { item: any }) => (
            <Box style={{ borderBottomWidth:1, borderColor:"rgba(127,127,127,0.8)",  paddingVertical:10 }}>
                <HStack space="sm" style={{ alignItems: "center" }}>
                    <Avatar user_id={item.user_id}/>
                    <VStack>
                    <Text style={{ fontWeight:"bold", color:"white"}}>{item.user_id}</Text>
                    <Text style={{ color:"white" }}>{item.text}</Text>
                    </VStack>
                </HStack>
            </Box>
        );
    
    const postComment = async () => {
        try{
            if (text.trim() === '') return;
            setLoading(true);
            const { data, error } = await supabase.from('comments').insert({
                post_id: "item.id",
                user_id: profile.user_id,
                text: text,
            });
            if(error){
                console.error("Error when posting comment in postComment function in components/profile/postElemInPostsList.tsx", error);   
            }
        }catch(error: unknown){
            console.error("Error in postComment function in components/profile/postElemInPostsList.tsx", error);
        }finally{
            setLoading(false);
        }
    }

    const renderItemFlatList = ({item, index}: {item: any, index: any}) => {
            return <PostElemInPostsList item={item} folder_url={props.folder_url} bucket={'posts'} openActionSheetFunction={setModalComments}/>
        }

    return(
        <Box style={{height:props.height, width:"100%", padding:5}}>
            <FlatList
                data={postsList}
                renderItem={renderItemFlatList}
            /> 
            {/* <Modal visible={modalComments} animationType="slide" onRequestClose={onCloseModalComments}> */}
                {/* <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                > */}
                    {/* <Box style={{borderColor:"red", borderWidth:1, padding:10, backgroundColor:"rgba(50,50,50,0.9)", width:350, height:80}}>
                        <HStack space="sm" style={{borderColor:"red", borderWidth:1, height:"100%"}}>
                            <Input variant="outline" size="md" style={styles.writingInput}>
                                <InputField 
                                    // onFocus={() => setIsTextFocused(true)}
                                    // onBlur={() => setIsTextFocused(false)}
                                    placeholder="Write message here..." 
                                    onChangeText={setText} 
                                    value={text}
                                    multiline={true}
                                    style={{color:"black"}}
                                    autoFocus={true}
                                    />
                            </Input>
                            <TouchableOpacity onPress={postComment}>
                                <Ionicons name="send-outline" size={32} color="white" />
                            </TouchableOpacity>
                        </HStack>

                    </Box> */}
                {/* </KeyboardAvoidingView> */}
            {/* </Modal> */}
            {/* <Modal isOpen={modalComments} onClose={onCloseModalComments} style={{backgroundColor:"rgba(0,0,0,0.7)"}} useRNModal={false}>
                <ModalBackdrop/>
                <ModalContent>
                    <ModalHeader>
                        <ModalCloseButton></ModalCloseButton>
                    </ModalHeader>
                    <TextInput
                            placeholder="Write message here..." 
                            onChangeText={setText} 
                            value={text}
                            multiline={true}
                            style={styles.writingInput}
                            placeholderTextColor="rgba(150,150,150,0.7)"
                            autoFocus={true}
                        />
                </ModalContent>
                </Modal> */}

            {/* <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding': undefined}
                >
            <Actionsheet isOpen={modalComments} onClose={onCloseModalComments}>
                <ActionsheetBackdrop/>
                <ActionsheetContent className="">
                    <ActionsheetDragIndicatorWrapper>
                        <ActionsheetDragIndicator/>
                    </ActionsheetDragIndicatorWrapper>
                    <VStack className="w-full pt-5">
                        <HStack space="md" className="justify-center items-cneter">
                            <Box>
                                <Image
                                    source={{ uri: "https://i.imgur.com/UwTLr26.png" }}
                                    resizeMode="contain"
                                    className="flex-1"
                                />
                            </Box>
                        </HStack>
                        <FormControl>
                            <FormControlLabel>
                                <FormControlLabelText>
                                    Write a comment here ...
                                </FormControlLabelText>
                            </FormControlLabel>
                            <Input className="w-full">
                                <InputSlot>
                                    <Ionicons name="chatbubble-ellipses-outline" size={24} color="white" />
                                </InputSlot>
                                <InputField placeholder="CVC/CVV"/>
                            </Input>
                        </FormControl>
                    </VStack>
                </ActionsheetContent>

            </Actionsheet>
            </KeyboardAvoidingView> */}
            {/* <Actionsheet isOpen={modalComments} onClose={onCloseModalComments} style={{backgroundColor:"rgba(0,0,0,0.7)"}} useRNModal={true}> */}
                    {/* {loading ? (
                        <Spinner />
                    ) : (
                        <FlatList
                        data={comments}
                        renderItem={renderComment}
                        keyExtractor={(item) => item.id.toString()}
                        style={{ borderColor:"green", borderWidth:1 }}
                        />
                    )} */}
                    {/* <HStack space="sm" style={{borderColor:"red", borderWidth:1}}>
                        <Input variant="outline" size="md" style={styles.writingInput}>
                            <InputField 
                                // onFocus={() => setIsTextFocused(true)}
                                // onBlur={() => setIsTextFocused(false)}
                                placeholder="Write message here..." 
                                onChangeText={setText} 
                                value={text}
                                multiline={true}
                                style={{color:"black"}}
                                />
                        </Input>
                        <TouchableOpacity onPress={postComment}>
                            <Ionicons name="send-outline" size={32} color="white" />
                        </TouchableOpacity>
                    </HStack> */}
                        
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