import React, { useEffect, useRef, useState } from 'react';

interface AudioManagerProps {
    isMuted?: boolean;
    onVolumeChange?: (volume: number) => void;
}

const AudioManager: React.FC<AudioManagerProps> = ({ isMuted = false, onVolumeChange }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.3);
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

                // Create audio element
                audioRef.current = new Audio('/bubble-shooter/audio/background-music.wav');
                audioRef.current.loop = true;
                audioRef.current.volume = volume;
                audioRef.current.preload = 'auto';

                // Handle audio loading
                audioRef.current.addEventListener('canplaythrough', () => {
                    setIsLoaded(true);
                    console.log('🎵 Background music loaded successfully');
                });

                // Handle audio errors
                audioRef.current.addEventListener('error', (e) => {
                    console.error('❌ Audio loading error:', e);
                });

                // Handle audio end (shouldn't happen due to loop)
                audioRef.current.addEventListener('ended', () => {
                    console.log('🔄 Background music ended, restarting...');
                });

            } catch (error) {
                console.error('❌ Failed to initialize audio:', error);
            }
        };

        initAudio();

        // Add user interaction listeners to enable audio
        const enableAudioOnInteraction = () => {
            if (!hasUserInteracted) {
                setHasUserInteracted(true);
                console.log('👆 User interaction detected, audio enabled');

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

        // Listen for user interactions - use capture to catch events early
        const events = ['click', 'touchstart', 'keydown', 'mousedown'];
        events.forEach(event => {
            document.addEventListener(event, enableAudioOnInteraction, { once: true, capture: true });
        });

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
        };
    }, []);

    // Handle mute/unmute
    useEffect(() => {
        if (audioRef.current && hasUserInteracted && isLoaded) {
            if (isMuted) {
                audioRef.current.pause();
                setIsPlaying(false);
                console.log('🔇 Music muted');
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
            console.log('🎵 Background music started');
        } catch (error) {
            console.error('❌ Failed to start background music:', error);
        }
    };

    // Stop background music
    const stopMusic = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
            console.log('🔇 Background music stopped');
        }
    };

    // Pause background music
    const pauseMusic = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            console.log('⏸️ Background music paused');
        }
    };

    // Resume background music
    const resumeMusic = () => {
        if (audioRef.current && !isMuted) {
            audioRef.current.play().catch(console.error);
            setIsPlaying(true);
            console.log('▶️ Background music resumed');
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