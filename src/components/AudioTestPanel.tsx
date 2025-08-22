import React, { useState } from 'react';
import { useBackgroundAudio, useAudioState } from '@/hooks/useBackgroundAudio';

const AudioTestPanel: React.FC = () => {
  const { startMusic, stopMusic, pauseMusic, resumeMusic, setVolume, enableAudio } = useBackgroundAudio();
  const audioState = useAudioState();
  const [volume, setVolumeState] = useState(0.5);

  // Don't render anything during SSR
  if (typeof window === 'undefined') {
    return null;
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolumeState(newVolume);
    setVolume(newVolume);
  };

  const testInstructions = [
    '1. Click "Start Music" to begin background music',
    '2. Switch to another tab - music should pause automatically',
    '3. Return to this tab - music should resume automatically',
    '4. Switch to another application - music should pause',
    '5. Return to browser - music should resume',
    '6. On mobile: lock screen - music should pause',
    '7. Unlock screen - music should resume'
  ];

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-sm font-mono z-50 max-w-md">
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2">Audio Test Panel</h3>
        
        {/* Audio Controls */}
        <div className="space-y-2 mb-4">
          <div className="flex space-x-2">
            <button 
              onClick={startMusic}
              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs"
            >
              Start Music
            </button>
            <button 
              onClick={stopMusic}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs"
            >
              Stop Music
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={pauseMusic}
              className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-xs"
            >
              Pause Music
            </button>
            <button 
              onClick={resumeMusic}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
            >
              Resume Music
            </button>
          </div>
          
          <button 
            onClick={enableAudio}
            className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-xs w-full"
          >
            Enable Audio Context
          </button>
        </div>

        {/* Volume Control */}
        <div className="mb-4">
          <label className="block text-xs mb-1">Volume: {Math.round(volume * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full"
          />
        </div>

        {/* Audio Status */}
        <div className="mb-4">
          <h4 className="font-bold text-xs mb-2">Audio Status:</h4>
          <div className="space-y-1 text-xs">
            <div className={`flex justify-between ${audioState.isPlaying ? 'text-green-400' : 'text-red-400'}`}>
              <span>Playing:</span>
              <span>{audioState.isPlaying ? 'Yes' : 'No'}</span>
            </div>
            <div className={`flex justify-between ${audioState.isPageVisible ? 'text-green-400' : 'text-red-400'}`}>
              <span>Page Visible:</span>
              <span>{audioState.isPageVisible ? 'Yes' : 'No'}</span>
            </div>
            <div className={`flex justify-between ${audioState.isPageFocused ? 'text-green-400' : 'text-red-400'}`}>
              <span>Page Focused:</span>
              <span>{audioState.isPageFocused ? 'Yes' : 'No'}</span>
            </div>
            <div className={`flex justify-between ${audioState.wasPlayingBeforeBackground ? 'text-yellow-400' : 'text-gray-400'}`}>
              <span>Was Playing Before Background:</span>
              <span>{audioState.wasPlayingBeforeBackground ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="border-t border-gray-600 pt-2">
          <h4 className="font-bold text-xs mb-2">Test Instructions:</h4>
          <ul className="text-xs space-y-1 text-gray-300">
            {testInstructions.map((instruction, index) => (
              <li key={index} className="leading-tight">{instruction}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AudioTestPanel; 