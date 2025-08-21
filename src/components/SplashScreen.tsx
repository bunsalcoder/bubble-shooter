import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [animationPhase, setAnimationPhase] = useState(0);
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

    // Animate title entrance
    const titleAnimation = setTimeout(() => {
      setAnimationPhase(1);
    }, 500);

    // Simulate loading progress
    const loadingSteps = [
      { progress: 20, text: 'Loading assets...' },
      { progress: 40, text: 'Preparing game...' },
      { progress: 60, text: 'Initializing...' },
      { progress: 80, text: 'Almost ready...' },
      { progress: 100, text: 'Ready!' }
    ];

    let currentStep = 0;
    const progressInterval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep];
        setProgress(step.progress);
        currentStep++;
      } else {
        clearInterval(progressInterval);
        // Wait a bit before completing
        setTimeout(() => {
          onComplete();
        }, 800);
      }
    }, 600);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(titleAnimation);
      window.removeEventListener('resize', handleResize);
    };
  }, [onComplete]);

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
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {/* Simple background particles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 6 + 4}px`,
              height: `${Math.random() * 6 + 4}px`,
              background: 'rgba(255, 255, 255, 0.4)',
              borderRadius: '50%',
              animation: `float ${4 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div style={{
        textAlign: 'center',
        width: '100%',
        padding: '0 20px',
        maxWidth: '500px',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Game icon using wait.jpg */}
        <div style={{
          marginBottom: '40px',
          opacity: animationPhase >= 1 ? 1 : 0,
          transform: animationPhase >= 1 ? 'translateY(0) scale(1)' : 'translateY(-30px) scale(0.9)',
          transition: 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            position: 'relative',
            width: isSmallMobile ? '100px' : isMobile ? '120px' : '140px',
            height: isSmallMobile ? '100px' : isMobile ? '120px' : '140px',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))'
          }}>
            <Image
              src="/bubble-shooter/background/wait.jpg"
              alt="Bubble Shooter Icon"
              width={isSmallMobile ? 100 : isMobile ? 120 : 140}
              height={isSmallMobile ? 100 : isMobile ? 120 : 140}
              style={{
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid rgba(255,255,255,0.3)',
                boxShadow: '0 0 20px rgba(255,255,255,0.2)'
              }}
              priority
            />
          </div>
        </div>

        {/* Game title with animated text */}
        <div style={{
          marginBottom: isSmallMobile ? '40px' : '50px',
          opacity: animationPhase >= 1 ? 1 : 0,
          transform: animationPhase >= 1 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s'
        }}>
          <h1 style={{
            fontSize: isSmallMobile ? '2.5rem' : isMobile ? '3.5rem' : '4rem',
            fontWeight: '800',
            background: 'linear-gradient(45deg, #FFFFFF, #E8F4FD, #FFFFFF)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            margin: '0 0 15px 0',
            letterSpacing: '3px',
            lineHeight: '1.1',
            fontFamily: '"Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
            textTransform: 'uppercase',
            animation: 'textShimmer 3s ease-in-out infinite'
          }}>
            {t('bubbleShooter')}
          </h1>
          <p style={{
            fontSize: isSmallMobile ? '1.1rem' : '1.3rem',
            color: 'rgba(255,255,255,0.9)',
            margin: '0',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            fontWeight: '400',
            letterSpacing: '2px',
            opacity: animationPhase >= 1 ? 1 : 0,
            transform: animationPhase >= 1 ? 'translateY(0)' : 'translateY(15px)',
            transition: 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s',
            fontFamily: '"Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
            animation: 'fadeInUp 2s ease-in-out infinite alternate'
          }}>
            {t('classicEdition')}
          </p>
        </div>

        {/* Enhanced colorful loading progress bar */}
        <div style={{
          width: isSmallMobile ? '280px' : isMobile ? '350px' : '400px',
          margin: '0 auto',
          marginBottom: '25px',
          opacity: animationPhase >= 1 ? 1 : 0,
          transform: animationPhase >= 1 ? 'translateY(0)' : 'translateY(15px)',
          transition: 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.6s'
        }}>
          <div style={{
            width: '100%',
            height: '16px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)',
            border: '2px solid rgba(255,255,255,0.2)',
            position: 'relative',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7)',
              borderRadius: '6px',
              transition: 'width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              boxShadow: '0 0 20px rgba(255,255,255,0.4)',
              position: 'relative',
              backgroundSize: '200% 100%',
              animation: 'gradientShift 2s ease-in-out infinite'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                animation: 'shimmer 1.5s infinite'
              }} />
            </div>
          </div>
        </div>

        {/* Animated progress percentage */}
        <div style={{
          fontSize: isSmallMobile ? '1.4rem' : '1.6rem',
          fontWeight: '700',
          color: 'rgba(255,255,255,0.95)',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          opacity: animationPhase >= 1 ? 1 : 0,
          transform: animationPhase >= 1 ? 'translateY(0)' : 'translateY(15px)',
          transition: 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.8s',
          fontFamily: '"Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          {progress}%
        </div>

        {/* Animated loading text */}
        <div style={{
          fontSize: isSmallMobile ? '0.9rem' : '1rem',
          color: 'rgba(255,255,255,0.8)',
          marginTop: '20px',
          opacity: animationPhase >= 1 ? 1 : 0,
          transform: animationPhase >= 1 ? 'translateY(0)' : 'translateY(15px)',
          transition: 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 1s',
          fontFamily: '"Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
          fontWeight: '300',
          animation: 'fadeInOut 3s ease-in-out infinite'
        }}>
          {t('loadingGame')}
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.3; }
          50% { transform: translateY(-15px); opacity: 0.6; }
        }

        @keyframes textShimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }

        @keyframes fadeInUp {
          0% { transform: translateY(0); opacity: 0.8; }
          100% { transform: translateY(-5px); opacity: 1; }
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen; 