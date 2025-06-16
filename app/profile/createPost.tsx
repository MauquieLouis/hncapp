import React, { useEffect } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import { Input, InputField } from "@/components/ui/input";
import ImagePostSelector from "@/components/profile/imagePostSelector";

const CreatePost = () => {

    const { poster_id, user_id } = useLocalSearchParams();

    useEffect(() => {
        console.log("Poster ID: ", poster_id);
        console.log("User ID: ", user_id);
        // Here you can add logic to handle the creation of a post
        // For example, you might want to fetch user data or initialize a form
    }, []);

    


    return (
        <Box style={{flex:1}}>
            <Box style={{ flex:1, borderColor:"green", borderWidth:1, height:"100%"}}>
                <Text>CREATE POST</Text>

            </Box>
            <ImagePostSelector />
            <Box style={{flex:4, borderColor:"pink", borderWidth:1, height:"100%"}}> 
                {/* TEXT INPUT ZONE */}
                <Input variant="outline" size="md" style={styles.writingInput}>
                    <InputField 
                        // ref={inputRef}
                        // onFocus={() => setIsTextFocused(true)}
                        // onBlur={() => setIsTextFocused(false)}
                        // scrollEnabled={inputHeight >= maxHeight}
                        placeholder="Write message here..." 
                        // onChangeText={(text) => {setText(text); sendTypingEvent()}} 
                        // value={text}
                        multiline={true}
                        // onContentSizeChange={handleContentSizeChange}
                        style={{color:"black"}}
                        />
                </Input>
                <Box>
                    <Ionicons name="mic-circle-outline" size={50} color="black" />
                </Box>
            </Box>
        </Box>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },

  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
});


export default CreatePost;