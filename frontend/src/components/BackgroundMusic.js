import React, { useState, useRef, useEffect } from 'react';
import './Dashboard.css';

// Import local file
import bgmFile from '../assets/bgm.mp3'; 

function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio(bgmFile));

  useEffect(() => {
    audioRef.current.loop = true;
    audioRef.current.volume = 0.2; 
    return () => {
      audioRef.current.pause();
    };
  }, []);

  const toggleMusic = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.log("Playback blocked:", e));
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={`music-player-minimal ${isPlaying ? 'active' : ''}`} onClick={toggleMusic}>
      {/* Icon: Play or Pause */}
      <span className="music-icon">
        {isPlaying ? '⏸' : '▶'}
      </span>
      
      {/* Visualizer Bars */}
      <div className={`music-wave-mini ${isPlaying ? 'playing' : ''}`}>
        <span></span><span></span><span></span>
      </div>
    </div>
  );
}

export default BackgroundMusic;