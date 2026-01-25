import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { AudioPlayerManager } from './AudioPlayerManager';

type Props = {
  uri: string;
  theme?: 'light' | 'dark';
  playButtonPosition?: 'left' | 'right';
  haptic?: boolean;
};

const BAR_COUNT = 32;

export const AudioBubblePlayer = ({
  uri,
  theme = 'dark',
  playButtonPosition = 'left',
  haptic = true,
}: Props) => {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const duration = status.duration ?? 0;
  const currentTime = status.currentTime ?? 0;

  /* ---------- WAVEFORM (stable) ---------- */
  const bars = useRef(
    Array.from({ length: BAR_COUNT }, () =>
      Math.random() * 18 + 6
    )
  ).current;

  /* ---------- ANIMATION LOGIC ---------- */
  const stepDuration =
    duration > 0 ? duration / BAR_COUNT : 0;

  let activeBars =
    stepDuration > 0
      ? Math.min(
          BAR_COUNT,
          Math.floor(currentTime / stepDuration)
        )
      : 0;

  /* ---------- RESET AUDIO + ANIMATION ---------- */
  useEffect(() => {
    
    if(status.didJustFinish){
        AudioPlayerManager.stop(player);
        player.seekTo(0);
        player.pause();
        activeBars = 0;
    }
  }, [currentTime, duration]);

  /* ---------- PLAY / PAUSE ---------- */
  const togglePlay = () => {
    if (haptic) {
      Haptics.impactAsync(
        Haptics.ImpactFeedbackStyle.Light
      );
    }

    status.playing
      ? AudioPlayerManager.pause(player)
      : AudioPlayerManager.play(player);
  };

  /* ---------- TIME ---------- */
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const remaining = Math.max(duration - currentTime, 0);
  const colors = themeColors[theme];

  return (
    <View style={[styles.bubble, { backgroundColor: colors.bubble }]}>
      {playButtonPosition === 'left' && (
        <PlayButton
          playing={status.playing}
          onPress={togglePlay}
          color={colors.button}
        />
      )}

      <View style={styles.center}>
        <View style={styles.waveform}>
          {bars.map((h, i) => (
            <View
              key={i}
              style={{
                width: 3,
                height: h,
                marginHorizontal: 1,
                borderRadius: 2,
                backgroundColor:
                  i < activeBars
                    ? colors.progress
                    : colors.progressBg,
              }}
            />
          ))}
        </View>

        <View style={styles.timeRow}>
          <Text style={[styles.time, { color: colors.text }]}>
            -{formatTime(remaining)}
          </Text>
          <Text style={[styles.time, { color: colors.text }]}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      {playButtonPosition === 'right' && (
        <PlayButton
          playing={status.playing}
          onPress={togglePlay}
          color={colors.button}
        />
      )}
    </View>
  );
};

/* ---------- PLAY BUTTON ---------- */
const PlayButton = ({
  playing,
  onPress,
  color,
}: {
  playing: boolean;
  onPress: () => void;
  color: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.playBtn, { backgroundColor: color }]}
  >
    <Ionicons
      name={playing ? 'pause' : 'play'}
      size={20}
      color="#fff"
    />
  </TouchableOpacity>
);

/* ---------- THEMES ---------- */
const themeColors = {
  dark: {
    bubble: '#1F2937',
    text: '#F9FAFB',
    progress: '#60A5FA',
    progressBg: '#374151',
    button: '#111827',
  },
  light: {
    bubble: '#F3F4F6',
    text: '#111827',
    progress: '#2563EB',
    progressBg: '#D1D5DB',
    button: '#2563EB',
  },
};

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 18,
    maxWidth: '85%',
    marginVertical: 6,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    marginHorizontal: 10,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  time: {
    fontSize: 11,
  },
});
