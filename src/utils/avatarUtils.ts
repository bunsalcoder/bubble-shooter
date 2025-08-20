export const isValidAvatarUrl = (avatarUrl: string): boolean => {
  if (!avatarUrl || avatarUrl.trim() === '') {
    return false;
  }
  
  // Check if it's a valid URL
  try {
    new URL(avatarUrl);
    return true;
  } catch {
    return false;
  }
};

export const getAvatarEmoji = (avatarUrl: string): string => {
  if (!avatarUrl || avatarUrl.trim() === '') {
    return '👤';
  }

  let hash = 0;
  for (let i = 0; i < avatarUrl.length; i++) {
    const char = avatarUrl.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const emojis = [
    '🏆', '👑', '⭐', '💎', '🌟', '⚡', '🔥', '💫', '🎯', '🚀',
    '🎮', '🎪', '🎨', '🎭', '🎪', '🎯', '🎲', '🎸', '🎺', '🎻',
    '🏀', '⚽', '🏈', '🎾', '🏓', '🏸', '🏊', '🏃', '🚴', '🏋️',
    '👨‍💻', '👩‍💻', '👨‍🎨', '👩‍🎨', '👨‍🎭', '👩‍🎭', '👨‍🎤', '👩‍🎤', '👨‍🎪', '👩‍🎪'
  ];

  const emojiIndex = Math.abs(hash) % emojis.length;
  return emojis[emojiIndex];
};

export const getRankEmoji = (rank: number): string => {
  switch (rank) {
    case 1:
      return '🏆';
    case 2:
      return '👑';
    case 3:
      return '⭐';
    default:
      return '💎';
  }
};

export const getSafeAvatarEmoji = (avatarUrl: string): string => {
  try {
    return getAvatarEmoji(avatarUrl);
  } catch (error) {
    console.warn('Error converting avatar URL to emoji:', error);
    return '👤';
  }
}; 