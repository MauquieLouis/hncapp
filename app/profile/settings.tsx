import React from 'react';
import { StyleSheet } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { useUserContext } from '@/contexts/userContext';
import { Radio, RadioGroup, RadioIndicator, RadioLabel, RadioIcon} from "@/components/ui/radio"

const SettingsScreen = () => {

    const { profile, theme } = useUserContext();
    
    const styles = StyleSheet.create({
        container:{
            backgroundColor:theme.backgroundColor1,
            flex:1
        },
        section:{
            padding:16,
            borderBottomWidth:1,
            borderBottomColor:theme.borderColorLight,
            width:"90%",
            marginLeft:"5%",
        }
    });

    return (
        <Box style={styles.container}>
            <Box style={styles.section}>
                <Text style={{color:theme.textColor1}}>Theme</Text>
                <RadioGroup>
                    <HStack space="2xl">
                        <Radio value="light" size="md" isInvalid={false} isDisabled={false}>
                            <RadioIndicator/>
                            <RadioLabel>LIGHT</RadioLabel>
                        </Radio>
                        <Radio value="dark" size="md" isInvalid={false} isDisabled={false}>
                            <RadioIndicator/>
                            <RadioLabel>DARK</RadioLabel>
                        </Radio>
                        <Radio value="pink" size="md" isInvalid={false} isDisabled={false}>
                            <RadioIndicator/>
                            <RadioLabel>PINK</RadioLabel>
                        </Radio>
                        <Radio value="white" size="md" isInvalid={false} isDisabled={false}>
                            <RadioIndicator/>
                            <RadioLabel>WHITE</RadioLabel>
                        </Radio>
                    </HStack>
                    <HStack space="2xl">
                        <Radio value="black" size="md" isInvalid={false} isDisabled={false}>
                            <RadioIndicator/>
                            <RadioLabel>BLACK</RadioLabel>
                        </Radio>
                        <Radio value="default" size="md" isInvalid={false} isDisabled={false}>
                            <RadioIndicator/>
                            <RadioLabel>DEFAULT</RadioLabel>
                        </Radio>
                    </HStack>
                </RadioGroup>
            </Box>
        </Box>
    )


}

export default SettingsScreen;
