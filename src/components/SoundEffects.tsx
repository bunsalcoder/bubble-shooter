import React, { useEffect, useRef, useState } from 'react';

interface SoundEffectsProps {
  isMuted?: boolean;
  backgroundMusicRef?: React.RefObject<HTMLAudioElement>;
}

const SoundEffects: React.FC<SoundEffectsProps> = ({ 
  isMuted = false, 
  backgroundMusicRef 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const popSoundRef = useRef<HTMLAudioElement | null>(null);
  const gameWinSoundRef = useRef<HTMLAudioElement | null>(null);
  const gameOverSoundRef = useRef<HTMLAudioElement | null>(null);

  const isIOS = () => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };

  const getSoundVolumes = () => {
    return isIOS() ? {
      pop: 1.0,       // Max volume for pop sounds on iOS
      win: 1.0,      // Max volume for win sound on iOS
      over: 1.0,      // Max volume for game over on iOS
      background: 0.005 // Extremely low background music volume on iOS
    } : {
      pop: 0.7,
      win: 0.8,
      over: 0.8,
      background: 0.15
    };
  };

  const adjustBackgroundMusic = () => {
    if (backgroundMusicRef?.current) {
      const volumes = getSoundVolumes();
      backgroundMusicRef.current.volume = volumes.background;
    }
  };

  useEffect(() => {
    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Initialize audio context for iOS
        const initializeAudioForIOS = async () => {
          try {
            if (audioContextRef.current?.state === 'suspended') {
              await audioContextRef.current.resume();
            }

            // Create silent buffer to ensure audio context is active on iOS
            if (audioContextRef.current) {
              const silentBuffer = audioContextRef.current.createBuffer(1, 1, 22050);
              const silentSource = audioContextRef.current.createBufferSource();
              silentSource.buffer = silentBuffer;
              silentSource.connect(audioContextRef.current.destination);
              silentSource.start(0);
              silentSource.stop(0.001);
            }
          } catch (error) {
            console.error('iOS audio init failed:', error);
          }
        };

        await initializeAudioForIOS();

        // Create sound effects
        popSoundRef.current = new Audio('/bubble-shooter/audio/pop.wav');
        popSoundRef.current.preload = 'auto';
        popSoundRef.current.volume = getSoundVolumes().pop;

        gameWinSoundRef.current = new Audio('/bubble-shooter/audio/gamewin.wav');
        gameWinSoundRef.current.preload = 'auto';
        gameWinSoundRef.current.volume = getSoundVolumes().win;

        gameOverSoundRef.current = new Audio('/bubble-shooter/audio/gamelose.wav');
        gameOverSoundRef.current.preload = 'auto';
        gameOverSoundRef.current.volume = getSoundVolumes().over;

        adjustBackgroundMusic();

        // Handle loading
        let loadedCount = 0;
        const totalSounds = 3;

        const checkAllLoaded = () => {
          loadedCount++;
          if (loadedCount === totalSounds) {
            setIsLoaded(true);
          }
        };

        [popSoundRef, gameWinSoundRef, gameOverSoundRef].forEach(ref => {
          ref.current?.addEventListener('canplaythrough', checkAllLoaded);
          ref.current?.addEventListener('error', checkAllLoaded);
        });

      } catch (error) {
        console.error('Sound effects init failed:', error);
      }
    };

    initAudio();

    const enableAudioOnInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume().catch(console.error);
        }
      }
    };

    const events = [
      'click', 'touchstart', 'touchend', 'touchmove',
      'keydown', 'mousedown', 'mousemove', 'scroll',
      'pointerdown', 'pointerup', 'pointermove'
    ];
    events.forEach(event => {
      document.addEventListener(event, enableAudioOnInteraction, { capture: true });
    });

    return () => {
      [popSoundRef, gameWinSoundRef, gameOverSoundRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current = null;
        }
      });
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      events.forEach(event => {
        document.removeEventListener(event, enableAudioOnInteraction);
      });
    };
  }, []);

  const ensureAudioContextReady = async () => {
    if (audioContextRef.current?.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
        setHasUserInteracted(true);
        return true;
      } catch (error) {
        return false;
      }
    }
    return true;
  };

  const playPopSound = async (count: number = 1) => {
    if (!popSoundRef.current || !isLoaded || isMuted) return;
    await ensureAudioContextReady();

    try {
      if (isIOS()) {
        // iOS requires fresh audio elements for each sound to prevent conflicts
        for (let i = 0; i < count; i++) {
          setTimeout(async () => {
            if (!isMuted) {
              try {
                // Create a fresh audio element for each pop sound on iOS
                const freshAudio = new Audio('/bubble-shooter/audio/pop.wav');
                freshAudio.volume = getSoundVolumes().pop;
                freshAudio.currentTime = 0;
                await freshAudio.play();
              } catch (error) {
                console.error('Failed to play pop sound on iOS:', error);
              }
            }
          }, i * 80); // Slightly longer delay for iOS to prevent audio conflicts
        }
      } else {
        // Non-iOS devices
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            if (popSoundRef.current && !isMuted) {
              const soundClone = popSoundRef.current.cloneNode() as HTMLAudioElement;
              soundClone.volume = getSoundVolumes().pop;
              soundClone.play().catch(console.error);
            }
          }, i * 50);
        }
      }
    } catch (error) {
      console.error('Pop sound failed:', error);
    }
  };

  const playSinglePop = async () => {
    await playPopSound(1);
  };

  const playGameWinSound = async () => {
    if (!gameWinSoundRef.current || !isLoaded || isMuted) return;
    await ensureAudioContextReady();

    try {
      gameWinSoundRef.current.pause();
      gameWinSoundRef.current.currentTime = 0;
      gameWinSoundRef.current.volume = getSoundVolumes().win;
      await gameWinSoundRef.current.play();
    } catch (error) {
      console.error('Win sound failed:', error);
    }
  };

  const stopGameWinSound = () => {
    if (gameWinSoundRef.current) {
      gameWinSoundRef.current.pause();
      gameWinSoundRef.current.currentTime = 0;
    }
  };

  const playGameOverSound = async () => {
    if (!gameOverSoundRef.current || !isLoaded || isMuted) return;
    await ensureAudioContextReady();

    try {
      gameOverSoundRef.current.pause();
      gameOverSoundRef.current.currentTime = 0;
      gameOverSoundRef.current.volume = getSoundVolumes().over;
      await gameOverSoundRef.current.play();
    } catch (error) {
      console.error('Game over sound failed:', error);
    }
  };

  const enableAudio = () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    }
  };

  // Expose methods globally
  useEffect(() => {
    (window as any).soundEffects = {
      playPopSound,
      playSinglePop,
      playGameWinSound,
      stopGameWinSound,
      playGameOverSound,
      isLoaded: () => isLoaded,
      hasUserInteracted: () => hasUserInteracted,
      enableAudio
    };

    return () => {
      // Clean up the global reference when component unmounts
      if ((window as any).soundEffects) {
        delete (window as any).soundEffects;
      }
    };
  }, [isLoaded, isMuted, hasUserInteracted]);

  return null;
};

export default SoundEffects;