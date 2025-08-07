import '@/styles/globals.scss';
import type { AppProps } from 'next/app';
import AudioManager from '@/components/AudioManager';
import SoundEffects from '@/components/SoundEffects';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <AudioManager />
      <SoundEffects />
      <Component {...pageProps} />
    </>
  );
}
