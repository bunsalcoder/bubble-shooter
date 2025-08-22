// WakeLock API types for TypeScript
interface WakeLockSentinel extends EventTarget {
  released: boolean;
  release(): Promise<void>;
}

interface WakeLock {
  request(type: 'screen'): Promise<WakeLockSentinel>;
}

interface Navigator {
  wakeLock?: WakeLock;
}

// Extend the global Window interface
declare global {
  interface Window {
    audioManager?: {
      startMusic: () => Promise<void>;
      stopMusic: () => void;
      pauseMusic: () => void;
      resumeMusic: () => void;
      setVolume: (volume: number) => void;
      isPlaying: () => boolean;
      isLoaded: () => boolean;
      hasUserInteracted: () => boolean;
      enableAudio: () => void;
      getAudioState: () => {
        isPlaying: boolean;
        isLoaded: boolean;
        hasUserInteracted: boolean;
        isPageVisible: boolean;
        isPageFocused: boolean;
        wasPlayingBeforeBackground: boolean;
        isMuted: boolean;
        volume: number;
      };
    };
    soundEffects?: {
      playSinglePop: () => void;
      playGameOver: () => void;
      playGameWin: () => void;
    };
    vConsole?: {
      destroy: () => void;
    };
  }
}

export {}; 