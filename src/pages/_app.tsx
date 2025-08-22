import '@/styles/globals.scss';
import type { AppProps } from 'next/app';
import { useRef } from 'react';
import SoundEffects from '@/components/SoundEffects';
import ClientOnlyAudio from '@/components/ClientOnlyAudio';
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function App({ Component, pageProps }: AppProps) {
  const audioManagerRef = useRef<HTMLAudioElement>(null);

  return (
    <LanguageProvider>
      <ClientOnlyAudio ref={audioManagerRef} showStatusIndicator={false} showTestPanel={false} />
      <SoundEffects backgroundMusicRef={audioManagerRef} />
      <Component {...pageProps} />
    </LanguageProvider>
  );
}
