import '@/styles/globals.scss';
import type { AppProps } from 'next/app';
import { useRef } from 'react';
import AudioManager from '@/components/AudioManager';
import SoundEffects from '@/components/SoundEffects';
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function App({ Component, pageProps }: AppProps) {
  const audioManagerRef = useRef<HTMLAudioElement>(null);

  return (
    <LanguageProvider>
      <AudioManager ref={audioManagerRef} />
      <SoundEffects backgroundMusicRef={audioManagerRef} />
      <Component {...pageProps} />
    </LanguageProvider>
  );
}
