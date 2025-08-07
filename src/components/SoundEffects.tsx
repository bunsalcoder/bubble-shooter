import React, { useEffect, useRef, useState } from 'react';

interface SoundEffectsProps {
  isMuted?: boolean;
}

const SoundEffects: React.FC<SoundEffectsProps> = ({ isMuted = false }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const popSoundRef = useRef<HTMLAudioElement | null>(null);
  const soundQueue = useRef<Array<{ sound: HTMLAudioElement; delay: number }>>([]);
  const isPlayingRef = useRef(false);

  // Initialize audio context and sound effects
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Create audio context for better control
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create pop sound element
        popSoundRef.current = new Audio('/bubble-shooter/audio/pop1.ogg');
        popSoundRef.current.preload = 'auto';
        popSoundRef.current.volume = 0.5; // Higher volume for sound effects
        
        // Handle audio loading
        popSoundRef.current.addEventListener('canplaythrough', () => {
          setIsLoaded(true);
          console.log('🔊 Pop sound loaded successfully');
        });
        
        // Handle audio errors
        popSoundRef.current.addEventListener('error', (e) => {
          console.error('❌ Pop sound loading error:', e);
        });
        
      } catch (error) {
        console.error('❌ Failed to initialize sound effects:', error);
      }
    };

    initAudio();

    // Cleanup on unmount
    return () => {
      if (popSoundRef.current) {
        popSoundRef.current.pause();
        popSoundRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Play pop sound for each bubble that breaks
  const playPopSound = async (count: number = 1) => {
    if (!popSoundRef.current || !isLoaded || isMuted) return;
    
    try {
      // Resume audio context if suspended (required for iOS)
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Play pop sound multiple times based on count
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          if (popSoundRef.current && !isMuted) {
            // Clone the audio element to play multiple sounds simultaneously
            const soundClone = popSoundRef.current.cloneNode() as HTMLAudioElement;
            soundClone.volume = 0.5;
            soundClone.play().catch(console.error);
            console.log(`🔊 Pop sound ${i + 1}/${count} played`);
          }
        }, i * 50); // 50ms delay between each pop sound
      }
      
    } catch (error) {
      console.error('❌ Failed to play pop sound:', error);
    }
  };

  // Play single pop sound
  const playSinglePop = async () => {
    await playPopSound(1);
  };

  // Expose methods globally for easy access
  useEffect(() => {
    (window as any).soundEffects = {
      playPopSound,
      playSinglePop,
      isLoaded: () => isLoaded
    };
  }, [isLoaded, isMuted]);

  return null; // This component doesn't render anything
};

export default SoundEffects; 