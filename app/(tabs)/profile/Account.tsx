import React, { useState, useEffect } from 'react';
import { supabase } from '../../../libs/initSupabase';
import { StyleSheet, View, Alert, Button, TextInput} from 'react-native';
import { useUserContext } from '../../../contexts/userContext';

export default function Account() {

  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const { session } = useUserContext();


  useEffect(() => {
    if (session) {getProfile();}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);



  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) {throw new Error('No user on the session!');}
      const { data, error, status } = await supabase
        .from('profiles')
        .select('username, profile_picture_url')
        .eq('user_id', session?.user.id)
        .single();
      if (error && status !== 406) {
        throw error;
      }
      if (data) {
        setUsername(data.username);
        setAvatarUrl(data.profile_picture_url);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile({
    // eslint-disable-next-line @typescript-eslint/no-shadow
    username,
    avatar_url,
  }: {
    username: string
    avatar_url: string
  }) {
    try {
      setLoading(true);
      if (!session?.user) {throw new Error('No user on the session!');}

      const updates = {
        id: session?.user.id,
        username,
        avatar_url,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

    return (
        <View style={styles.container}>
            <View style={[styles.verticallySpaced, styles.mt20]}>
                <TextInput placeholder="Email" value={session?.user?.email} disabled />
            </View>
            <View style={styles.verticallySpaced}>
                <TextInput placeholder="Username" value={username || ''} onChangeText={(text) => setUsername(text)} />
            </View>
            <View style={[styles.verticallySpaced, styles.mt20]}>
                <Button
                    title={loading ? 'Loading ...' : 'Update'}
                    onPress={() => updateProfile({ username, avatar_url: avatarUrl })}
                    disabled={loading}
                />
            </View>
            <View style={styles.verticallySpaced}>
                <Button title="Sign Out" onPress={() => supabase.auth.signOut()} />
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
