import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import { Input, InputField } from "@/components/ui/input";
import ImagePostSelector from "@/components/profile/imagePostSelector";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { HStack } from "@/components/ui/hstack";

const CreatePost = () => {

    const [ text, setText ] = useState("");
    const [ vocal, setVocal ] = useState(null);
    const [ legend, setLegend ] = useState(null);

    const { poster_id, user_id } = useLocalSearchParams();

    useEffect(() => {
        console.log("Poster ID: ", poster_id);
        console.log("User ID: ", user_id);
        // Here you can add logic to handle the creation of a post
        // For example, you might want to fetch user data or initialize a form
    }, []);

    useEffect(() => {
        console.log("Legend changed: ", legend);
    },[legend]);

    


    return (
        <Box style={{flex:1}}>
            <Box style={{ flex:1, height:"100%", justifyContent:"center", alignItems:"center", borderBottomWidth:1, borderColor:"grey", boxShadow:"0px 6px 12px rgba(0,0,0,0.1)" }}>
                <Text
                    size="3xl"
                >
                    Create a Post
                </Text>

            </Box>
            <ImagePostSelector />
            <Box style={{flex:4, height:"100%", padding:10, borderTopWidth:1, borderColor:"grey", boxShadow:"0px 1px 8px rgba(0,0,0,0.7)"}}> 
                {/* TEXT INPUT ZONE */}
                {legend === "text" ? 
                <>
                    <Textarea
                    size="md"
                    borderWidth={1}
                    borderColor="$borderLight"
                    borderRadius="$lg"
                    height="$20" // 👈 Ensures 5 lines are visible
                    p="$3"
                    >
                        <TextareaInput
                            placeholder="Type your message here..."
                            multiline
                            textAlignVertical="top" // 👈 Ensures text starts at top
                            />
                    </Textarea>
                    <Box style={{justifyContent: 'center', alignItems: 'center'}}>
                        <TouchableOpacity onPress={() => { setLegend(null) }}>
                            <Ionicons name="close-circle" size={46} color={"black"}/>
                        </TouchableOpacity>
                    </Box>
                </>
                :
                <>
                    {legend === "vocal" ? 
                    <Box style={{justifyContent: 'center', alignItems: 'center'}}>
                        <TouchableOpacity style={{ borderColor:'rgba(127,127,127,0.6)', borderWidth:3, padding:22, borderRadius:70 }}
                                    onPress={() => setLegend("vocal")}>
                                        <Ionicons name="mic-outline" size={70} color="rgba(127,127,127,0.8)" />
                                    </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setLegend(null) }}>
                            <Ionicons name="close-circle" size={46} color={"black"}/>
                        </TouchableOpacity>
                    </Box>
                    :
                    <Box style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                        <HStack space={"xl"}>
                            <Box>
                                <TouchableOpacity style={{ borderColor:'rgba(127,127,127,0.6)', borderWidth:3, padding:22, borderRadius:10 }} 
                                onPress={() => setLegend("text")}>
                                    <Ionicons name="text-outline" size={70} color="rgba(127,127,127,0.8)" />
                                </TouchableOpacity>
                            </Box>
                            <Box>
                                <TouchableOpacity style={{ borderColor:'rgba(127,127,127,0.6)', borderWidth:3, padding:22, borderRadius:10 }}
                                onPress={() => setLegend("vocal")}>
                                    <Ionicons name="mic-outline" size={70} color="rgba(127,127,127,0.8)" />
                                </TouchableOpacity>
                            </Box>
                        </HStack>
                    </Box>
                    }
                </>
                }
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