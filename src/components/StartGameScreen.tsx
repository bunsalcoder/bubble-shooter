import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

interface StartGameScreenProps {
  onStart: () => void;
}

const StartGameScreen: React.FC<StartGameScreenProps> = ({ onStart }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const { t } = useLanguage();

  useEffect(() => {
    // Set initial window size
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });

    // Handle window resize
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleStartClick = () => {
    // Initialize audio context and start background music
    try {
      // Enable audio for both manager and effects
      if ((window as any).audioManager?.enableAudio) {
        (window as any).audioManager.enableAudio();
      }
      if ((window as any).soundEffects?.enableAudio) {
        (window as any).soundEffects.enableAudio();
      }

      // Start background music
      if ((window as any).audioManager?.startMusic) {
        (window as any).audioManager.startMusic();
      }

      // iOS-specific audio initialization
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (isIOS) {
        // Try to create and play a silent audio to wake up iOS audio context
        try {
          const silentAudio = new Audio();
          silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
          silentAudio.volume = 0;
          silentAudio.play().then(() => {
            // iOS silent audio played successfully
          }).catch(() => {
            // Silent error handling
          });
        } catch (error) {
          // Silent error handling
        }
      }
    } catch (error) {
      console.error('Error initializing audio:', error);
    }

    // Proceed to splash screen
    onStart();
  };

  const isMobile = windowSize.width < 768;
  const isSmallMobile = windowSize.width < 480;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      overflow: 'hidden'
    }}>
      {/* Flipped background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'url("/bubble-shooter/BG.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transform: 'scaleY(-1)', // Flip the background vertically
        zIndex: -1
      }} />


      {/* Main content */}
      <div style={{
        textAlign: 'center',
        width: '100%',
        padding: '0 20px',
        maxWidth: '600px',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Game Logo */}
        <div style={{
          marginBottom: '50px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          animation: 'bounce 2s ease-in-out infinite'
        }}>
          <div style={{
            position: 'relative',
            width: isSmallMobile ? '240px' : isMobile ? '280px' : '320px',
            height: isSmallMobile ? '240px' : isMobile ? '280px' : '320px',
            filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.3))'
          }}>
            <Image
              src="/bubble-shooter/bubble-logo.png"
              alt="Bubble Shooter Logo"
              width={isSmallMobile ? 240 : isMobile ? 280 : 320}
              height={isSmallMobile ? 240 : isMobile ? 280 : 320}
              style={{
                objectFit: 'contain',
                // iOS-specific fixes for image rendering artifacts
                WebkitTransform: 'translateZ(0)',
                transform: 'translateZ(0)',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                WebkitPerspective: '1000',
                perspective: '1000',
                imageRendering: '-webkit-optimize-contrast'
              }}
              priority
            />
          </div>
        </div>



        {/* Start Game Button */}
        <button
          onClick={handleStartClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={() => setIsPressed(false)}
                      style={{
              background: isHovered 
                ? 'linear-gradient(to bottom,rgb(235, 166, 243), #D682DF)'
                : 'linear-gradient(to bottom,rgb(240, 185, 246), #D682DF)',
            color: 'white',
            border: '7px solid white',
            borderRadius: '20px',
            padding: isSmallMobile ? '18px 50px' : isMobile ? '20px 60px' : '25px 70px',
            fontSize: isSmallMobile ? '1.3rem' : isMobile ? '1.5rem' : '1.7rem',
            fontWeight: '900',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isPressed ? 'scale(0.98)' : isHovered ? 'scale(1.02)' : 'scale(1)',
            position: 'relative',
            overflow: 'hidden',
            letterSpacing: '1px',
            fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
            animation: isHovered ? 'none' : 'pulse 2s ease-in-out infinite'
          }}
        >
          {/* Shimmer effect overlay */}
          {isHovered && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              animation: 'shimmer 0.6s ease-in-out'
            }} />
          )}
          
          <span style={{ position: 'relative', zIndex: 1 }}>
            {t('startGame') || 'Start Game'}
          </span>
        </button>


      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; }
        }

        @keyframes textShimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }

        @keyframes fadeInUp {
          0% { transform: translateY(0); opacity: 0.8; }
          100% { transform: translateY(-8px); opacity: 1; }
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default StartGameScreen; 