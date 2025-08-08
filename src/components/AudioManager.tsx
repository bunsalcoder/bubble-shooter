import React, { useEffect, useRef, useState } from 'react';

interface AudioManagerProps {
    isMuted?: boolean;
    onVolumeChange?: (volume: number) => void;
}

const AudioManager: React.FC<AudioManagerProps> = ({ isMuted = false, onVolumeChange }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.15);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize audio context and background music
    useEffect(() => {
        const initAudio = async () => {
            try {
                // Create audio context for better control
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

                // Try to wake up the audio context immediately with a silent buffer
                const wakeUpAudioContext = async () => {
                    try {
                        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                            await audioContextRef.current.resume();
                        }
                        
                        // Create a silent buffer to ensure audio context is active
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
                
                // Try to wake up audio context immediately
                wakeUpAudioContext();

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
                    // Silent error handling
                });

                // Handle audio end (shouldn't happen due to loop)
                audioRef.current.addEventListener('ended', () => {
                    // Background music ended, restarting...
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

    // Handle mute/unmute
    useEffect(() => {
        if (audioRef.current && hasUserInteracted && isLoaded) {
            if (isMuted) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                // Unmute - start music if not already playing
                if (!isPlaying) {
                    startMusic();
                }
            }
        }
    }, [isMuted, hasUserInteracted, isLoaded]);

    // Handle volume changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            onVolumeChange?.(volume);
        }
    }, [volume, onVolumeChange]);

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
        } catch (error) {
            // Silent error handling
        }
    };

    // Stop background music
    const stopMusic = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
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
        if (audioRef.current && !isMuted) {
            audioRef.current.play().catch(() => {
                // Silent error handling
            });
            setIsPlaying(true);
        }
    };

    // Set volume
    const setMusicVolume = (newVolume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, newVolume));
        setVolume(clampedVolume);
    };

    // Expose methods globally for easy access
    useEffect(() => {
        (window as any).audioManager = {
            startMusic,
            stopMusic,
            pauseMusic,
            resumeMusic,
            setVolume: setMusicVolume,
            isPlaying: () => isPlaying,
            isLoaded: () => isLoaded,
            hasUserInteracted: () => hasUserInteracted,
            enableAudio: () => {
                if (!hasUserInteracted) {
                    setHasUserInteracted(true);
                    if (audioContextRef.current?.state === 'suspended') {
                        audioContextRef.current.resume();
                    }
                    if (!isMuted && isLoaded) {
                        startMusic();
                    }
                }
            }
        };
    }, [isPlaying, isLoaded, hasUserInteracted, isMuted, isLoaded]);

    return null; // This component doesn't render anything
};

export default AudioManager; 