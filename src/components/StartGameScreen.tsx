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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      overflow: 'hidden'
    }}>
      {/* Animated background particles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}>
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 8 + 6}px`,
              height: `${Math.random() * 8 + 6}px`,
              background: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              animation: `float ${5 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div style={{
        textAlign: 'center',
        width: '100%',
        padding: '0 20px',
        maxWidth: '600px',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Game icon */}
        <div style={{
          marginBottom: '50px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          animation: 'bounce 2s ease-in-out infinite'
        }}>
          <div style={{
            position: 'relative',
            width: isSmallMobile ? '120px' : isMobile ? '140px' : '160px',
            height: isSmallMobile ? '120px' : isMobile ? '140px' : '160px',
            filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.3))'
          }}>
            <Image
              src="/bubble-shooter/background/wait.jpg"
              alt="Bubble Shooter Icon"
              width={isSmallMobile ? 120 : isMobile ? 140 : 160}
              height={isSmallMobile ? 120 : isMobile ? 140 : 160}
              style={{
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid rgba(255,255,255,0.4)',
                boxShadow: '0 0 30px rgba(255,255,255,0.3)',
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

        {/* Game title */}
        <div style={{
          marginBottom: isSmallMobile ? '50px' : '60px'
        }}>
          <h1 style={{
            fontSize: isSmallMobile ? '3rem' : isMobile ? '4rem' : '5rem',
            fontWeight: '900',
            background: 'linear-gradient(45deg, #FFFFFF, #E8F4FD, #FFFFFF)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '3px 3px 6px rgba(0,0,0,0.4)',
            margin: '0 0 20px 0',
            letterSpacing: '4px',
            lineHeight: '1.1',
            fontFamily: '"Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
            textTransform: 'uppercase',
            animation: 'textShimmer 4s ease-in-out infinite'
          }}>
            {t('bubbleShooter')}
          </h1>
          <p style={{
            fontSize: isSmallMobile ? '1.2rem' : '1.4rem',
            color: 'rgba(255,255,255,0.9)',
            margin: '0',
            textShadow: '2px 2px 4px rgba(0,0,0,0.4)',
            fontWeight: '500',
            letterSpacing: '3px',
            fontFamily: '"Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
            animation: 'fadeInUp 3s ease-in-out infinite alternate'
          }}>
            {t('classicEdition')}
          </p>
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
              ? 'linear-gradient(135deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7)'
              : 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: isSmallMobile ? '18px 40px' : isMobile ? '20px 50px' : '25px 60px',
            fontSize: isSmallMobile ? '1.3rem' : isMobile ? '1.5rem' : '1.8rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: isHovered 
              ? '0 15px 35px rgba(255, 107, 107, 0.4), 0 0 30px rgba(255, 255, 255, 0.3)'
              : '0 8px 25px rgba(102, 126, 234, 0.4), 0 0 20px rgba(255, 255, 255, 0.2)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isPressed ? 'scale(0.95)' : isHovered ? 'scale(1.05)' : 'scale(1)',
            position: 'relative',
            overflow: 'hidden',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontFamily: '"Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
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
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              animation: 'shimmer 0.8s ease-in-out'
            }} />
          )}
          
          <span style={{ position: 'relative', zIndex: 1 }}>
            🎮 {t('startGame') || 'Start Game'}
          </span>
        </button>

        {/* Subtitle */}
        <p style={{
          fontSize: isSmallMobile ? '0.9rem' : '1rem',
          color: 'rgba(255,255,255,0.7)',
          marginTop: '30px',
          fontFamily: '"Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
          fontWeight: '300',
          animation: 'fadeInOut 4s ease-in-out infinite'
        }}>
          {t('tapToStart') || 'Tap to start your bubble shooting adventure!'}
        </p>
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