import React, { useState } from 'react';
import { Alert, StyleSheet, View, AppState } from 'react-native';
import { supabase } from '../../libs/initSupabase';
import { Button, TextInput } from 'react-native';

AppState.addEventListener('change', (state) => {
    if(state === 'active') {
        supabase.auth.startAutoRefresh();
    }else{
        supabase.auth.stopAutoRefresh();
    }
});

export default function Auth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        console.log('SINGIN CLICK !');
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if(error) {Alert.alert(error.message);}
        setLoading(false);
        console.log('LOGIN FINISH');
    }

    async function signUpWithEmail() {
        setLoading(true);
        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) {Alert.alert(error.message);}
        if (!session) {Alert.alert('Please check yout inbox for email verification !');}
        setLoading(false);
    }

    return (
        <View style={styles.container}>
            <View style={[styles.verticallySpaced, styles.mt20]}>
                <TextInput
                onChangeText={(text: React.SetStateAction<string>) => setEmail(text)}
                value={email}
                placeholder="email@address.com"
                autoCapitalize={'none'}
                />
            </View>
            <View style={styles.verticallySpaced}>
                <TextInput
                onChangeText={(text: React.SetStateAction<string>) => setPassword(text)}
                value={password}
                secureTextEntry={true}
                placeholder="Password"
                autoCapitalize={'none'}
                />
            </View>
            <View style={[styles.verticallySpaced, styles.mt20]}>
                <Button title="Sign in" disabled={loading} onPress={() => signInWithEmail()} />
            </View>
            <View style={styles.verticallySpaced}>
                <Button title="Sign up" disabled={loading} onPress={() => signUpWithEmail()} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
      marginTop: 40,
      padding: 12,
    },
    verticallySpaced: {
      paddingTop: 4,
      paddingBottom: 4,
      alignSelf: 'stretch',
    },
    mt20: {
      marginTop: 20,
    },
  });
