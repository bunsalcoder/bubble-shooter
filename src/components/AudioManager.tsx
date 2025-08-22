import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { isAndroid } from 'react-device-detect';

interface AudioManagerProps {
    isMuted?: boolean;
    onVolumeChange?: (volume: number) => void;
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

const isIOS = () => {
    if (!isBrowser) return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const AudioManager = forwardRef<HTMLAudioElement, AudioManagerProps>(({
    isMuted = false,
    onVolumeChange
}, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(() => {
        if (!isBrowser) return 0.5; // Default for SSR
        if (isIOS()) {
            return 0.5; // 50% for iOS
        } else if (isAndroid) {
            return 0.5; // 50% for Android devices
        } else {
            return 0.5; // 50% for desktop
        }
    });
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const [wasPlayingBeforeBackground, setWasPlayingBeforeBackground] = useState(false);
    const [isPageVisible, setIsPageVisible] = useState(true);
    const [isPageFocused, setIsPageFocused] = useState(true);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const backgroundCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize audio context and background music
    useEffect(() => {
        if (!isBrowser) return;

        const initAudio = async () => {
            try {
                // Create audio context for better control
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

                const wakeUpAudioContext = async () => {
                    try {
                        if (audioContextRef.current?.state === 'suspended') {
                            await audioContextRef.current.resume();
                        }

                        if (audioContextRef.current) {
                            const silentBuffer = audioContextRef.current.createBuffer(1, 1, 22050);
                            const silentSource = audioContextRef.current.createBufferSource();
                            silentSource.buffer = silentBuffer;
                            silentSource.connect(audioContextRef.current.destination);
                            silentSource.start(0);
                            silentSource.stop(0.001);
                        }
                    } catch (error) {
                        console.error('Audio context wakeup failed:', error);
                    }
                };

                await wakeUpAudioContext();

                // Create audio element
                audioRef.current = new Audio('/bubble-shooter/audio/background-music.wav');
                audioRef.current.loop = true;
                audioRef.current.volume = volume;
                audioRef.current.preload = 'auto';

                // Handle audio loading
                audioRef.current.addEventListener('canplaythrough', () => {
                    setIsLoaded(true);
                    // Try to start music immediately after loading
                    if (!isMuted) {
                        startMusic();
                    }
                });

                // Handle audio errors
                audioRef.current.addEventListener('error', (e) => {
                    console.error('Background music error:', e);
                });

            } catch (error) {
                console.error('Audio initialization failed:', error);
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
                        // Try to start music after resuming
                        if (!isMuted && isLoaded) {
                            startMusic();
                        }
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
                    audioContextRef.current.resume();
                }

                // Start music if not muted
                if (!isMuted && isLoaded) {
                    startMusic();
                }
            }
        };

        // Try to enable audio immediately
        enableAudioImmediately();

        // Listen for user interactions - use capture to catch events early
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
                    if (!isMuted && isLoaded) {
                        startMusic();
                    }
                }).catch(() => {
                    // Silent error handling
                });
            }
        }, 1000);

        // Cleanup on unmount
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
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

    // Handle visibility change (tab switching, app switching)
    useEffect(() => {
        if (!isBrowser) return;

        const handleVisibilityChange = () => {
            const isVisible = !document.hidden;
            setIsPageVisible(isVisible);
            
            if (isVisible) {
                // Page became visible - resume audio if it was playing before
                if (wasPlayingBeforeBackground && !isMuted && hasUserInteracted) {
                    resumeMusic();
                    setWasPlayingBeforeBackground(false);
                }
            } else {
                // Page became hidden - pause audio and remember state
                if (isPlaying && !isMuted) {
                    setWasPlayingBeforeBackground(true);
                    pauseMusic();
                }
            }
        };

        // Handle page focus/blur (for when user switches between applications)
        const handleFocus = () => {
            setIsPageFocused(true);
            // Resume audio if it was playing before losing focus
            if (wasPlayingBeforeBackground && !isMuted && hasUserInteracted) {
                resumeMusic();
                setWasPlayingBeforeBackground(false);
            }
        };

        const handleBlur = () => {
            setIsPageFocused(false);
            // Pause audio when page loses focus
            if (isPlaying && !isMuted) {
                setWasPlayingBeforeBackground(true);
                pauseMusic();
            }
        };

        // Handle screen lock detection (for mobile devices)
        const handleScreenLock = () => {
            if (isPlaying && !isMuted) {
                setWasPlayingBeforeBackground(true);
                pauseMusic();
            }
        };

        const handleScreenUnlock = () => {
            if (wasPlayingBeforeBackground && !isMuted && hasUserInteracted) {
                resumeMusic();
                setWasPlayingBeforeBackground(false);
            }
        };

        // Set up visibility change listener
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Set up focus/blur listeners
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);
        
        // Set up screen lock detection for mobile devices
        if ('wakeLock' in navigator) {
            // Modern browsers with wake lock API
            let wakeLock: any = null;
            
            const requestWakeLock = async () => {
                try {
                    wakeLock = await (navigator as any).wakeLock.request('screen');
                    wakeLock.addEventListener('release', handleScreenLock);
                } catch (err) {
                    console.log('Wake Lock not supported');
                }
            };
            
            requestWakeLock();
            
            // Cleanup wake lock
            return () => {
                if (wakeLock) {
                    wakeLock.removeEventListener('release', handleScreenLock);
                    wakeLock.release();
                }
            };
        } else {
            // Fallback for older browsers - use user activity detection
            let lastActivity = Date.now();
            let isScreenLocked = false;
            
            const updateActivity = () => {
                lastActivity = Date.now();
                if (isScreenLocked) {
                    isScreenLocked = false;
                    handleScreenUnlock();
                }
            };
            
            const checkScreenLock = () => {
                const now = Date.now();
                if (now - lastActivity > 5000 && !isScreenLocked) { // 5 seconds of inactivity
                    isScreenLocked = true;
                    handleScreenLock();
                }
            };
            
            // Listen for user activity
            const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
            activityEvents.forEach(event => {
                document.addEventListener(event, updateActivity, true);
            });
            
            // Check for screen lock periodically
            backgroundCheckIntervalRef.current = setInterval(checkScreenLock, 1000);
            
            return () => {
                activityEvents.forEach(event => {
                    document.removeEventListener(event, updateActivity, true);
                });
                if (backgroundCheckIntervalRef.current) {
                    clearInterval(backgroundCheckIntervalRef.current);
                }
            };
        }

        // Cleanup function
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
            if (backgroundCheckIntervalRef.current) {
                clearInterval(backgroundCheckIntervalRef.current);
            }
        };
    }, [isPlaying, isMuted, hasUserInteracted, wasPlayingBeforeBackground]);

    // Forward the ref
    useEffect(() => {
        if (ref) {
            if (typeof ref === 'function') {
                ref(audioRef.current);
            } else {
                ref.current = audioRef.current;
            }
        }
    }, [audioRef.current]);

    // Handle mute/unmute
    useEffect(() => {
        if (audioRef.current && hasUserInteracted && isLoaded) {
            if (isMuted) {
                audioRef.current.pause();
                setIsPlaying(false);
                setWasPlayingBeforeBackground(false);
            } else {
                // Unmute - start music if not already playing and page is visible/focused
                if (!isPlaying && isPageVisible && isPageFocused) {
                    startMusic();
                }
            }
        }
    }, [isMuted, hasUserInteracted, isLoaded, isPageVisible, isPageFocused]);

    // Handle volume changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            onVolumeChange?.(volume);
        }
    }, [volume]);

    // Start background music
    const startMusic = async () => {
        if (!audioRef.current || !isLoaded) return;

        try {
            // Resume audio context if suspended (required for iOS)
            if (audioContextRef.current?.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            await audioRef.current.play();
            setIsPlaying(true);
            setWasPlayingBeforeBackground(false);
        } catch (error) {
            console.error('Failed to start music:', error);
        }
    };

    // Stop background music
    const stopMusic = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
            setWasPlayingBeforeBackground(false);
        }
    };

    // Pause background music
    const pauseMusic = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    // Resume background music
    const resumeMusic = () => {
        if (audioRef.current && !isMuted && isPageVisible && isPageFocused) {
            audioRef.current.play().catch(console.error);
            setIsPlaying(true);
        }
    };

    // Set volume
    const setMusicVolume = (newVolume: number) => {
        let clampedVolume = Math.max(0, Math.min(1, newVolume));
        if (isIOS()) {
            clampedVolume = Math.min(clampedVolume, 0.2);
        } else if (isAndroid) {
            // Allow higher volume for Android devices
            clampedVolume = Math.min(clampedVolume, 0.8);
        }
        
        // Apply volume to audio element immediately
        if (audioRef.current) {
            audioRef.current.volume = clampedVolume;
        }
        
        setVolume(clampedVolume);
    };

    // Enable audio context (for external calls)
    const enableAudio = () => {
        if (!hasUserInteracted) {
            setHasUserInteracted(true);
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
            if (!isMuted && isLoaded && isPageVisible && isPageFocused) {
                startMusic();
            }
        }
    };

    // Get current audio state
    const getAudioState = () => ({
        isPlaying,
        isLoaded,
        hasUserInteracted,
        isPageVisible,
        isPageFocused,
        wasPlayingBeforeBackground,
        isMuted,
        volume
    });

    // Expose methods globally for easy access
    useEffect(() => {
        if (!isBrowser) return;

        (window as any).audioManager = {
            startMusic,
            stopMusic,
            pauseMusic,
            resumeMusic,
            setVolume: setMusicVolume,
            isPlaying: () => isPlaying,
            isLoaded: () => isLoaded,
            hasUserInteracted: () => hasUserInteracted,
            enableAudio,
            getAudioState
        };

        return () => {
            // Clean up the global reference when component unmounts
            if ((window as any).audioManager) {
                delete (window as any).audioManager;
            }
        };
    }, [isPlaying, isLoaded, hasUserInteracted, isMuted, isPageVisible, isPageFocused, wasPlayingBeforeBackground]);

    return null;
});

AudioManager.displayName = 'AudioManager';
export default AudioManager;