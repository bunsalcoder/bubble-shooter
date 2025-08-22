import React from 'react';
import { useAudioState } from '@/hooks/useBackgroundAudio';

interface AudioStatusIndicatorProps {
  show?: boolean;
  className?: string;
}

const AudioStatusIndicator: React.FC<AudioStatusIndicatorProps> = ({ 
  show = false, 
  className = '' 
}) => {
  const audioState = useAudioState();

  // Don't render anything during SSR or if show is false
  if (!show || typeof window === 'undefined') {
    return null;
  }

  const getStatusColor = (condition: boolean) => {
    return condition ? 'text-green-500' : 'text-red-500';
  };

  const getStatusIcon = (condition: boolean) => {
    return condition ? '✓' : '✗';
  };

  return (
    <div className={`fixed top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs font-mono z-50 ${className}`}>
      <div className="mb-2 font-bold">Audio Status</div>
      <div className="space-y-1">
        <div className={`flex items-center ${getStatusColor(audioState.isPlaying)}`}>
          <span className="mr-2">{getStatusIcon(audioState.isPlaying)}</span>
          Playing: {audioState.isPlaying ? 'Yes' : 'No'}
        </div>
        <div className={`flex items-center ${getStatusColor(audioState.isLoaded)}`}>
          <span className="mr-2">{getStatusIcon(audioState.isLoaded)}</span>
          Loaded: {audioState.isLoaded ? 'Yes' : 'No'}
        </div>
        <div className={`flex items-center ${getStatusColor(audioState.hasUserInteracted)}`}>
          <span className="mr-2">{getStatusIcon(audioState.hasUserInteracted)}</span>
          User Interacted: {audioState.hasUserInteracted ? 'Yes' : 'No'}
        </div>
        <div className={`flex items-center ${getStatusColor(audioState.isPageVisible)}`}>
          <span className="mr-2">{getStatusIcon(audioState.isPageVisible)}</span>
          Page Visible: {audioState.isPageVisible ? 'Yes' : 'No'}
        </div>
        <div className={`flex items-center ${getStatusColor(audioState.isPageFocused)}`}>
          <span className="mr-2">{getStatusIcon(audioState.isPageFocused)}</span>
          Page Focused: {audioState.isPageFocused ? 'Yes' : 'No'}
        </div>
        <div className={`flex items-center ${getStatusColor(audioState.wasPlayingBeforeBackground)}`}>
          <span className="mr-2">{getStatusIcon(audioState.wasPlayingBeforeBackground)}</span>
          Was Playing Before Background: {audioState.wasPlayingBeforeBackground ? 'Yes' : 'No'}
        </div>
        <div className={`flex items-center ${getStatusColor(!audioState.isMuted)}`}>
          <span className="mr-2">{getStatusIcon(!audioState.isMuted)}</span>
          Not Muted: {!audioState.isMuted ? 'Yes' : 'No'}
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-600">
        <div className="text-xs text-gray-300">
          Should Play: {(
            audioState.hasUserInteracted &&
            audioState.isLoaded &&
            !audioState.isMuted &&
            audioState.isPageVisible &&
            audioState.isPageFocused
          ) ? 'Yes' : 'No'}
        </div>
      </div>
    </div>
  );
};

export default AudioStatusIndicator; 