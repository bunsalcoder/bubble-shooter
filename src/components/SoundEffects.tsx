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
              console.log('🔊 Audio context resumed for iOS');
            }
            
            // Create a silent buffer to ensure audio context is active on iOS
            if (audioContextRef.current) {
              const silentBuffer = audioContextRef.current.createBuffer(1, 1, 22050);
              const silentSource = audioContextRef.current.createBufferSource();
              silentSource.buffer = silentBuffer;
              silentSource.connect(audioContextRef.current.destination);
              silentSource.start(0);
              silentSource.stop(0.001);
              
              console.log('🔊 Silent buffer created for iOS audio context');
            }
          } catch (error) {
            console.log('⚠️ Could not initialize iOS audio context:', error);
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
            console.log('🔊 All sound effects loaded successfully');
            // Try to enable audio immediately after loading
            enableAudioImmediately();
          }
        };
        
        popSoundRef.current.addEventListener('canplaythrough', () => {
          console.log('🔊 Pop sound loaded successfully');
          checkAllLoaded();
        });
        
        gameWinSoundRef.current.addEventListener('canplaythrough', () => {
          console.log('🔊 Game win sound loaded successfully');
          checkAllLoaded();
        });
        
        gameOverSoundRef.current.addEventListener('canplaythrough', () => {
          console.log('🔊 Game over sound loaded successfully');
          checkAllLoaded();
        });
        
        // Handle audio errors
        popSoundRef.current.addEventListener('error', (e) => {
          console.error('❌ Pop sound loading error:', e);
          checkAllLoaded();
        });
        
        gameWinSoundRef.current.addEventListener('error', (e) => {
          console.error('❌ Game win sound loading error:', e);
          checkAllLoaded();
        });
        
        gameOverSoundRef.current.addEventListener('error', (e) => {
          console.error('❌ Game over sound loading error:', e);
          checkAllLoaded();
        });
        
      } catch (error) {
        console.error('❌ Failed to initialize sound effects:', error);
      }
    };

    initAudio();

    // Try to enable audio immediately
    const enableAudioImmediately = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        console.log('🔊 Attempting to enable audio immediately');

        // Resume audio context if suspended
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            console.log('🔊 Audio context resumed successfully');
          }).catch(console.error);
        }
      }
    };

    // Try to enable audio on various events
    const enableAudioOnInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        console.log('👆 User interaction detected, sound effects enabled');

        // Resume audio context if suspended
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            console.log('🔊 Audio context resumed for sound effects');
          }).catch(console.error);
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
        console.log('🔄 Periodic audio context resume attempt');
        audioContextRef.current.resume().then(() => {
          setHasUserInteracted(true);
          console.log('🔊 Audio context resumed via periodic check');
        }).catch(console.error);
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
        console.log('🔊 Audio context resumed for sound effects');
        setHasUserInteracted(true);
      } catch (error) {
        console.error('❌ Failed to resume audio context:', error);
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
    if (!audioReady) {
      console.log('⚠️ Audio context not ready, but trying to play pop sound anyway');
    }
    
    try {
      // For iOS, try multiple approaches to play the sound
      if (isIOS()) {
        console.log('🍎 iOS detected, using special pop sound handling');
        
        // Try to play the sound directly first
        for (let i = 0; i < count; i++) {
          setTimeout(async () => {
            if (popSoundRef.current && !isMuted) {
              try {
                // Reset the audio element for iOS
                popSoundRef.current.currentTime = 0;
                await popSoundRef.current.play();
                console.log(`🔊 iOS Pop sound ${i + 1}/${count} played`);
              } catch (error) {
                console.error('❌ iOS pop sound failed, trying clone method:', error);
                
                                 // Fallback: try cloning the audio element
                 try {
                   const soundClone = popSoundRef.current.cloneNode() as HTMLAudioElement;
                   soundClone.volume = getPopSoundVolume();
                   soundClone.currentTime = 0;
                   await soundClone.play();
                   console.log(`🔊 iOS Pop sound ${i + 1}/${count} played (clone method)`);
                 } catch (cloneError) {
                   console.error('❌ iOS pop sound clone method also failed:', cloneError);
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
             soundClone.play().catch((error) => {
               console.error('❌ Failed to play pop sound:', error);
             });
              console.log(`🔊 Pop sound ${i + 1}/${count} played`);
            }
          }, i * 50); // 50ms delay between each pop sound
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to play pop sound:', error);
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
    if (!audioReady) {
      console.log('⚠️ Audio context not ready, but trying to play win sound anyway');
    }
    
    try {
      // Stop any currently playing win sound
      gameWinSoundRef.current.pause();
      gameWinSoundRef.current.currentTime = 0;
      
      // Play the win sound
      await gameWinSoundRef.current.play();
      console.log('🎉 Game win sound played');
      
    } catch (error) {
      console.error('❌ Failed to play game win sound:', error);
    }
  };

  // Stop game win sound
  const stopGameWinSound = () => {
    if (gameWinSoundRef.current) {
      gameWinSoundRef.current.pause();
      gameWinSoundRef.current.currentTime = 0;
      console.log('🔇 Game win sound stopped');
    }
  };

  // Play game over sound
  const playGameOverSound = async () => {
    if (!gameOverSoundRef.current || !isLoaded || isMuted) return;
    
    // Always try to ensure audio context is ready
    const audioReady = await ensureAudioContextReady();
    if (!audioReady) {
      console.log('⚠️ Audio context not ready, but trying to play game over sound anyway');
    }
    
    try {
      // Stop any currently playing game over sound
      gameOverSoundRef.current.pause();
      gameOverSoundRef.current.currentTime = 0;
      
      // Play the game over sound
      await gameOverSoundRef.current.play();
      console.log('💀 Game over sound played');
      
    } catch (error) {
      console.error('❌ Failed to play game over sound:', error);
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