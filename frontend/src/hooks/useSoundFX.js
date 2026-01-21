import { useCallback } from 'react';

// 1. Import Local Files
import coinFile from '../assets/coins.mp3';
import expenseFile from '../assets/expense.wav';
import levelUpFile from '../assets/levelup.mp3'; // <--- MAKE SURE THIS IS HERE

const SOUNDS = {
  coins: coinFile,
  expense: expenseFile,
  levelUp: levelUpFile // <--- AND MAPPED HERE
};

const useSoundFX = () => {
  const playSound = useCallback((type) => {
    const soundFile = SOUNDS[type];
    if (!soundFile) {
      console.warn(`Sound file for "${type}" not found.`);
      return;
    }

    const audio = new Audio(soundFile);
    audio.volume = 0.6; // Slightly louder

    audio.play().catch((error) => {
      // console.warn("Audio Playback Blocked:", error);
    });
  }, []);

  return playSound;
};

export default useSoundFX;