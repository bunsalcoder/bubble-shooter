import { useEffect } from 'react';

const VConsole: React.FC = () => {
  useEffect(() => {
    // Only load vConsole in development mode
    if (process.env.NEXT_PUBLIC_NODE_ENV === 'development') {
      // Dynamic import to avoid bundling vConsole in production
      import('vconsole').then((VConsole) => {
        if (typeof window !== 'undefined' && !window.vConsole) {
          // Initialize vConsole
          window.vConsole = new VConsole.default({
            theme: 'dark', // You can change this to 'light' if preferred
            maxLogNumber: 1000,
            onReady: () => {
              console.log('vConsole is ready!');
            },
            onClearLog: () => {
              console.log('vConsole logs cleared');
            }
          });
        }
      }).catch((error) => {
        console.error('Failed to load vConsole:', error);
      });
    }

    // Cleanup function to destroy vConsole when component unmounts
    return () => {
      if (typeof window !== 'undefined' && window.vConsole) {
        window.vConsole.destroy();
        window.vConsole = undefined;
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

export default VConsole; 