import { AudioPlayer } from 'expo-audio';

let currentPlayer: AudioPlayer | null = null;

export const AudioPlayerManager = {
  play(player: AudioPlayer) {
    if (currentPlayer && currentPlayer !== player) {
      currentPlayer.pause();
      currentPlayer.seekTo(0);
    }
    currentPlayer = player;
    player.play();
  },

  pause(player: AudioPlayer) {
    if (currentPlayer === player) {
      player.pause();
      currentPlayer = null;
    }
  },

  stop(player: AudioPlayer) {
    if (currentPlayer === player) {
      player.pause();
      player.seekTo(0);
      currentPlayer = null;
    }
  },
};
