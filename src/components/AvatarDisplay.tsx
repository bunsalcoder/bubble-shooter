import React, { useState } from 'react';
import { isValidAvatarUrl, getSafeAvatarEmoji } from '@/utils/avatarUtils';

interface AvatarDisplayProps {
  avatarUrl: string;
  name: string;
  size?: number;
  showBorder?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatarUrl,
  name,
  size = 32,
  showBorder = true,
  className = '',
  style
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const hasValidAvatar = isValidAvatarUrl(avatarUrl) && !imageError;

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  if (hasValidAvatar) {
    return (
      <div className={className} style={{ position: 'relative', ...style }}>
        <img 
          src={avatarUrl} 
          alt={`${name} avatar`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            objectFit: 'cover',
            border: showBorder ? '2px solid rgba(255, 255, 255, 0.3)' : 'none',
            display: imageLoading ? 'none' : 'block'
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {imageLoading && (
          <div 
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${size * 0.4}px`
            }}
          >
            ⏳
          </div>
        )}
        {imageError && (
          <div 
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.1)',
              border: showBorder ? '2px solid rgba(255, 255, 255, 0.3)' : 'none',
              fontSize: `${size * 0.6}px`
            }}
          >
            {getSafeAvatarEmoji(avatarUrl)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.1)',
        fontSize: `${size * 0.6}px`,
        ...style
      }}
    >
      {getSafeAvatarEmoji(avatarUrl)}
    </div>
  );
};

export default AvatarDisplay; 