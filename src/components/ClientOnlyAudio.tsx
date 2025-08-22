import React, { useState, useEffect, forwardRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import audio components with no SSR
const AudioManager = dynamic(() => import('./AudioManager'), { ssr: false });
const AudioStatusIndicator = dynamic(() => import('./AudioStatusIndicator'), { ssr: false });
const AudioTestPanel = dynamic(() => import('./AudioTestPanel'), { ssr: false });

interface ClientOnlyAudioProps {
  showStatusIndicator?: boolean;
  showTestPanel?: boolean;
}

const ClientOnlyAudio = forwardRef<HTMLAudioElement, ClientOnlyAudioProps>(({
  showStatusIndicator = false,
  showTestPanel = false
}, ref) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <>
      <AudioManager ref={ref} />
      {showStatusIndicator && <AudioStatusIndicator show={true} />}
      {showTestPanel && <AudioTestPanel />}
    </>
  );
});

ClientOnlyAudio.displayName = 'ClientOnlyAudio';

export default ClientOnlyAudio; 