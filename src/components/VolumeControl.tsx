import React, { useState, useEffect } from 'react';
import { useBackgroundAudio, useAudioState } from '@/hooks/useBackgroundAudio';

interface VolumeControlProps {
  className?: string;
  style?: React.CSSProperties;
}

const VolumeControl: React.FC<VolumeControlProps> = ({ className = '', style = {} }) => {
  const { setVolume, pauseMusic, resumeMusic } = useBackgroundAudio();
  const audioState = useAudioState();
  const [volume, setVolumeState] = useState(0.5);

  // Initialize volume from audio manager
  useEffect(() => {
    if (audioState.isLoaded && (window as any).audioManager) {
      // Get current volume from audio manager
      const currentVolume = (window as any).audioManager.getAudioState?.()?.volume || 0.5;
      setVolumeState(currentVolume);
    }
  }, [audioState.isLoaded]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolumeState(newVolume);
    
    // Apply volume change immediately
    if ((window as any).audioManager?.setVolume) {
      (window as any).audioManager.setVolume(newVolume);
    }
  };

  const handleMuteToggle = () => {
    if (audioState.isPlaying) {
      pauseMusic();
    } else {
      resumeMusic();
    }
  };

  const handleVolumeUp = () => {
    const newVolume = Math.min(1, volume + 0.1);
    setVolumeState(newVolume);
    
    // Apply volume change immediately
    if ((window as any).audioManager?.setVolume) {
      (window as any).audioManager.setVolume(newVolume);
    }
  };

  const handleVolumeDown = () => {
    const newVolume = Math.max(0, volume - 0.1);
    setVolumeState(newVolume);
    
    // Apply volume change immediately
    if ((window as any).audioManager?.setVolume) {
      (window as any).audioManager.setVolume(newVolume);
    }
  };

  return (
    <div 
      className={`volume-control ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '6px 10px',
        background: 'rgba(135, 206, 235, 0.1)',
        borderRadius: '10px',
        border: '1px solid rgba(135, 206, 235, 0.3)',
        backdropFilter: 'blur(10px)',
        ...style
      }}
    >
      {/* Mute/Unmute Button */}
      <button
        onClick={handleMuteToggle}
        style={{
          background: audioState.isPlaying 
            ? 'rgba(135, 206, 235, 0.9)'
            : 'rgba(135, 206, 235, 0.9)',
          color: 'white',
          borderRadius: '6px',
          padding: '6px 8px',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '28px',
          minHeight: '28px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.2)';
        }}
      >
        <span style={{ fontSize: '14px' }}>
          {audioState.isPlaying ? '🔊' : '🔇'}
        </span>
      </button>

      {/* Volume Controls Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flex: 1,
          minWidth: '0'
        }}
      >
        {/* Volume Down Button */}
        <button
          onClick={handleVolumeDown}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            padding: '3px 4px',
            cursor: 'pointer',
            fontSize: '9px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            minWidth: '18px',
            minHeight: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ➖
        </button>

        {/* Volume Display and Slider */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          flex: 1,
          minWidth: '0'
        }}>
          <span style={{ 
            color: 'white', 
            fontSize: '11px', 
            fontWeight: 'bold',
            minWidth: '30px',
            textAlign: 'center',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
          }}>
            {Math.round(volume * 100)}%
          </span>
          
          <div style={{ 
            position: 'relative',
            flex: 1,
            minWidth: '0'
          }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              style={{
                width: '100%',
                height: '5px',
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.2)',
                outline: 'none',
                cursor: 'pointer',
                WebkitAppearance: 'none',
                appearance: 'none'
              }}
            />
            <style jsx>{`
              input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: linear-gradient(135deg, #87CEEB, #4682B4);
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                transition: all 0.2s ease;
              }
              
              input[type="range"]::-webkit-slider-thumb:hover {
                transform: scale(1.2);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
              }
              
              input[type="range"]::-moz-range-thumb {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: linear-gradient(135deg, #87CEEB, #4682B4);
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                transition: all 0.2s ease;
              }
              
              input[type="range"]::-moz-range-thumb:hover {
                transform: scale(1.2);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
              }
              
              input[type="range"]::-moz-range-track {
                height: 5px;
                border-radius: 3px;
                background: rgba(255, 255, 255, 0.2);
                border: none;
              }
            `}</style>
          </div>
        </div>

        {/* Volume Up Button */}
        <button
          onClick={handleVolumeUp}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            padding: '3px 4px',
            cursor: 'pointer',
            fontSize: '9px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            minWidth: '18px',
            minHeight: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ➕
        </button>
      </div>
    </div>
  );
};

export default VolumeControl; 