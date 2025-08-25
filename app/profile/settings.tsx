import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { useUserContext } from '@/contexts/userContext';
import { Radio, RadioGroup, RadioIndicator, RadioLabel, RadioIcon} from "@/components/ui/radio"
import Svg, { Polygon } from 'react-native-svg';
import { Button, ButtonText } from '@/components/ui/button';


const SettingsScreen = () => {

    const [ values, setValues ] = useState("dark")

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
        },
        radioIconStyle:{
            width:24,
            height:24,
            borderRadius:5,
            borderColor:"rgba(0,0,0,0.2)",
            borderWidth:1
        },
        radioGroup:{
            marginTop:12
        },
        sectionTitle:{
            color:theme.textColor1,
            fontSize:18,
            fontWeight:"600",
        },
        sectionSubTitle:{
            color:theme.textColor2,
            fontSize:16,
            marginVertical:10
        }
    });

    interface RadionIconColorProps {
        _color1: string;
        _color2: string;
    }

    const RadionIconColor: React.FC<RadionIconColorProps> = ({_color1, _color2}) => {
        return (
            <Box style={[styles.radioIconStyle, {backgroundColor:_color1}]}>
                <Box>
                    <Svg width="100%" height="100%" viewBox="0 0 100 100">
                        <Polygon
                        points="100,25 100,70 70,100 25,100"
                        fill={_color2}
                        />
                    </Svg>
                </Box>
            </Box>
        )
    }

    return (
        <Box style={styles.container}>
            <Box style={styles.section}>
                <Text style={styles.sectionTitle}>Select your theme</Text>
                <RadioGroup value={values} onChange={setValues} style={styles.radioGroup}>
                    <HStack space="2xl">
                        <Radio value="light" size="md" isInvalid={false} isDisabled={false}>
                            <RadioIndicator/>
                            <RadioLabel>
                                <RadionIconColor _color1="#fafaf9" _color2="#4c1d95"/>
                            </RadioLabel>
                        </Radio>
                        <Radio value="dark" size="md" isInvalid={false} isDisabled={false}>
                            <RadioIndicator/>
                            <RadioLabel>
                                <RadionIconColor _color1="#111827" _color2="#d8b4fe"/>
                            </RadioLabel>
                        </Radio>
                        <Radio value="pink" size="md" isInvalid={false} isDisabled={false}>
                            <RadioIndicator/>
                            <RadioLabel>
                                <RadionIconColor _color1="#fafaf9" _color2="#6b21a8"/>
                            </RadioLabel>
                        </Radio>
                        <Radio value="white" size="md" isInvalid={false} isDisabled={false}>
                            <RadioIndicator/>
                            <RadioLabel>
                                <RadionIconColor _color1="#fafafa" _color2="#27272a"/>
                            </RadioLabel>
                        </Radio>
                    </HStack>
                    <HStack space="2xl">
                        <Radio value="black" size="md" isInvalid={false} isDisabled={false}>
                            <RadioIndicator/>
                            <RadioLabel>
                                <RadionIconColor _color1="#18181b" _color2="#e2e8f0"/>
                            </RadioLabel>
                        </Radio>
                        <Radio value="default" size="md" isInvalid={false} isDisabled={false}>
                            <RadioIndicator/>
                            <RadioLabel>DEFAULT</RadioLabel>
                        </Radio>
                    </HStack>
                </RadioGroup>
            </Box>
            <Box style={styles.section}>
                <Text style={styles.sectionTitle}>Edit your data</Text>
                <Text style={styles.sectionSubTitle}>Email</Text>
                <Text style={styles.sectionSubTitle}>Username</Text>
                <Button><ButtonText>SAVE</ButtonText></Button>
            </Box>
            <Box style={styles.section}>
                <Text style={styles.sectionTitle}>Delete your account</Text>
            </Box>
        </Box>
    )


}

export default SettingsScreen;
