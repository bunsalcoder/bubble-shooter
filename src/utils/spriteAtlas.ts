// Sprite atlas configuration for bubble shooter game
export const SPRITE_ATLAS_CONFIG = {
  // Path to the sprite atlas image and JSON
  IMAGE_PATH: '/bubble-shooter/game.png',
  JSON_PATH: '/bubble-shooter/game.json',
  
  // Color to sprite mapping - using regular colored sprites
  COLOR_TO_SPRITE: {
    '#FF0000': 'gameItem_red',        // Red
    '#00FF00': 'gameItem_green',      // Green
    '#0000FF': 'gameItem_blue',       // Blue
    '#FFFF00': 'gameItem_yellow',     // Yellow
    '#FF00FF': 'gameItem_purple',     // Purple/Magenta
    '#00FFFF': 'gameItem_blue',       // Cyan (using blue sprite)
    '#FFA500': 'gameItem_yellow',     // Orange (using yellow sprite for now)
    '#800080': 'gameItem_purple',     // Violet
    '#FF6600': 'gameItem_yellow',     // Bright orange (using yellow sprite)
    '#2196F3': 'gameItem_blue',       // More colorful blue
    '#FFD700': 'gameItem_yellow',     // More colorful yellow
  },
  
  // Available colors array - matching the original game colors
  COLORS: [
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Purple/Magenta
    '#00FFFF', // Cyan
    // '#FFA500', // Orange
    '#800080', // Violet
    '#FF6600', // Bright orange
    '#2196F3', // More colorful blue
    '#FFD700', // More colorful yellow
  ],
  
  // Alternative color mapping if you want to use ladybug sprites
  LADYBUG_COLOR_TO_SPRITE: {
    '#FF0000': 'gameItem_color_red',
    '#00FF00': 'gameItem_color_green', 
    '#0000FF': 'gameItem_color_blue',
    '#FFFF00': 'gameItem_color_yellow',
    '#FF00FF': 'gameItem_color_purple',
    '#00FFFF': 'gameItem_blue',
    '#FFA500': 'gameItem_yellow',
    '#800080': 'gameItem_purple'
  }
}; 