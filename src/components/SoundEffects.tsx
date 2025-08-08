import React, { useEffect, useRef, useState } from 'react';

interface SoundEffectsProps {
  isMuted?: boolean;
}

const SoundEffects: React.FC<SoundEffectsProps> = ({ isMuted = false }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const popSoundRef = useRef<HTMLAudioElement | null>(null);
  const gameWinSoundRef = useRef<HTMLAudioElement | null>(null);
  const gameOverSoundRef = useRef<HTMLAudioElement | null>(null);
  const soundQueue = useRef<Array<{ sound: HTMLAudioElement; delay: number }>>([]);
  const isPlayingRef = useRef(false);

  // Check if we're on iOS
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };

  // Get pop sound volume based on device
  const getPopSoundVolume = () => {
    return isIOS() ? 0.9 : 0.7; // Higher volume for iOS
  };

  // Initialize audio context and sound effects
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Create audio context for better control
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

        // iOS-specific audio context initialization
        const initializeAudioForIOS = async () => {
          try {
            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
              await audioContextRef.current.resume();
            }

            // Create a silent buffer to ensure audio context is active on iOS
            if (audioContextRef.current) {
              const silentBuffer = audioContextRef.current.createBuffer(1, 1, 22050);
              const silentSource = audioContextRef.current.createBufferSource();
              silentSource.buffer = silentBuffer;
              silentSource.connect(audioContextRef.current.destination);
              silentSource.start(0);
              silentSource.stop(0.001);
            }
          } catch (error) {
            // Silent error handling
          }
        };

        // Initialize audio context immediately
        await initializeAudioForIOS();

        // Create pop sound element
        popSoundRef.current = new Audio('/bubble-shooter/audio/pop.wav');
        popSoundRef.current.preload = 'auto';
        popSoundRef.current.volume = getPopSoundVolume(); // Dynamic volume based on device

        // Create game win sound element
        gameWinSoundRef.current = new Audio('/bubble-shooter/audio/gamewin.mp3');
        gameWinSoundRef.current.preload = 'auto';
        gameWinSoundRef.current.volume = 0.8; // Higher volume for win sound

        // Create game over sound element
        gameOverSoundRef.current = new Audio('/bubble-shooter/audio/gameover.wav');
        gameOverSoundRef.current.preload = 'auto';
        gameOverSoundRef.current.volume = 0.8; // Higher volume for game over sound

        // Handle audio loading
        let loadedCount = 0;
        const totalSounds = 3;

        const checkAllLoaded = () => {
          loadedCount++;
          if (loadedCount === totalSounds) {
            setIsLoaded(true);
            // Try to enable audio immediately after loading
            enableAudioImmediately();
          }
        };

        popSoundRef.current.addEventListener('canplaythrough', () => {
          checkAllLoaded();
        });

        gameWinSoundRef.current.addEventListener('canplaythrough', () => {
          checkAllLoaded();
        });

        gameOverSoundRef.current.addEventListener('canplaythrough', () => {
          checkAllLoaded();
        });

        // Handle audio errors
        popSoundRef.current.addEventListener('error', (e) => {
          checkAllLoaded();
        });

        gameWinSoundRef.current.addEventListener('error', (e) => {
          checkAllLoaded();
        });

        gameOverSoundRef.current.addEventListener('error', (e) => {
          checkAllLoaded();
        });

      } catch (error) {
        // Silent error handling
      }
    };

    initAudio();

    // Try to enable audio immediately
    const enableAudioImmediately = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);

        // Resume audio context if suspended
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            // Audio context resumed successfully
          }).catch(() => {
            // Silent error handling
          });
        }
      }
    };

    // Try to enable audio on various events
    const enableAudioOnInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);

        // Resume audio context if suspended
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            // Audio context resumed for sound effects
          }).catch(() => {
            // Silent error handling
          });
        }
      }
    };

    // Try to enable audio immediately
    enableAudioImmediately();

    // Listen for user interactions - use capture to catch events early
    // Include both mouse and touch events for mobile compatibility
    const events = [
      'click', 'touchstart', 'touchend', 'touchmove',
      'keydown', 'mousedown', 'mousemove', 'scroll',
      'pointerdown', 'pointerup', 'pointermove'
    ];
    events.forEach(event => {
      document.addEventListener(event, enableAudioOnInteraction, { capture: true });
    });

    // Also try to enable audio periodically
    const audioCheckInterval = setInterval(() => {
      if (!hasUserInteracted && audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          setHasUserInteracted(true);
        }).catch(() => {
          // Silent error handling
        });
      }
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (popSoundRef.current) {
        popSoundRef.current.pause();
        popSoundRef.current = null;
      }
      if (gameWinSoundRef.current) {
        gameWinSoundRef.current.pause();
        gameWinSoundRef.current = null;
      }
      if (gameOverSoundRef.current) {
        gameOverSoundRef.current.pause();
        gameOverSoundRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      // Remove event listeners
      events.forEach(event => {
        document.removeEventListener(event, enableAudioOnInteraction);
      });

      clearInterval(audioCheckInterval);
    };
  }, []);

  // Ensure audio context is resumed before playing any sound
  const ensureAudioContextReady = async () => {
    // Always try to resume audio context, even if no user interaction
    if (audioContextRef.current?.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
        setHasUserInteracted(true);
      } catch (error) {
        return false;
      }
    }

    return true;
  };

  // Play pop sound for each bubble that breaks
  const playPopSound = async (count: number = 1) => {
    if (!popSoundRef.current || !isLoaded || isMuted) return;

    // Always try to ensure audio context is ready
    const audioReady = await ensureAudioContextReady();

    try {
      // For iOS, try multiple approaches to play the sound
      if (isIOS()) {
        // Try to play the sound directly first
        for (let i = 0; i < count; i++) {
          setTimeout(async () => {
            if (popSoundRef.current && !isMuted) {
              try {
                // Reset the audio element for iOS
                popSoundRef.current.currentTime = 0;
                await popSoundRef.current.play();
              } catch (error) {
                // Fallback: try cloning the audio element
                try {
                  const soundClone = popSoundRef.current.cloneNode() as HTMLAudioElement;
                  soundClone.volume = getPopSoundVolume();
                  soundClone.currentTime = 0;
                  await soundClone.play();
                } catch (cloneError) {
                  // Silent error handling
                }
              }
            }
          }, i * 50); // 50ms delay between each pop sound
        }
      } else {
        // Non-iOS devices use the original method
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            if (popSoundRef.current && !isMuted) {
              // Clone the audio element to play multiple sounds simultaneously
              const soundClone = popSoundRef.current.cloneNode() as HTMLAudioElement;
              soundClone.volume = getPopSoundVolume();
              soundClone.play().catch(() => {
                // Silent error handling
              });
            }
          }, i * 50); // 50ms delay between each pop sound
        }
      }

    } catch (error) {
      // Silent error handling
    }
  };

  // Play single pop sound
  const playSinglePop = async () => {
    await playPopSound(1);
  };

  // Play game win sound
  const playGameWinSound = async () => {
    if (!gameWinSoundRef.current || !isLoaded || isMuted) return;

    // Always try to ensure audio context is ready
    const audioReady = await ensureAudioContextReady();

    try {
      // Stop any currently playing win sound
      gameWinSoundRef.current.pause();
      gameWinSoundRef.current.currentTime = 0;

      // Play the win sound
      await gameWinSoundRef.current.play();

    } catch (error) {
      // Silent error handling
    }
  };

  // Stop game win sound
  const stopGameWinSound = () => {
    if (gameWinSoundRef.current) {
      gameWinSoundRef.current.pause();
      gameWinSoundRef.current.currentTime = 0;
    }
  };

  // Play game over sound
  const playGameOverSound = async () => {
    if (!gameOverSoundRef.current || !isLoaded || isMuted) return;

    // Always try to ensure audio context is ready
    const audioReady = await ensureAudioContextReady();

    try {
      // Stop any currently playing game over sound
      gameOverSoundRef.current.pause();
      gameOverSoundRef.current.currentTime = 0;

      // Play the game over sound
      await gameOverSoundRef.current.play();

    } catch (error) {
      // Silent error handling
    }
  };

  // Expose methods globally for easy access
  useEffect(() => {
    (window as any).soundEffects = {
      playPopSound,
      playSinglePop,
      playGameWinSound,
      stopGameWinSound,
      playGameOverSound,
      isLoaded: () => isLoaded,
      hasUserInteracted: () => hasUserInteracted,
      enableAudio: () => {
        if (!hasUserInteracted) {
          setHasUserInteracted(true);
          if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
          }
        }
      }
    };
  }, [isLoaded, isMuted, hasUserInteracted]);

  return null; // This component doesn't render anything
};

export default SoundEffects; 