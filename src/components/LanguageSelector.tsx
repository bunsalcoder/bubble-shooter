import React from 'react';
import { Modal } from 'antd';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageName, getLanguageFlag, Language } from '@/utils/languages';
import { isMobile } from 'react-device-detect';

interface LanguageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageSelect = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    onClose();
  };

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: getLanguageName('en'), flag: getLanguageFlag('en') },
    { code: 'zh', name: getLanguageName('zh'), flag: getLanguageFlag('zh') },
    { code: 'km', name: getLanguageName('km'), flag: getLanguageFlag('km') },
  ];

  return (
    <Modal
      title={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#1e3a8a',
          textAlign: 'center',
          justifyContent: 'center'
        }}>
          🌐 {t('selectLanguage')}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={isMobile ? '90vw' : 400}
      centered={true}
      bodyStyle={{
        padding: '15px',
        textAlign: 'center'
      }}
      style={{
        borderRadius: '20px',
        overflow: 'hidden'
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageSelect(lang.code)}
            style={{
              background: language === lang.code 
                ? 'linear-gradient(135deg, rgba(135, 206, 235, 0.9), rgba(70, 130, 180, 0.9))'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 248, 255, 0.9))',
              color: language === lang.code ? 'white' : '#1e3a8a',
              borderRadius: '12px',
              padding: '10px 15px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: language === lang.code 
                ? '0 4px 15px rgba(135, 206, 235, 0.3)'
                : '0 2px 10px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              border: language === lang.code 
                ? '2px solid rgba(255, 255, 255, 0.3)'
                : '2px solid rgba(135, 206, 235, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (language !== lang.code) {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(135, 206, 235, 0.2)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(135, 206, 235, 0.7), rgba(70, 130, 180, 0.7))';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (language !== lang.code) {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 248, 255, 0.9))';
                e.currentTarget.style.color = '#1e3a8a';
              }
            }}
          >
            {/* Selected indicator */}
            {language === lang.code && (
              <div style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: '#1e3a8a',
                fontWeight: 'bold'
              }}>
                ✓
              </div>
            )}
            
            {/* Language flag */}
            <span style={{ 
              fontSize: '20px',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }}>
              {lang.flag}
            </span>
            
            {/* Language name */}
            <span style={{
              fontSize: '16px',
              fontWeight: 'bold',
              textShadow: language === lang.code ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
            }}>
              {lang.name}
            </span>
          </button>
        ))}
        
        {/* Info text */}
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: 'linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(70, 130, 180, 0.1))',
          borderRadius: '8px',
          border: '1px solid rgba(135, 206, 235, 0.2)',
          fontSize: '12px',
          color: '#666',
          fontStyle: 'italic'
        }}>
          💡 {t('selectLanguage')} - ជ្រើសរើសភាសា - 选择语言
        </div>
      </div>
    </Modal>
  );
};

export default LanguageSelector; 