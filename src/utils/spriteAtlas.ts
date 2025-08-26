// Sprite atlas configuration for bubble shooter game
export const SPRITE_ATLAS_CONFIG = {
  // Path to the sprite atlas image and JSON
  IMAGE_PATH: '/bubble-shooter/game.png',
  JSON_PATH: '/bubble-shooter/game.json',
  
  // Color to sprite mapping - 7 original colors mapped to 6 sprites
  COLOR_TO_SPRITE: {
    '#FF0000': 'gameItem_red',        // Red
    '#FFFF00': 'gameItem_yellow',     // Yellow
    '#FFA500': 'gameItem_yellow',     // Orange → Yellow sprite (should collide with yellow)
    '#0000FF': 'gameItem_blue',       // Blue
    '#00FFFF': 'gameItem_bluelight',  // Cyan (separate from blue)
    '#FF00FF': 'gameItem_purple',     // Purple
    '#00FF00': 'gameItem_green',      // Green
    // Additional mappings for collision-normalized colors
    '#6495ED': 'gameItem_blue',       // Cornflower Blue → Blue sprite
    '#FF6600': 'gameItem_yellow',     // Bright Orange → Yellow sprite
    '#2196F3': 'gameItem_blue',       // More colorful blue → Blue sprite
    '#FFD700': 'gameItem_yellow',     // More colorful yellow → Yellow sprite
    '#800080': 'gameItem_purple',     // Violet → Purple sprite
  },
  
  // Available colors array - all 7 original colors
  COLORS: [
    '#FF0000', // Red
    '#FFFF00', // Yellow
    '#FFA500', // Orange
    '#0000FF', // Blue
    '#00FFFF', // Cyan
    '#FF00FF', // Purple
    '#00FF00', // Green
  ],
}; 