import { useEffect, useState, useCallback } from 'react';

interface AudioState {
  isPlaying: boolean;
  isLoaded: boolean;
  hasUserInteracted: boolean;
  isPageVisible: boolean;
  isPageFocused: boolean;
  wasPlayingBeforeBackground: boolean;
  isMuted: boolean;
  volume: number;
}

interface BackgroundAudioControls {
  startMusic: () => Promise<void>;
  stopMusic: () => void;
  pauseMusic: () => void;
  resumeMusic: () => void;
  setVolume: (volume: number) => void;
  enableAudio: () => void;
  getAudioState: () => AudioState;
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

export const useBackgroundAudio = (): BackgroundAudioControls => {
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isLoaded: false,
    hasUserInteracted: false,
    isPageVisible: true,
    isPageFocused: true,
    wasPlayingBeforeBackground: false,
    isMuted: false,
    volume: 0.5
  });

  // Update audio state when global audioManager changes
  useEffect(() => {
    if (!isBrowser) return;

    const updateAudioState = () => {
      if ((window as any).audioManager?.getAudioState) {
        const state = (window as any).audioManager.getAudioState();
        setAudioState(state);
      }
    };

    // Update immediately
    updateAudioState();

    // Set up interval to check for state changes
    const interval = setInterval(updateAudioState, 100);

    return () => clearInterval(interval);
  }, []);

  const startMusic = useCallback(async () => {
    if (!isBrowser) return;
    if ((window as any).audioManager?.startMusic) {
      await (window as any).audioManager.startMusic();
    }
  }, []);

  const stopMusic = useCallback(() => {
    if (!isBrowser) return;
    if ((window as any).audioManager?.stopMusic) {
      (window as any).audioManager.stopMusic();
    }
  }, []);

  const pauseMusic = useCallback(() => {
    if (!isBrowser) return;
    if ((window as any).audioManager?.pauseMusic) {
      (window as any).audioManager.pauseMusic();
    }
  }, []);

  const resumeMusic = useCallback(() => {
    if (!isBrowser) return;
    if ((window as any).audioManager?.resumeMusic) {
      (window as any).audioManager.resumeMusic();
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (!isBrowser) return;
    if ((window as any).audioManager?.setVolume) {
      (window as any).audioManager.setVolume(volume);
    }
  }, []);

  const enableAudio = useCallback(() => {
    if (!isBrowser) return;
    if ((window as any).audioManager?.enableAudio) {
      (window as any).audioManager.enableAudio();
    }
  }, []);

  const getAudioState = useCallback(() => {
    if (!isBrowser) return audioState;
    if ((window as any).audioManager?.getAudioState) {
      return (window as any).audioManager.getAudioState();
    }
    return audioState;
  }, [audioState]);

  return {
    startMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    setVolume,
    enableAudio,
    getAudioState
  };
};

// Hook to get just the audio state
export const useAudioState = (): AudioState => {
  const { getAudioState } = useBackgroundAudio();
  const [state, setState] = useState<AudioState>(() => {
    // Initialize with default state for SSR
    if (!isBrowser) {
      return {
        isPlaying: false,
        isLoaded: false,
        hasUserInteracted: false,
        isPageVisible: true,
        isPageFocused: true,
        wasPlayingBeforeBackground: false,
        isMuted: false,
        volume: 0.5
      };
    }
    return getAudioState();
  });

  useEffect(() => {
    if (!isBrowser) return;

    const updateState = () => {
      setState(getAudioState());
    };

    // Update immediately
    updateState();

    // Set up interval to check for state changes
    const interval = setInterval(updateState, 100);

    return () => clearInterval(interval);
  }, [getAudioState]);

  return state;
};

// Hook to check if audio should be playing based on current conditions
export const useShouldPlayAudio = (): boolean => {
  const audioState = useAudioState();
  
  return (
    audioState.hasUserInteracted &&
    audioState.isLoaded &&
    !audioState.isMuted &&
    audioState.isPageVisible &&
    audioState.isPageFocused
  );
}; 