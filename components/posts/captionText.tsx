import React, { useState } from "react";
import { TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { useUserContext } from "@/contexts/userContext";

export default function CaptionSection({ caption }: { caption?: string }) {
  const [expanded, setExpanded] = useState(false);

  if (!caption) return null;
  const { theme } = useUserContext();

  const styles = StyleSheet.create({
          captionText:{
              paddingHorizontal:12,
              textAlignVertical:"bottom",
              color: theme.textColor1,
              fontWeight:"200"
          },
      });

  return (
    <Box id="caption-section" style={{ marginTop: 8 }}>
        {expanded ? (
            <ScrollView
            style={{
                maxHeight: 60, // limit expanded height
                // paddingHorizontal: 4,
            }}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setExpanded(!expanded)}
            >
                <Text style={styles.captionText}>{caption}</Text>
            </TouchableOpacity>
            </ScrollView>
        ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setExpanded(!expanded)}
            >

            <Text
                numberOfLines={2}
                ellipsizeMode="tail"
                style={styles.captionText}
                >
                {caption}
            </Text>
        </TouchableOpacity>
        )}
    </Box>
  );
}
