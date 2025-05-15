import React from "react";
import { Text } from "react-native";
import { Image } from "@/components/ui/image";
import { Avatar as AvatarGStackUI, AvatarBadge, AvatarImage, AvatarFallbackText } from "@/components/ui/avatar";

export default function Avatar(){

    return(
        // <AvatarGStackUI size={"2xl"} >
        <AvatarGStackUI style={{width:150, height:150}} >
            <AvatarFallbackText>D</AvatarFallbackText>
            <AvatarImage source={{ uri: "https://picsum.photos/200" }} />
            {/* <AvatarImage source={{ uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlcnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60" }} /> */}
            {/* https://picsum.photos/200 */}
        </AvatarGStackUI>
    )
}

// export default function Avatar({ size = 50, imageUri, isOnline = false }) {

// }