import {
  addRowBubbleList,
  checkCollision,
  colorFlood,
  createGridBubble,
  createListBubbleNext,
  getAdjacentForSpecialBubble,
  getAllColors,
  getDeviceType,
  getHeight,
  getLocation,
  getSize,
  inGrid,
  randomColor,
  randomInt,
  setBubblePosition,
  setBubbleSize,
  setGameSize,
  setGridCols,
  updateDirectionBubbleNext,
  verifyGrid,
  predictTrajectory,
  calculateShootDirection,
} from "@/helpers/game";
import { Answer, Bubble, DeviceType, GameState, Grid } from "@/models/game";
import {
  BUBBLE_SPEED,
  GRID_ROWS,
  LIMIT_HEIGHT,
  TIME_COUNT_DOWN,
} from "@/utils/contants";
import { Button, Form, Input, Modal } from "antd";
import dynamic from "next/dynamic";
import p5Types from "p5";
import React, { useRef, useState, useEffect } from "react";
import score from "@public/bubble-shooter/background/score.png";
import pause from "@public/bubble-shooter/icon/pause.png";
import play from "@public/bubble-shooter/icon/play.png";
import setting from "@public/bubble-shooter/icon/setting.png";
import Image from "next/image";
import { isMobile, isAndroid } from "react-device-detect";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLanguageFlag, getLanguageName } from "@/utils/languages";
import LanguageSelector from "@/components/LanguageSelector";
import { saveGameAPI, getGameAPI, clearGameAPI } from "@/services/mosAuth";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { getSafeAvatarEmoji, getRankEmoji, isValidAvatarUrl } from "@/utils/avatarUtils";
import AvatarDisplay from "@/components/AvatarDisplay";
import VolumeControl from "@/components/VolumeControl";
import { SPRITE_ATLAS_CONFIG } from "@/utils/spriteAtlas";

const Board: React.FC = () => {
  let gameState: GameState = {
    countShoot: 0,
    isGameOver: false,
    isWin: false,
    isPause: false,
    defaultTime: TIME_COUNT_DOWN,
  };

  const [bubbleRadius, bubbleDiameter] = setBubbleSize();
  const [bubbleStartX, bubbleStartY] = setBubblePosition();
  const [gameWidth, gameHeight] = setGameSize();
  const girdColumns = setGridCols();
    // Initialize mute button image on mount
  useEffect(() => {
    if ((window as any).audioManager?.getAudioState) {
      const audioState = (window as any).audioManager.getAudioState();
      const muteButton = document.querySelector('.mute-unmute-icon') as HTMLImageElement;
      if (muteButton) {
        // Show unmute.png when muted (user clicks to unmute)
        // Show mute.png when unmuted (user clicks to mute)
        muteButton.src = audioState.isMuted ? "/bubble-shooter/unmute.png" : "/bubble-shooter/mute.png";
        muteButton.alt = audioState.isMuted ? "Muted" : "Unmuted";
        muteButton.title = audioState.isMuted ? "Click to unmute" : "Click to mute";
      }
    }
  }, []);
  
  // Function to handle mute/unmute toggle
  const handleMuteToggle = () => {
    try {
      if ((window as any).audioManager?.toggleMute) {
        // Toggle mute in audio manager
        (window as any).audioManager.toggleMute();
        
        // Wait a bit for the audio state to update, then sync the visual
        setTimeout(() => {
          const audioState = (window as any).audioManager.getAudioState();
          // Directly update the button image without React re-render
          const muteButton = document.querySelector('.mute-unmute-icon') as HTMLImageElement;
          if (muteButton) {
            // Show unmute.png when muted (user clicks to unmute)
            // Show mute.png when unmuted (user clicks to mute)
            muteButton.src = audioState.isMuted ? "/bubble-shooter/unmute.png" : "/bubble-shooter/mute.png";
            muteButton.alt = audioState.isMuted ? "Muted" : "Unmuted";
            muteButton.title = audioState.isMuted ? "Click to unmute" : "Click to mute";
          }
        }, 50); // Small delay to ensure audio state is updated
      }
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };
  let grid: Grid = {
    numRows: GRID_ROWS,
    numCols: girdColumns,
    bubbleDiameter: bubbleDiameter,
    bubbleMargin: 0,
    startX: bubbleRadius + 10,
    startY: bubbleRadius,
    movement: 0,
  };

  const gridRef = useRef<Grid>(grid);

  let alertActive = false;

  const freezeGame = () => {
    gameState.isPause = true;
    gameState.isGameOver = true;
  };

  const unfreezeGame = () => {
    gameState.isPause = false;
    gameState.isGameOver = false;
  };

  // Function to clean up any existing modals
  const cleanupExistingModals = () => {
    // Remove any existing alert modals
    const existingOverlays = document.querySelectorAll('div[style*="z-index: 1000"]');
    const existingAlertBoxes = document.querySelectorAll('div[style*="z-index: 1001"]');
    const existingStyles = document.querySelectorAll('style[data-alert-style]');
    
    existingOverlays.forEach(overlay => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    });
    
    existingAlertBoxes.forEach(box => {
      if (document.body.contains(box)) {
        document.body.removeChild(box);
      }
    });
    
    existingStyles.forEach(style => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    });
    
    // Reset alertActive flag
    alertActive = false;
  };

  let image: any = {
    imageDraw: "",
    imageSpecialBall: "",
    spriteAtlas: null,
    spriteData: null,
    spritesLoaded: false,
    // Combo images
    comboNice: null,
    comboGreat: null,
    comboAmazing: null,
    comboIncredible: null,
    comboLegendary: null,
  };
  
  // Screen effects and combo images
  let flashEffect: { alpha: number, duration: number } = { alpha: 0, duration: 0 };
  let comboImages: { image: any, x: number, y: number, alpha: number, scale: number, duration: number, rotation: number, rotationSpeed: number, pulsePhase: number, glowIntensity: number }[] = [];
  
  // Function to get the visual color for a bubble (for trajectory and visual consistency)
  const getVisualColor = (color: string): string => {
    // Map colors to their visual representation for trajectory and effects
    const visualColorMapping: { [key: string]: string } = {
      '#FFA500': '#FFFF00', // Orange → Yellow (for trajectory consistency)
      '#FF6600': '#FFFF00', // Bright Orange → Yellow (for trajectory consistency)
      '#FFD700': '#FFFF00', // More colorful yellow → Yellow (for trajectory consistency)
    };
    
    // Return the mapped color if it exists, otherwise return the original color
    return visualColorMapping[color] || color;
  };



  // Function to draw bubble using sprite atlas
  const drawBubbleSprite = (p5: p5Types, x: number, y: number, color: string, radius: number, bounceScale: number = 1, bounceOffset: number = 0) => {
    if (image.spritesLoaded && image.spriteAtlas && image.spriteData && SPRITE_ATLAS_CONFIG.COLOR_TO_SPRITE[color as keyof typeof SPRITE_ATLAS_CONFIG.COLOR_TO_SPRITE]) {
      const spriteName = SPRITE_ATLAS_CONFIG.COLOR_TO_SPRITE[color as keyof typeof SPRITE_ATLAS_CONFIG.COLOR_TO_SPRITE];
      const spriteInfo = image.spriteData.frames?.[spriteName];
      
      if (spriteInfo && spriteInfo.frame) {
        const { x: sx, y: sy, w, h } = spriteInfo.frame;
        const scale = (radius * 2) / Math.max(w, h);
        
        p5.push();
        p5.translate(x, y + bounceOffset);
        p5.scale(bounceScale * scale);
        p5.imageMode(p5.CENTER);
        
        // Draw the sprite from the atlas
        p5.image(image.spriteAtlas, 0, 0, w, h, sx, sy, w, h);
        
        p5.pop();
        return true; // Successfully drew sprite
      } else {
        // Debug: log when sprite info is missing

      }
    } else {
      // Debug: log when color mapping is missing or sprites not loaded
      if (!image.spritesLoaded) {

      }
    }
    return false; // Fallback to original method
  };


  

  

  const gameProperties = useRef({
    score: 0,
    highestScore: 0,
    shotsInRound: 0, // Shots taken in current round (0-5)
    color: SPRITE_ATLAS_CONFIG.COLORS,
    moveDownInterval: 20,
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isModalSettingOpen, setIsModalSettingOpen] = useState<boolean>(false);
  const [isGameLoadedFromStorage, setIsGameLoadedFromStorage] = useState<boolean>(false);
  const [isGameLoading, setIsGameLoading] = useState<boolean>(true);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);

  const [isMenuVisible, setIsMenuVisible] = useState<boolean>(false);
  const [isInfoVisible, setIsInfoVisible] = useState<boolean>(false);
  const [isLanguageSelectorOpen, setIsLanguageSelectorOpen] = useState<boolean>(false);

  // Language context
  const { t, language } = useLanguage();
  const { currentUserRank, topPlayers, isLoading: leaderboardLoading, error: leaderboardError, refreshLeaderboard } = useLeaderboard();
  
  // Load leaderboard and game data on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        await refreshLeaderboard();
      } catch (error) {
        console.error('Failed to initialize data:', error);
        setIsGameLoading(false);
      }
    };

    initializeData();
  }, []); // Empty dependency array means this runs once on mount
  
  // Function to open leaderboard modal
  const handleUserProfileClick = async () => {
    try {
      // Refresh leaderboard data when opened
      await refreshLeaderboard();
      setIsLeaderboardOpen(true);
    } catch (error) {
      console.error('Failed to refresh leaderboard:', error);
    }
  };
  
  const gridBubble = useRef<Record<string, Bubble>>({});
  const specialBubble = useRef({
    isAnswered: Answer.NOT_YET,
  });
  const bubbleNext = useRef<any[]>([]);
  const activeBubble = useRef<any>(null);
  const secondaryBubble = useRef<any>(null);
  const tertiaryBubble = useRef<any>(null);
  const isSwapping = useRef<boolean>(false);
  const swapAnimation = useRef<number>(0);
  const isGenerateSpecialBall = useRef<boolean>(false);
  const removeBubbles: any[] = [];
  const arrayTime: any = [];

  // Local storage functions
  const saveGameToLocalStorage = () => {
    try {
      // Don't save if activeBubble is currently moving
      if (activeBubble.current && activeBubble.current.isMoving) {

        return;
      }

      const gameData = {
        gridBubble: gridBubble.current,
        gameProperties: gameProperties.current,
        grid: gridRef.current,
        bubbleQueue: bubbleNext.current,
        activeBubble: activeBubble.current,
        secondaryBubble: secondaryBubble.current,
        tertiaryBubble: tertiaryBubble.current,
        alertActive: alertActive, // Persist the alertActive flag
        timestamp: new Date().toISOString()
      };
      // localStorage.setItem('bubbleShooterGame', JSON.stringify(gameData));
      
      // Also save highest score separately
      // saveHighestScore();
      
      // Save to API as well
      saveGameToAPI(gameData, gameProperties.current.highestScore);

    } catch (error) {

    }
  };

  const loadGameFromAPI = async () => {
    try {
      const response = await getGameAPI();
      
      if (response && response.data) {
        const gameData = response.data.bubbleShooterGame;
        const highestScore = response.data.bubbleShooterHighestScore;
        
        if (gameData) {
          // Check if saved game is not too old (24 hours)
          const savedTime = new Date(gameData.timestamp);
          const currentTime = new Date();
          const hoursDiff = (currentTime.getTime() - savedTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff < 24) {
            // Restore game state
            gridBubble.current = gameData.gridBubble;
            gridRef.current = gameData.grid;
            bubbleNext.current = gameData.bubbleQueue;
            secondaryBubble.current = gameData.secondaryBubble;
            tertiaryBubble.current = gameData.tertiaryBubble;

            if (highestScore) {
              gameProperties.current.highestScore = highestScore;
            }
            
            // Merge saved game properties with current ones to preserve highestScore
            gameProperties.current = {
              ...gameProperties.current, // Keep current properties (including highestScore)
              ...gameData.gameProperties // Override with saved data
            };
            
            // Clear any animation props to prevent visual glitches
            Object.keys(gridBubble.current).forEach(key => {
              if (gridBubble.current[key].animationProps) {
                gridBubble.current[key].animationProps = undefined;
              }
            });

            // Reset activeBubble to static position to prevent showing previous shooting action
            if (gameData.activeBubble) {
              activeBubble.current = {
                ...gameData.activeBubble,
                x: bubbleStartX,
                y: bubbleStartY,
                speedX: 0,
                speedY: 0,
                isMoving: false,
                animationProps: undefined
              };
            } else {
              // Fallback to first bubble in queue
              activeBubble.current = bubbleNext.current[0];
            }
            
            // Also reset any other moving bubbles in the grid to prevent visual glitches
            Object.keys(gridBubble.current).forEach(key => {
              const bubble = gridBubble.current[key];
              if (bubble.isMoving) {
                bubble.isMoving = false;
                bubble.speedX = 0;
                bubble.speedY = 0;
              }
            });
            
            // Clean up any existing modals that might have been left from before the refresh
            cleanupExistingModals();
            
            // If the game was in a game over state, we need to show the modal again
            // but we don't want to restore the alertActive flag to prevent duplicate modals
            // The checkGameOVer function will handle showing the modal if needed
            
            setIsGameLoadedFromStorage(true);
    
            return true;
          } else {
    
          }
        }
      }
    } catch (error) {

    }
    return false;
  };

  const clearSavedGame = async () => {
    localStorage.removeItem('bubbleShooterGame');
    
    // Also clear game progress from API
    try {
      await clearGameAPI();
      
    } catch (error) {
      
    }
  };

  const loadHighestScore = () => {
    try {
      const savedHighestScore = localStorage.getItem('bubbleShooterHighestScore');
      if (savedHighestScore) {
        const highestScore = parseInt(savedHighestScore, 10);
        if (!isNaN(highestScore)) {
          gameProperties.current.highestScore = highestScore;

        }
      }
    } catch (error) {

    }
  };

  const saveHighestScore = () => {
    try {
      localStorage.setItem('bubbleShooterHighestScore', gameProperties.current.highestScore.toString());

    } catch (error) {

    }
  };

  const saveGameToAPI = async (gameData: any, highestScore: number) => {
    try {
      await saveGameAPI(gameData, highestScore);
      
    } catch (error) {
      
    }
  };

  const updateHighestScore = () => {
    if (gameProperties.current.score > gameProperties.current.highestScore) {
      gameProperties.current.highestScore = gameProperties.current.score;
      saveHighestScore();

    }
  };

  const syncHighestScore = () => {
    // Ensure highest score is loaded and synced with game properties
    loadHighestScore();
    
  };

  // Use API data for leaderboard
  const leaderboardData = topPlayers.map(player => ({
    rank: player.rank,
    name: player.name,
    score: player.score,
    avatarUrl: player.avatarUrl,
    avatarEmoji: getSafeAvatarEmoji(player.avatarUrl),
    hasAvatar: isValidAvatarUrl(player.avatarUrl)
  }));

  // Current player name from API
  const currentPlayerName = currentUserRank?.name || "Player";

  const handleLeaderboardOk = () => {
    setIsLeaderboardOpen(false);
  };

  const handleLeaderboardCancel = () => {
    setIsLeaderboardOpen(false);
  };

  const forceNewGame = () => {
    // Clear localStorage
    localStorage.removeItem('bubbleShooterGame');
    
    // Reset all game state
    gridRef.current.numRows = GRID_ROWS;
    gridRef.current.numCols = girdColumns;
    gridRef.current.movement = 0;
    gameProperties.current.score = 0;
    gameProperties.current.shotsInRound = 0;
    gameState.isPause = false;
    gameState.isGameOver = false;
    gameState.isWin = false;
    gameState.countShoot = 0;
    
    // Create completely fresh game state
    gridBubble.current = createGridBubble(gridRef.current, gameProperties.current.color);
    bubbleNext.current = createListBubbleNext(grid, bubbleStartX, bubbleStartY, gameProperties.current.color);
    activeBubble.current = bubbleNext.current[0];
    secondaryBubble.current = bubbleNext.current[1] || bubbleNext.current[0];
    tertiaryBubble.current = bubbleNext.current[2] || bubbleNext.current[0];
    isGenerateSpecialBall.current = false;
    
    // Clear any animations
    removeBubbles.length = 0;
    
    // Reset the loaded from storage flag
    setIsGameLoadedFromStorage(false);
    

  };

  // Save game when user closes the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveGameToLocalStorage();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Debug function to check localStorage status
  const debugLocalStorage = () => {
    const savedGame = localStorage.getItem('bubbleShooterGame');
    const savedHighestScore = localStorage.getItem('bubbleShooterHighestScore');
    return savedGame;
  };

    const handleOk = () => {
    specialBubble.current.isAnswered = Answer.CORRECT;
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    specialBubble.current.isAnswered = Answer.WRONG;
    bubbleNext.current.shift()!;
    addBubbleNext(gridBubble.current, bubbleNext.current);
    updateDirectionBubbleNext(bubbleNext.current, grid);

    activeBubble.current = bubbleNext.current[0];
    setIsModalOpen(false);
  };

  const handleOkSetting = () => {
    setIsModalSettingOpen(false);
  };

  const handleCancelSetting = () => {
    setIsModalSettingOpen(false);
  };





  // Handle first user interaction (audio is now handled by StartGameScreen)
  const handleFirstInteraction = () => {
    // Audio initialization is now handled by StartGameScreen
    // This function is kept for compatibility but doesn't initialize audio
  };

  // Play shoot sound when bubble is fired
  const playShootSound = () => {
    if ((window as any).soundEffects) {
      (window as any).soundEffects.playSinglePop();
    }
  };

  const caculateScore = (pop: number) => {
    return pop * 30;
  };

  const resetGame = async () => {
    gridRef.current.numRows = GRID_ROWS;
    gridRef.current.numCols = girdColumns;
    gridRef.current.movement = 0;
    gameProperties.current.score = 0;
    gameProperties.current.shotsInRound = 0;
    gameState.isPause = false;
    gameState.isGameOver = false;
    gameState.isWin = false;
    gameState.countShoot = 0;
    alertActive = false; // Reset alertActive flag when starting new game
    
    // Reset the monster image back to cat.gif
    const monsterImg = document.querySelector('.monster-character img') as HTMLImageElement;
    if (monsterImg) {
      monsterImg.src = '/bubble-shooter/cat.gif';
    }
    bubbleNext.current = createListBubbleNext(
      grid,
      bubbleStartX,
      bubbleStartY,
      gameProperties.current.color
    );
    gridBubble.current = createGridBubble(
      gridRef.current,
      gameProperties.current.color
    );
    activeBubble.current = bubbleNext.current[0];
    secondaryBubble.current = bubbleNext.current[1] || bubbleNext.current[0];
    tertiaryBubble.current = bubbleNext.current[2] || bubbleNext.current[0];
    isGenerateSpecialBall.current = false;
    
    // Clear saved game when starting new game
    await clearSavedGame();
    
    // Clean up any existing modals
    cleanupExistingModals();
  };

  // const checkIsWin = (gridBubble: Record<string, Bubble>) => {
  //   if (getSize(gridBubble) === 0 && getSize(removeBubbles) === 0) {
  //     gameState.isWin = true;
  //     showAlert('Win!')
  //     resetGame();
  //   }
  // };

  // const checkGameOVer = (gridBubble: Record<string, Bubble>) => {
  //   if (
  //     gameProperties.current.time <= 0 ||
  //     getHeight(gridBubble) >= LIMIT_HEIGHT
  //   ) {
  //     gameState.isGameOver = true;
  //     showAlert('Game over')
  //     resetGame();
  //   }
  // };

  const checkIsWin = (gridBubble: Record<string, Bubble>) => {
    if (getSize(gridBubble) === 0 && getSize(removeBubbles) === 0) {
      freezeGame();
      showAlert(t('youWin'));
    }
  };

  const checkGameOVer = (gridBubble: Record<string, Bubble>) => {
    // Don't check if alert is already active (modal is shown)
    if (alertActive) {
      return;
    }
    
    const height = getHeight(gridBubble);
    
    // Get external container bounds
    const containerBounds = getExternalContainerBounds();
    if (!containerBounds) {
      return; // Container not found, skip check
    }
    
    // Check if any bubble reaches the bottom of the external container
    let bubblesAtBottom = false;
    for (const key in gridBubble) {
      const bubble = gridBubble[key];
      // Convert canvas Y position to screen Y position for comparison
      const canvasElement = document.querySelector('canvas');
      if (canvasElement) {
        const canvasRect = canvasElement.getBoundingClientRect();
        const bubbleScreenY = canvasRect.top + bubble.y;
        if (bubbleScreenY + bubble.r >= containerBounds.bottom) {
          bubblesAtBottom = true;
          break;
        }
      }
    }
    
    // Check if game over condition is met
    if (bubblesAtBottom) {
      // If game is already in game over state but no alert is active, show the alert
      if (gameState.isGameOver && !alertActive) {
        showAlert(t('gameOver'));
        return;
      }
      
      // If not in game over state yet, change image first, then show modal after 0.5 seconds
      if (!gameState.isGameOver) {
        // Change the image source directly without state
        const monsterImg = document.querySelector('.monster-character img') as HTMLImageElement;
        if (monsterImg) {
          monsterImg.src = '/bubble-shooter/game-over-bg.gif';
        }
        
        // Show modal after 0.5 seconds
        setTimeout(() => {
          freezeGame();
          showAlert(t('gameOver'));
        }, 500);
      }
    }
  };

  const checkGamePause = () => {
    const shouldPause = isModalOpen || isModalSettingOpen || isMenuVisible || isLeaderboardOpen || isLanguageSelectorOpen || isInfoVisible || gameState.isPause;
    
    // Save game state when pausing (but only if bubble is not moving)
    if (shouldPause && activeBubble.current && !activeBubble.current.isMoving) {
      setTimeout(() => saveGameToLocalStorage(), 100);
    }
    
    return shouldPause;
  };

  const moveDown = (gridBubble: Record<string, Bubble>, p5: p5Types) => {
    // Grid dropping is now handled by the 5-shot system
    // This function is kept for compatibility but doesn't do anything
  };

  const renderBubbleList = (
    p5: p5Types,
    gridBubble: Record<string, Bubble>
  ) => {
    for (const key in gridBubble) {
      const bubble = gridBubble[key];
      drawBubble(bubble, p5);
    }
  };

  const removeBubble = (
    gridBubble: Record<string, Bubble>,
    row: number,
    col: number
  ) => {
    if (inGrid(gridBubble, row, col)) {
      removeBubbles.push(gridBubble[`${row},${col}`]);
      delete gridBubble[`${row},${col}`];
      return true;
    }
    return false;
  };
  const insertBubble = (
    gridBubble: Record<string, Bubble>,
    grid: Grid,
    bubble: Bubble,
    row: number,
    col: number
  ) => {
    const [x, y] = getLocation(row, col, grid);
    const bubbleFired: Bubble = {
      ...bubble,
      x: x,
      y: y,
      isMoving: false,
    };
    gridBubble[`${row},${col}`] = bubbleFired;
    if (bubble.isSpecial) {
      const groupSpecial = getAdjacentForSpecialBubble(row, col);
      groupSpecial.push([row, col]);
      let pop: number = 0;
      for (let index = 0; index < groupSpecial.length; index++) {
        if (
          inGrid(gridBubble, groupSpecial[index][0], groupSpecial[index][1])
        ) {
          removeBubble(
            gridBubble,
            groupSpecial[index][0],
            groupSpecial[index][1]
          );
          pop++;
        }
      }
      return pop;
    }
    // const group = getConnectedBubbles(gridBubble, row, col, bubble.color);
    const group = colorFlood(gridBubble, row, col, bubbleFired.color);

    if (group.length >= 3) {
      for (let index = 0; index < group.length; index++) {
        removeBubble(gridBubble, group[index][0], group[index][1]);
      }
      return group.length;
    } else {
      return 0;
    }
  };

  const addBubbleNext = (
    gridBubble: Record<string, Bubble>,
    bubbleQueue: any
  ) => {
    const bubbleX = bubbleStartX - (bubbleQueue.length + 1) * bubbleDiameter;
    const bubble: Bubble = {
      x: bubbleX,
      y: bubbleStartY,
      speed: BUBBLE_SPEED,
      speedX: 0,
      speedY: 0,
      r: grid.bubbleDiameter / 2,
      color: randomColor(getAllColors(gridBubble)),
      isMoving: false,
      isSpecial: false,
    };
    if (bubble.isSpecial) {
      isGenerateSpecialBall.current = true;
    }
    bubbleQueue.push(bubble);
  };

  const initValuesForm = () => {
    const initialValues: any = {
      time: gameState.defaultTime,
      moveDown: gameProperties.current.moveDownInterval,
    };
    for (let i = 0; i < gameProperties.current.color.length; i++) {
      const propName = `color-${i}`;
      const propValue = gameProperties.current.color[i];
      initialValues[propName] = propValue;
    }
    return initialValues;
  };

  const drawBubble = (bubble: Bubble, p5: p5Types): void => {
    if (getSize(gridBubble.current) !== 0) {
      const centerX: number = bubble.x;
      const centerY: number = bubble.y;
      
      // Handle bounce animation (disabled when loaded from storage, but allow attachment animations)
      let bounceOffset = 0;
      let bounceScale = 1;
      if (bubble.animationProps) {
        const timeSinceStart = p5.frameCount - bubble.animationProps.startTime;
        const progress = timeSinceStart / 30; // 30 frames duration
        
        if (progress < 1) {
          // More bouncy effect using multiple sine waves
          const bounce = Math.sin(progress * Math.PI * 4) * Math.exp(-progress * 2.5) + 
                        Math.sin(progress * Math.PI * 6) * Math.exp(-progress * 4) * 0.5;
          bounceOffset = bounce * 15; // 15px bounce height (increased from 8px)
          bounceScale = 1 + bounce * 0.3; // 30% scale effect (increased from 20%)
          
          // Clear animation when done
          if (progress >= 1) {
            bubble.animationProps = undefined;
          }
        }
      }
      
      if (bubble.isSpecial === true) {
        const imgWidth: number = image.imageSpecialBall.width;
        const imgHeight: number = image.imageSpecialBall.height;
        const imgX: number = centerX - imgWidth / 2;
        const imgY: number = centerY - imgHeight / 2;
        
        p5.push();
        p5.translate(bubble.x, bubble.y + bounceOffset);
        p5.scale(bounceScale);
        p5.noFill();
        p5.image(image.imageSpecialBall, imgX - bubble.x, imgY - bubble.y);
        p5.ellipse(0, 0, bubble.r * 2);
        p5.pop();
      } else {
        // Try to draw using sprite atlas first
        const spriteDrawn = drawBubbleSprite(p5, bubble.x, bubble.y, bubble.color, bubble.r, bounceScale, bounceOffset);
        
        // If sprite drawing failed, fall back to original method
        if (!spriteDrawn) {
          const centerX: number = bubble.x;
          const centerY: number = bubble.y;
          const imgWidth: number = image.imageDraw.width;
          const imgHeight: number = image.imageDraw.height;
          const imgDiameter: number = Math.max(imgWidth, imgHeight);
          const imgScale: number = (bubble.r * 2) / imgDiameter;
          const imgX: number = centerX - (imgWidth / 2) * imgScale;
          const imgY: number = centerY - (imgHeight / 2) * imgScale;
          
          p5.push();
          p5.translate(bubble.x, bubble.y + bounceOffset);
          p5.scale(bounceScale);
          p5.fill(bubble.color);
          p5.noStroke();
          p5.ellipse(0, 0, bubble.r * 2);
          p5.image(
            image.imageDraw,
            -imgWidth * imgScale / 2,
            -imgHeight * imgScale / 2,
            imgWidth * imgScale,
            imgHeight * imgScale
          );
          p5.pop();
        }
      }
    }
  };

  const drawBubblePopping = (removeBubbles: any[], p5: p5Types) => {
    for (let i = removeBubbles.length - 1; i >= 0; i--) {
      const bubble = removeBubbles[i];
      
      // Initialize individual bubble pop animation
              if (bubble.popStartTime === undefined) {
          bubble.popStartTime = p5.millis();
          bubble.popDelay = i * 80; // Each bubble starts 80ms after the previous one (even faster)
          bubble.popDuration = 450; // 450ms for even faster, still visible fade
          bubble.popScale = 1.0;
          bubble.popAlpha = 1.0;
          bubble.popPhase = 0;
          bubble.scoreShown = false; // Track if score animation has been shown
        }
      
      // Calculate animation progress with individual delay
      const elapsed = p5.millis() - bubble.popStartTime - bubble.popDelay;
      bubble.popPhase = Math.min(Math.max(elapsed / bubble.popDuration, 0), 1);
      
      // Smooth easing for individual bubble fade
      const easeOutCubic = (t: number) => {
        return 1 - Math.pow(1 - t, 3);
      };
      
      const easeInOutSine = (t: number) => {
        return -(Math.cos(Math.PI * t) - 1) / 2;
      };
      
      // Individual bubble alpha animation (removed scale animation)
      let alphaMultiplier = 1.0;
      if (bubble.popPhase > 0.1) {
        const fadeProgress = (bubble.popPhase - 0.1) / 0.9;
        alphaMultiplier = 1.0 - easeOutCubic(fadeProgress);
      }
      
      // Apply values
      bubble.popAlpha = Math.max(0, alphaMultiplier);
      
      // Draw the individual popping bubble with real bubble image
      if (bubble.popAlpha > 0) {
        p5.push();
        p5.translate(bubble.x, bubble.y);
        
        // Get the correct bubble image
        const imageBubble = bubble.isSpecial
          ? image.imageSpecialBall
          : image.imageDraw;
        
        // Draw glow effect with bubble's real color
        p5.push();
        p5.noStroke();
        const glowAlpha = Math.floor(bubble.popAlpha * 150);
        p5.fill(bubble.color + glowAlpha.toString(16).padStart(2, '0'));
        p5.ellipse(0, 0, bubble.r * 2 + 20);
        p5.pop();
        
        // Try to draw using sprite atlas first
        const spriteDrawn = drawBubbleSprite(p5, 0, 0, bubble.color, bubble.r, 1, 0);
        
        // If sprite drawing failed, fall back to original method
        if (!spriteDrawn) {
          p5.push();
          p5.tint(255, bubble.popAlpha * 255);
          p5.image(imageBubble, -bubble.r, -bubble.r, bubble.r * 2, bubble.r * 2);
          p5.pop();
        }
        
        p5.pop();
      }
      
      // Show score animation when bubble starts popping (at 10% of animation)
      if (bubble.popPhase >= 0.1 && !bubble.scoreShown) {
        bubble.scoreShown = true;
        // Create score animation at bubble position with real score
        const scoreValue = 30; // Real score per bubble (pop * 30)
        const scoreAnim = {
          x: bubble.x,
          y: bubble.y,
          value: scoreValue,
          startTime: p5.millis(),
          duration: 1200, // Faster score animation (1200ms) for better responsiveness
          alpha: 1.0,
          scale: 1.0,
          offsetY: 0,
          rotation: 0,
          rotationSpeed: p5.random(-0.04, 0.04) // Slightly faster rotation
        };
        
        // Add to score animations array
        if (!scoreAnimations.current) {
          scoreAnimations.current = [];
        }
        scoreAnimations.current.push(scoreAnim);
      }
      
      // Remove when individual animation complete
      if (bubble.popPhase >= 1) {
        removeBubbles.splice(i, 1);
      }
    }
  };

  // Draw score animations
  const drawScoreAnimations = (p5: p5Types) => {
    for (let i = scoreAnimations.current.length - 1; i >= 0; i--) {
      const scoreAnim = scoreAnimations.current[i];
      
      // Calculate animation progress
      const elapsed = p5.millis() - scoreAnim.startTime;
      const progress = Math.min(elapsed / scoreAnim.duration, 1);
      
      // Easing functions for smooth animation
      const easeOutCubic = (t: number) => {
        return 1 - Math.pow(1 - t, 3);
      };
      
      // Update animation properties
      scoreAnim.alpha = 1.0 - easeOutCubic(progress);
      scoreAnim.scale = 1.0 + (1.2 * easeOutCubic(progress)); // Even more scale effect
      scoreAnim.offsetY = -60 * easeOutCubic(progress); // More upward movement
      scoreAnim.rotation += scoreAnim.rotationSpeed;
      
      // Draw score text with enhanced glow effect
      if (scoreAnim.alpha > 0) {
        p5.push();
        p5.translate(scoreAnim.x, scoreAnim.y + scoreAnim.offsetY);
        p5.scale(scoreAnim.scale);
        p5.rotate(scoreAnim.rotation);
        
        // Draw outer glow effect (larger and more intense)
        p5.push();
        p5.fill(255, 255, 255, scoreAnim.alpha * 80);
        p5.noStroke();
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.textSize(32); // Increased from 24
        p5.textFont('"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif');
        p5.text(scoreAnim.value.toString(), 0, 0);
        p5.pop();
        
        // Draw middle glow effect
        p5.push();
        p5.fill(255, 255, 255, scoreAnim.alpha * 150);
        p5.noStroke();
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.textSize(30); // Increased from 22
        p5.textFont('"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif');
        p5.text(scoreAnim.value.toString(), 0, 0);
        p5.pop();
        
        // Draw main score text (bolder and bigger)
        p5.push();
        p5.fill(255, 255, 255, scoreAnim.alpha * 255); // White color
        p5.noStroke();
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.textSize(28); // Increased from 22
        p5.textStyle(p5.BOLD); // Make text bold
        p5.textFont('"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif');
        p5.text(scoreAnim.value.toString(), 0, 0);
        p5.pop();
        
        // Draw additional sparkle effect
        p5.push();
        p5.fill(255, 255, 0, scoreAnim.alpha * 200); // Yellow sparkle
        p5.noStroke();
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.textSize(26);
        p5.textFont('"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif');
        p5.text("+", 0, 0);
        p5.pop();
        
        p5.pop();
      }
      
      // Remove when animation complete
      if (progress >= 1) {
        scoreAnimations.current.splice(i, 1);
      }
    }
  };

  // Animation state for swap elements
  const swapAnimationTime = useRef<number>(0);
  const arcAnimationPhase = useRef<number>(0);
  const dashAnimationPhase = useRef<number>(0);
  const swapAnimationProgress = useRef<number>(0);
  const isSwapAnimating = useRef<boolean>(false);
  
  // Hover target state for arrow
  const hoverTarget = useRef<{x: number, y: number}>({x: 0, y: 0});
  const isHolding = useRef<boolean>(false);
  const isInSwapArea = useRef<boolean>(false);
  
  // Trajectory prediction state
  const predictedTrajectory = useRef<{x: number, y: number}[]>([]);
  const isShowingTrajectory = useRef<boolean>(false);
  const isFollowingPredictedPath = useRef<boolean>(false);
  const predictedPathIndex = useRef<number>(0);
  const isShootingBlocked = useRef<boolean>(false); // Global flag to block all shooting
  
  // Score animations
  const scoreAnimations = useRef<any[]>([]);

  const drawSwapArrow = (p5: p5Types) => {
    const launcherX = gameWidth / 2;
    const launcherY = gameHeight - 80;
    
    // Animate dash positions
    dashAnimationPhase.current += 0.1;
    const dashOffset = Math.sin(dashAnimationPhase.current) * 3;
    
    // Get current bubble color for the arrow
    const currentColor = activeBubble.current.color;
    
    // Draw vertical dashed line with arrowhead
    p5.push();
    p5.stroke(currentColor); // Use current bubble color
    p5.strokeWeight(4);
    p5.noFill();
    
    // Remove the vertical arrow - not needed for this design
    p5.pop();
  };

  const drawSwapArc = (p5: p5Types) => {
    const launcherX = gameWidth / 2;
    const launcherY = gameHeight - 80;
    
    // Animate arc
    arcAnimationPhase.current += 0.05;
    const arcOffset = Math.sin(arcAnimationPhase.current) * 2;
    
    // Get current bubble color for the arc
    const currentColor = activeBubble.current.color;
    
    // Draw circular arc with arrowhead
    p5.push();
    p5.stroke(currentColor); // Use current bubble color
    p5.strokeWeight(4);
    p5.noFill();
    
    // Draw animated arc connecting both bubbles from their centers
    const currentBubbleX = launcherX - 20;
    const currentBubbleY = launcherY - 15;
    const nextBubbleX = launcherX + 20;
    const nextBubbleY = launcherY + 15;
    
    // Calculate center point between bubbles
    const centerX = (currentBubbleX + nextBubbleX) / 2;
    const centerY = (currentBubbleY + nextBubbleY) / 2;
    
    // Calculate radius to connect from middle of each bubble
    const distance = Math.sqrt(Math.pow(nextBubbleX - currentBubbleX, 2) + Math.pow(nextBubbleY - currentBubbleY, 2));
    const circleRadius = distance / 2 + 5; // Small padding while maintaining center connection
    
    // Animate the circle going around
    const circleOffset = arcAnimationPhase.current * 2; // Full rotation
    
    // Draw complete circle with rotation animation
    p5.arc(centerX, centerY, circleRadius * 2, circleRadius * 2, circleOffset, circleOffset + p5.TWO_PI);
    
    // Handle swap animation
    if (isSwapAnimating.current) {
      swapAnimationProgress.current += 0.035;
      if (swapAnimationProgress.current >= 1) {
        isSwapAnimating.current = false;
        swapAnimationProgress.current = 0;
      }
      
      // Draw animated bubbles flowing through the arc
      const progress = swapAnimationProgress.current;
      const easeProgress = 1 - Math.pow(1 - progress, 2); // Ease out
      
      // Calculate the exact radius needed to connect from bubble centers
      const bubbleRadius = 15; // Same as in drawDualBubbleLauncher
      const actualDistance = Math.sqrt(Math.pow(nextBubbleX - currentBubbleX, 2) + Math.pow(nextBubbleY - currentBubbleY, 2));
      const arcRadius = actualDistance / 2; // This ensures connection from bubble centers
      
      // Current bubble flows through arc clockwise
      const currentStartAngle = Math.atan2(currentBubbleY - centerY, currentBubbleX - centerX);
      const currentEndAngle = Math.atan2(nextBubbleY - centerY, nextBubbleX - centerX);
      const currentAngle = p5.lerp(currentStartAngle, currentEndAngle, easeProgress);
      const currentFlowX = centerX + arcRadius * Math.cos(currentAngle);
      const currentFlowY = centerY + arcRadius * Math.sin(currentAngle);
      
      // Next bubble flows through arc in the same direction as current
      const nextStartAngle = Math.atan2(nextBubbleY - centerY, nextBubbleX - centerX);
      const nextEndAngle = Math.atan2(currentBubbleY - centerY, currentBubbleX - centerX);
      // Add 2*PI to make it flow in the same direction
      const nextAngle = p5.lerp(nextStartAngle, nextEndAngle + 2 * Math.PI, easeProgress);
      const nextFlowX = centerX + arcRadius * Math.cos(nextAngle);
      const nextFlowY = centerY + arcRadius * Math.sin(nextAngle);
      
      // Draw flowing bubbles with opposite colors during animation
      p5.push();
      
      // Current bubble flowing to next position (shows opposite color during animation)
      p5.fill(secondaryBubble.current.color); // Opposite color
      p5.noStroke();
      p5.ellipse(currentFlowX, currentFlowY, 30); // 15 * 2
      
      // Overlay bubble.png image
      const imgWidth = image.imageDraw.width;
      const imgHeight = image.imageDraw.height;
      const imgScale = 30 / Math.max(imgWidth, imgHeight);
      p5.image(
        image.imageDraw,
        currentFlowX - imgWidth * imgScale / 2,
        currentFlowY - imgHeight * imgScale / 2,
        imgWidth * imgScale,
        imgHeight * imgScale
      );
      
      // Next bubble flowing to current position (shows opposite color during animation)
      p5.fill(activeBubble.current.color); // Opposite color
      p5.noStroke();
      p5.ellipse(nextFlowX, nextFlowY, 30);
      
      // Overlay bubble.png image
      p5.image(
        image.imageDraw,
        nextFlowX - imgWidth * imgScale / 2,
        nextFlowY - imgHeight * imgScale / 2,
        imgWidth * imgScale,
        imgHeight * imgScale
      );
      
      p5.pop();
    }
    

    p5.pop();
  };

  const swapBubbles = () => {
    // Rotate all three bubbles in a triangle pattern
    const temp = activeBubble.current;
    activeBubble.current = secondaryBubble.current;
    secondaryBubble.current = tertiaryBubble.current;
    tertiaryBubble.current = temp;
    isSwapping.current = true;
    swapAnimation.current = Date.now();
    isSwapAnimating.current = true;
    swapAnimationProgress.current = 0;
    
    // Reset the swap area flag after animation completes
    setTimeout(() => {
      isInSwapArea.current = false;
    }, 1000); // Animation takes about 1 second
  };

  const drawCircleArc = (p5: p5Types) => {
    const launcherX = gameWidth / 2;
    const launcherY = gameHeight - 80;
    
    // Animate arc
    arcAnimationPhase.current += 0.05;
    const arcOffset = Math.sin(arcAnimationPhase.current) * 2;
    
    // Safety check: ensure active bubble exists and has valid color
    if (!activeBubble.current || !activeBubble.current.color) {
      return; // Don't draw if bubble is undefined
    }
    
    // Get current bubble color for the arc
    const currentColor = activeBubble.current.color;
    
    // Calculate circle center and radius
    const topBubbleX = launcherX;
    const topBubbleY = launcherY - 35;
    const leftBubbleX = launcherX - 30;
    const leftBubbleY = launcherY + 20;
    const rightBubbleX = launcherX + 30;
    const rightBubbleY = launcherY + 20;
    
    const centerX = (topBubbleX + leftBubbleX + rightBubbleX) / 3;
    const centerY = (topBubbleY + leftBubbleY + rightBubbleY) / 3;
    
    // Calculate the exact radius to connect from bubble centers
    const bubbleRadius = 18; // Slightly smaller than main bubbles for launcher
    const distance1 = Math.sqrt(Math.pow(topBubbleX - centerX, 2) + Math.pow(topBubbleY - centerY, 2));
    const distance2 = Math.sqrt(Math.pow(leftBubbleX - centerX, 2) + Math.pow(leftBubbleY - centerY, 2));
    const distance3 = Math.sqrt(Math.pow(rightBubbleX - centerX, 2) + Math.pow(rightBubbleY - centerY, 2));
    const maxDistance = Math.max(distance1, distance2, distance3);
    const circleRadius = maxDistance; // No padding - exact connection
    
    // Simple stroke weight
    const strokeWeight = 4;
    
    // Draw simple circular outline connecting bubble centers
    p5.push();
    p5.stroke(currentColor);
    p5.strokeWeight(strokeWeight);
    p5.noFill();
    p5.ellipse(centerX, centerY, circleRadius * 2);
    p5.pop();
    
    // Handle swap animation
    if (isSwapAnimating.current) {
      swapAnimationProgress.current += 0.035;
      if (swapAnimationProgress.current >= 1) {
        isSwapAnimating.current = false;
        swapAnimationProgress.current = 0;
      }
      
      // Draw animated bubbles flowing through the triangle
      const progress = swapAnimationProgress.current;
      const easeProgress = 1 - Math.pow(1 - progress, 2); // Ease out
      
      // Calculate triangle center
      const centerX = (topBubbleX + leftBubbleX + rightBubbleX) / 3;
      const centerY = (topBubbleY + leftBubbleY + rightBubbleY) / 3;
      
      // Safety check for animation bubbles
      if (!secondaryBubble.current || !tertiaryBubble.current || !activeBubble.current) {
        return; // Don't draw animation if bubbles are undefined
      }
      
      // Draw flowing bubbles with sprites during animation
      p5.push();
      
      // Top bubble flowing to left position
      const topToLeftX = p5.lerp(topBubbleX, leftBubbleX, easeProgress);
      const topToLeftY = p5.lerp(topBubbleY, leftBubbleY, easeProgress);
      const topToLeftSpriteDrawn = drawBubbleSprite(p5, topToLeftX, topToLeftY, secondaryBubble.current.color, 18);
      if (!topToLeftSpriteDrawn) {
        p5.fill(secondaryBubble.current.color || '#ffffff');
        p5.noStroke();
        p5.ellipse(topToLeftX, topToLeftY, 36);
      }
      
      // Left bubble flowing to right position
      const leftToRightX = p5.lerp(leftBubbleX, rightBubbleX, easeProgress);
      const leftToRightY = p5.lerp(leftBubbleY, rightBubbleY, easeProgress);
      const leftToRightSpriteDrawn = drawBubbleSprite(p5, leftToRightX, leftToRightY, tertiaryBubble.current.color, 18);
      if (!leftToRightSpriteDrawn) {
        p5.fill(tertiaryBubble.current.color || '#ffffff');
        p5.noStroke();
        p5.ellipse(leftToRightX, leftToRightY, 36);
      }
      
      // Right bubble flowing to top position
      const rightToTopX = p5.lerp(rightBubbleX, topBubbleX, easeProgress);
      const rightToTopY = p5.lerp(rightBubbleY, topBubbleY, easeProgress);
      const rightToTopSpriteDrawn = drawBubbleSprite(p5, rightToTopX, rightToTopY, activeBubble.current.color, 18);
      if (!rightToTopSpriteDrawn) {
        p5.fill(activeBubble.current.color || '#ffffff');
        p5.noStroke();
        p5.ellipse(rightToTopX, rightToTopY, 36);
      }
      
      // Note: Sprites are already drawn above, no need for overlay images
      
      p5.pop();
    }
  };

  // External container positioning - removed P5.js drawing
  const getExternalContainerBounds = () => {
    const containerElement = document.querySelector('.external-grid-container') as HTMLElement;
    if (containerElement) {
      const rect = containerElement.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height
      };
    }
    return null;
  };

  const updateTrajectoryPrediction = (p5: p5Types) => {
    // Only update trajectory if we're holding and not in swap area
    if (!isHolding.current || activeBubble.current.isMoving) {
      isShowingTrajectory.current = false;
      return;
    }
    
    // Limit trajectory updates to every 2 frames for smoother updates
    if (p5.frameCount % 2 !== 0) {
      return;
    }
    
    // Check if we're in swap area - if so, don't show trajectory
    const launcherX = gameWidth / 2;
    const launcherY = gameHeight - 80;
    const launcherAreaX = launcherX - 60;
    const launcherAreaY = launcherY - 40;
    const launcherAreaWidth = 120;
    const launcherAreaHeight = 80;
    
    // Get current mouse/touch position
    let targetX = p5.mouseX;
    let targetY = p5.mouseY;
    
    // For touch events, use the first touch position
    if (p5.touches && p5.touches.length > 0) {
      const touch = p5.touches[0] as any;
      targetX = touch.x;
      targetY = touch.y;
    }
    
    // Check if we're in swap area
    if (
      targetX >= launcherAreaX &&
      targetX <= launcherAreaX + launcherAreaWidth &&
      targetY >= launcherAreaY &&
      targetY <= launcherAreaY + launcherAreaHeight
    ) {
      isShowingTrajectory.current = false;
      return;
    }
    
    // Ensure we have valid coordinates
    if (targetX === 0 && targetY === 0) {
      isShowingTrajectory.current = false;
      return;
    }
    
    const bubbleLauncherX = launcherX;
    const bubbleLauncherY = launcherY - 35; // Top bubble position
    
    // Calculate shoot direction for trajectory prediction only
    const { speedX, speedY } = calculateShootDirection(
      bubbleLauncherX,
      bubbleLauncherY,
      targetX,
      targetY,
      activeBubble.current.speed
    );
    
    // Predict trajectory for display only - don't store it for shooting
    const predictedPath = predictTrajectory(
      bubbleLauncherX,
      bubbleLauncherY,
      speedX,
      speedY,
      gridBubble.current,
      gridRef.current,
      gameWidth,
      gameHeight
    );
    
    // Only show trajectory if we have a valid path
    if (predictedPath.length >= 2) {
      predictedTrajectory.current = predictedPath;
      isShowingTrajectory.current = true;

    } else {
      isShowingTrajectory.current = false;
    }
  };

  const drawTrajectoryArrow = (p5: p5Types) => {
    if (!isShowingTrajectory.current || predictedTrajectory.current.length < 2) {
      return;
    }

    // Check if trajectory goes below the active bubble's Y position
    const activeBubbleY = gameHeight - 80 - 35; // Active bubble Y position
    const trajectoryPath = predictedTrajectory.current;

    // Check if any point goes below the active bubble's Y position
    let shouldHide = false;
    for (let i = 0; i < trajectoryPath.length; i++) {
      if (trajectoryPath[i].y > activeBubbleY) {
        shouldHide = true;
        break;
      }
    }
    
    if (shouldHide) {
      isShootingBlocked.current = true; // Set global blocking flag
      return; // Don't draw the trajectory if it goes below the active bubble's Y position
    }
    
    isShootingBlocked.current = false; // Clear global blocking flag

    
    p5.push();
    
    const trajectory = predictedTrajectory.current;
    const bubbleColor = getVisualColor(activeBubble.current.color);
    
    // Calculate angle from start to end for direction
    const startPoint = trajectory[0];
    const endPoint = trajectory[trajectory.length - 1];
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const angle = Math.atan2(dy, dx);
    
    // Calculate total trajectory length
    let totalLength = 0;
    for (let i = 1; i < trajectory.length; i++) {
      const segmentLength = Math.sqrt(
        Math.pow(trajectory[i].x - trajectory[i-1].x, 2) + 
        Math.pow(trajectory[i].y - trajectory[i-1].y, 2)
      );
      totalLength += segmentLength;
    }
    
    // Draw animated dots with consistent spacing regardless of trajectory length
    const dotSpacing = 12; // Reduced spacing for more dots
    const dotCount = Math.max(12, Math.min(80, Math.floor(totalLength / dotSpacing))); // More dots for longer trajectories
    
    // Dynamic speed based on trajectory length - longer trajectories move slower
    const baseSpeed = 0.002; // Slower base speed
    const speedMultiplier = Math.max(0.2, Math.min(1.0, 300 / totalLength)); // More aggressive speed reduction
    const dotSpeed = baseSpeed * speedMultiplier;
    const dotProgress = (p5.frameCount * dotSpeed) % 1; // Continuous loop
    
    for (let i = 0; i < dotCount; i++) {
      // Calculate animated position for each dot along the trajectory
      const baseProgress = i / (dotCount - 1);
      const animatedProgress = (baseProgress + dotProgress) % 1; // Add travel offset
      const dotDistance = animatedProgress * totalLength;
      
      // Find position along the trajectory path
      let currentLength = 0;
      let dotX = startPoint.x;
      let dotY = startPoint.y;
      
      for (let j = 1; j < trajectory.length; j++) {
        const segmentLength = Math.sqrt(
          Math.pow(trajectory[j].x - trajectory[j-1].x, 2) + 
          Math.pow(trajectory[j].y - trajectory[j-1].y, 2)
        );
        
        if (currentLength + segmentLength >= dotDistance) {
          // Interpolate within this segment
          const segmentProgress = (dotDistance - currentLength) / segmentLength;
          dotX = p5.lerp(trajectory[j-1].x, trajectory[j].x, segmentProgress);
          dotY = p5.lerp(trajectory[j-1].y, trajectory[j].y, segmentProgress);
          break;
        }
        
        currentLength += segmentLength;
      }
      
      // Animated dots with bigger size and colorful appearance
      const dotSize = 6; // Bigger dots (increased from 4)
      
      // Create gradient effect based on position
      const fadeFactor = 1 - (i / dotCount); // Fade from start to end
      const alpha = 150 + (fadeFactor * 105); // 150-255 alpha range
      
      // Draw colorful dots with bubble color
      p5.fill(bubbleColor + Math.floor(alpha).toString(16).padStart(2, '0')); // Bubble color with alpha
      p5.noStroke();
      p5.ellipse(dotX, dotY, dotSize);
      
      // Add bright glow effect around animated dots
      p5.fill(bubbleColor + '60'); // Bubble color with more transparency for glow
      p5.ellipse(dotX, dotY, dotSize + 4); // Bigger glow for bigger dots
      
      // Add white center highlight for extra brightness
      p5.fill(255, 255, 255, 100); // White highlight
      p5.ellipse(dotX, dotY, dotSize - 1); // Smaller white center
    }
    
    p5.pop();
  };

  const drawHoverArrow = (p5: p5Types, startX: number, startY: number, targetX: number, targetY: number, color: string) => {
    // Don't draw arrow if swapping is happening or in swap area
    if (isSwapAnimating.current || swapAnimationProgress.current > 0 || isInSwapArea.current) {
      return;
    }

    // Check if hover arrow goes below the active bubble's Y position
    const activeBubbleY = gameHeight - 80 - 35; // Active bubble Y position
    
    // Calculate if the hover arrow goes below the active bubble
    const checkDx = targetX - startX;
    const checkDy = targetY - startY;
    const checkAngle = Math.atan2(checkDy, checkDx);
    const checkDistance = Math.sqrt(checkDx * checkDx + checkDy * checkDy);
    const checkMaxArrowLength = 150;
    const checkArrowLength = Math.min(checkDistance, checkMaxArrowLength);
    
    // Check if the end point of the arrow goes below the active bubble
    const checkEndX = startX + Math.cos(checkAngle) * checkArrowLength;
    const checkEndY = startY + Math.sin(checkAngle) * checkArrowLength;
    
    if (checkEndY > activeBubbleY) {
      isShootingBlocked.current = true; // Set global blocking flag
      return; // Don't draw the hover arrow if it goes below the active bubble's Y position
    }
    
    isShootingBlocked.current = false; // Clear global blocking flag
    
    p5.push();
    p5.noStroke();
    
    // Calculate angle from launcher to target
    const dx = targetX - startX;
    const dy = targetY - startY;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Limit arrow length
    const maxArrowLength = 150; // Even longer arrow
    const arrowLength = Math.min(distance, maxArrowLength);
    
    // Draw animated dots with consistent spacing regardless of arrow length
    const dotSpacing = 12; // Reduced spacing for more dots
    const dotCount = Math.max(8, Math.min(60, Math.floor(arrowLength / dotSpacing))); // More dots for longer arrows
    
    // Dynamic speed based on arrow length - longer arrows move slower
    const baseSpeed = 0.002; // Slower base speed
    const speedMultiplier = Math.max(0.2, Math.min(1.0, 200 / arrowLength)); // More aggressive speed reduction
    const dotSpeed = baseSpeed * speedMultiplier;
    const dotProgress = (p5.frameCount * dotSpeed) % 1; // Continuous loop
    
    for (let i = 0; i < dotCount; i++) {
      // Calculate animated position for each dot
      const baseProgress = i / (dotCount - 1);
      const animatedProgress = (baseProgress + dotProgress) % 1; // Add travel offset
      const dotDistance = animatedProgress * arrowLength;
      
      const x = startX + Math.cos(angle) * dotDistance;
      const y = startY + Math.sin(angle) * dotDistance;
      
      // Animated dots with bigger size and colorful appearance
      const dotSize = 6; // Bigger dots (increased from 4)
      
      // Create gradient effect based on position
      const fadeFactor = 1 - (i / dotCount); // Fade from start to end
      const alpha = 150 + (fadeFactor * 105); // 150-255 alpha range
      
      // Draw colorful dots with bubble color
      p5.fill(color + Math.floor(alpha).toString(16).padStart(2, '0')); // Bubble color with alpha
      p5.ellipse(x, y, dotSize);
      
      // Add bright glow effect around animated dots
      p5.fill(color + '60'); // Bubble color with more transparency for glow
      p5.ellipse(x, y, dotSize + 4); // Bigger glow for bigger dots
      
      // Add white center highlight for extra brightness
      p5.fill(255, 255, 255, 100); // White highlight
      p5.ellipse(x, y, dotSize - 1); // Smaller white center
    }
    
    p5.pop();
  };

  const drawTripleBubbleLauncher = (p5: p5Types) => {
    const launcherX = gameWidth / 2;
    const launcherY = gameHeight - 80;
    const bubbleRadius = 18; // Slightly smaller than main bubbles for launcher
    
    // Draw circular outline first (behind bubbles - lower z-index)
    drawCircleArc(p5);
    
    // Draw static bubbles only when not animating
    if (!isSwapAnimating.current) {
      // Safety check: ensure bubbles exist and have valid colors
      if (!activeBubble.current || !secondaryBubble.current || !tertiaryBubble.current) {
        return; // Don't draw if bubbles are undefined
      }
      
      // Draw active bubble (top)
      p5.push();
      p5.translate(launcherX, launcherY - 35);
      
      // Try to draw using sprite atlas first
      const activeSpriteDrawn = drawBubbleSprite(p5, 0, 0, activeBubble.current.color, bubbleRadius);
      
      // If sprite drawing failed, fall back to original method
      if (!activeSpriteDrawn) {
        p5.fill(activeBubble.current.color || '#ffffff'); // Fallback color
        p5.noStroke();
        p5.ellipse(0, 0, bubbleRadius * 2);
        // Overlay bubble image
        const imgWidth = image.imageDraw.width;
        const imgHeight = image.imageDraw.height;
        const imgScale = (bubbleRadius * 2) / Math.max(imgWidth, imgHeight);
        p5.image(
          image.imageDraw,
          -imgWidth * imgScale / 2,
          -imgHeight * imgScale / 2,
          imgWidth * imgScale,
          imgHeight * imgScale
        );
      }
      p5.pop();
      
      // Draw secondary bubble (bottom-left)
      p5.push();
      p5.translate(launcherX - 30, launcherY + 20);
      
      // Try to draw using sprite atlas first
      const secondarySpriteDrawn = drawBubbleSprite(p5, 0, 0, secondaryBubble.current.color, bubbleRadius);
      
      // If sprite drawing failed, fall back to original method
      if (!secondarySpriteDrawn) {
        p5.fill(secondaryBubble.current.color || '#ffffff'); // Fallback color
        p5.noStroke();
        p5.ellipse(0, 0, bubbleRadius * 2);
        // Overlay bubble image
        const imgWidth = image.imageDraw.width;
        const imgHeight = image.imageDraw.height;
        const imgScale = (bubbleRadius * 2) / Math.max(imgWidth, imgHeight);
        p5.image(
          image.imageDraw,
          -imgWidth * imgScale / 2,
          -imgHeight * imgScale / 2,
          imgWidth * imgScale,
          imgHeight * imgScale
        );
      }
      p5.pop();
      
      // Draw tertiary bubble (bottom-right)
      p5.push();
      p5.translate(launcherX + 30, launcherY + 20);
      
      // Try to draw using sprite atlas first
      const tertiarySpriteDrawn = drawBubbleSprite(p5, 0, 0, tertiaryBubble.current.color, bubbleRadius);
      
      // If sprite drawing failed, fall back to original method
      if (!tertiarySpriteDrawn) {
        p5.fill(tertiaryBubble.current.color || '#ffffff'); // Fallback color
        p5.noStroke();
        p5.ellipse(0, 0, bubbleRadius * 2);
        // Overlay bubble image
        const imgWidth = image.imageDraw.width;
        const imgHeight = image.imageDraw.height;
        const imgScale = (bubbleRadius * 2) / Math.max(imgWidth, imgHeight);
        p5.image(
          image.imageDraw,
          -imgWidth * imgScale / 2,
          -imgHeight * imgScale / 2,
          imgWidth * imgScale,
          imgHeight * imgScale
        );
      }
      p5.pop();
      
      // Draw hover arrow if holding (but not during swap animation or in swap area)
      if (isHolding.current && !isSwapAnimating.current && swapAnimationProgress.current === 0 && !isInSwapArea.current && !isShowingTrajectory.current) {
        drawHoverArrow(p5, launcherX, launcherY - 35, p5.mouseX, p5.mouseY, getVisualColor(activeBubble.current.color) || '#ffffff');
      }
    }
  };

  const loadNextBall = (bubble: any) => {
    const nextBubble = document.getElementById("nextBubble");
    if (nextBubble) {
      if (bubble.isSpecial) {
        nextBubble.innerHTML = `<img  src="/bubble-shooter/element/special-ball.png"  />`;
      } else {
        nextBubble.innerHTML = `<img  src="/bubble-shooter/background/bubble.png"  />`;
        nextBubble.style.background = bubble.color;
      }
    }
  };

  const preload = (p5: p5Types) => {
    // Load sprite atlas image
    image.spriteAtlas = p5.loadImage(
      SPRITE_ATLAS_CONFIG.IMAGE_PATH,
      () => {

      },
      () => {
        
      }
    );
    
    // Load sprite atlas JSON data
    p5.loadJSON(
      SPRITE_ATLAS_CONFIG.JSON_PATH,
      (data: any) => {
        image.spriteData = data;
        image.spritesLoaded = true;

      },
      () => {
        
      }
    );
    
    // Keep original images as fallback
    image.imageSpecialBall = p5.loadImage(
      "/bubble-shooter/element/special-ball.png",
      () => {
        image.imageSpecialBall.resize(bubbleDiameter, bubbleDiameter);
      }
    );
    image.imageDraw = p5.loadImage(
      "/bubble-shooter/background/bubble.png",
      () => {
        image.imageDraw.resize(bubbleDiameter, bubbleDiameter);
      }
    );
    
    // Load combo images
    image.comboNice = p5.loadImage("/bubble-shooter/nice.png");
    image.comboGreat = p5.loadImage("/bubble-shooter/great.png");
    image.comboAmazing = p5.loadImage("/bubble-shooter/amazing.png");
    image.comboIncredible = p5.loadImage("/bubble-shooter/incredible.png");
    image.comboLegendary = p5.loadImage("/bubble-shooter/legendary.png");
  };

  const setup = async (p5: p5Types, canvasParentRef: Element) => {
    // Clean up any existing modals from previous sessions
    cleanupExistingModals();
    
    p5.createCanvas(gameWidth, gameHeight).parent(canvasParentRef);
    
    // Prevent iOS selection menu and text selection
    const canvas = canvasParentRef.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      // Prevent context menu
      canvas.addEventListener('contextmenu', (e: Event) => {
        e.preventDefault();
        return false;
      });
      
      // Prevent text selection
      canvas.addEventListener('selectstart', (e: Event) => {
        e.preventDefault();
        return false;
      });
      
      // Prevent drag
      canvas.addEventListener('dragstart', (e: Event) => {
        e.preventDefault();
        return false;
      });
      
      // Prevent copy
      canvas.addEventListener('copy', (e: Event) => {
        e.preventDefault();
        return false;
      });
      
      // Prevent cut
      canvas.addEventListener('cut', (e: Event) => {
        e.preventDefault();
        return false;
      });
      
      // Prevent paste
      canvas.addEventListener('paste', (e: Event) => {
        e.preventDefault();
        return false;
      });
    }
    
    // Load highest score on startup
    loadHighestScore();

    // Then load game data
    const gameLoaded = await loadGameFromAPI();
    if (gameLoaded) {
      // Game was loaded from API
    } else {
      // Initialize fresh game state
      gridBubble.current = createGridBubble(gridRef.current, gameProperties.current.color);
      bubbleNext.current = createListBubbleNext(grid, bubbleStartX, bubbleStartY, gameProperties.current.color);
      activeBubble.current = bubbleNext.current[0];
      secondaryBubble.current = bubbleNext.current[1] || bubbleNext.current[0];
      tertiaryBubble.current = bubbleNext.current[2] || bubbleNext.current[0];
      setIsGameLoadedFromStorage(false);
    }
    
    setIsGameLoading(false);
    
    // Initial check for disconnected bubbles
    verifyGrid(gridBubble.current, removeBubbles);
  };

  const checkDisconnectedBubbles = (p5: p5Types) => {
    // Check for disconnected bubbles every 60 frames (about once per second)
    if (p5.frameCount % 60 === 0) {
      verifyGrid(gridBubble.current, removeBubbles);
    }
  };

  const draw = (p5: p5Types) => {
    p5.clear();

    if (isGameLoading) {
      return;
    }
    
    // Draw debug info for sprite loading
    p5.fill(255, 255, 255);
    p5.noStroke();
    p5.textSize(12);
                // Debug text removed for clean game appearance
    
    // Always check for game over, even when paused
    checkGameOVer(gridBubble.current);
    
    // COMPLETELY STOP rendering if any UI element is active
    if (isModalOpen || isModalSettingOpen || isMenuVisible || isLeaderboardOpen || isLanguageSelectorOpen || isInfoVisible) {
      return;
    }

    
    
    // Update flash effect
    if (flashEffect.duration > 0) {
      flashEffect.duration--;
      flashEffect.alpha = Math.max(0, flashEffect.alpha - 0.1);
    }
    
            // Update combo images
      for (let i = comboImages.length - 1; i >= 0; i--) {
        const comboImage = comboImages[i];
        comboImage.duration--;
        comboImage.alpha = Math.max(0, comboImage.alpha - 0.015); // Faster fade
        comboImage.scale += 0.008; // Faster scale
        comboImage.y -= 0.4; // Faster upward movement
        comboImage.pulsePhase += 0.1;
        comboImage.glowIntensity = 1 + 0.3 * Math.sin(comboImage.pulsePhase);
        
        if (comboImage.duration <= 0) {
          comboImages.splice(i, 1);
        }
      }

    // check is win
    checkIsWin(gridBubble.current);

    // Check for disconnected bubbles periodically
    checkDisconnectedBubbles(p5);

    // Draw game container background
    // External container is now drawn with CSS, no need for P5.js drawing
    

    
    // Draw flash effect
    if (flashEffect.alpha > 0) {
      p5.push();
      p5.fill(255, 255, 255, flashEffect.alpha * 255);
      p5.rect(0, 0, gameWidth, gameHeight);
      p5.pop();
    }
    
    // render bubble list
    renderBubbleList(p5, gridBubble.current);
    
    // Draw game over warning line - REMOVED
    // drawGameOverWarningLine(p5);
    
    // Update trajectory prediction
    updateTrajectoryPrediction(p5);

    // HARD BOUNDARY CONSTRAINT: Use minimal margins to match external container
    if (activeBubble.current) {
      const bubbleRadius = activeBubble.current.r;
      const externalContainerMargin = 5
      const externalContainerLeft = externalContainerMargin;
      const externalContainerRight = gameWidth - externalContainerMargin;
      
      const minX = externalContainerLeft + (-10) + bubbleRadius; // 10px from left border
      const maxX = externalContainerRight - (-10) - bubbleRadius; // 10px from right border

      if (activeBubble.current.x - bubbleRadius < minX || activeBubble.current.x + bubbleRadius > maxX) {
        if (activeBubble.current.x - bubbleRadius < minX) {
          activeBubble.current.x = minX + bubbleRadius + 1;
          activeBubble.current.speedX = -activeBubble.current.speedX;
        } else {
          activeBubble.current.x = maxX - bubbleRadius - 1;
          activeBubble.current.speedX = -activeBubble.current.speedX;
        }
      }
    }

    if (specialBubble.current.isAnswered === Answer.WRONG && activeBubble.current) {
      activeBubble.current.isSpecial = false;
    }

    // check when the bubble collides with the grid and insert bubble
    if (activeBubble.current && activeBubble.current.isMoving === true) {
      const [collision, loc] = checkCollision(
        activeBubble.current,
        gridBubble.current,
        gridRef.current
      );

      if (collision && Array.isArray(loc)) {
        // Shot hit and attached to grid - check if it broke any bubbles
        const pop = insertBubble(
          gridBubble.current,
          gridRef.current,
          activeBubble.current,
          loc[0],
          loc[1]
        );
        
        if (pop > 0) {
          // Shot broke bubbles - DON'T reset the round counter, just keep it as is
          
          let extra = verifyGrid(gridBubble.current, removeBubbles);
          gameProperties.current.score += caculateScore(pop + extra);
          
          // Play pop sound for each bubble that broke
          const totalBubblesBroke = pop + extra;
          if ((window as any).soundEffects && totalBubblesBroke > 0) {
            (window as any).soundEffects.playPopSound(totalBubblesBroke);
          }
          
          // Update highest score if current score is higher
          updateHighestScore();

          // Trigger flash effect for large explosions
          if (pop + extra >= 8) {
            flashEffect.alpha = 0.3;
            flashEffect.duration = 5;
          }
          
          // Add combo images for multiple bubbles
          if (pop + extra >= 4) {
            const comboImagesList = [image.comboNice, image.comboGreat, image.comboAmazing, image.comboIncredible, image.comboLegendary];
            const messageIndex = Math.min(comboImagesList.length - 1, Math.floor((pop + extra - 4) / 2));
            
            // Calculate better position to avoid canvas cutoff
            let comboY = activeBubble.current.y - 50;
            const minY = 100; // Minimum distance from top of canvas
            if (comboY < minY) {
              comboY = minY;
            }
            
            comboImages.push({
              image: comboImagesList[messageIndex],
              x: activeBubble.current.x,
              y: comboY,
              alpha: 1.0,
              scale: 0.8, // Start small for bounce effect
              duration: 120,
              rotation: 0,
              rotationSpeed: 0, // No rotation
              pulsePhase: 0,
              glowIntensity: 1.0
            });

            (window as any).soundEffects.playExcitingSound();
          }
        } else {
          // Shot attached but didn't break bubbles - count this shot
          gameProperties.current.shotsInRound++;
          
          // Add bounce/jiggle animation to the attached bubble and nearby bubbles
          const attachedBubble = gridBubble.current[`${loc[0]},${loc[1]}`];
          if (attachedBubble) {
            attachedBubble.animationProps = {
              startTime: p5.frameCount,
              startScale: 1.0,
              pulsePhase: 0,
              glowIntensity: 1.0
            };
            
            // Find nearby bubbles to create ripple effect
            const nearbyBubbles = [];
            const row = loc[0];
            const col = loc[1];
            
            // Check adjacent positions (hexagonal grid)
            const adjacentPositions = [
              [row-1, col], [row-1, col+1], [row, col+1], 
              [row+1, col], [row+1, col-1], [row, col-1]
            ];
            
            for (const [adjRow, adjCol] of adjacentPositions) {
              const key = `${adjRow},${adjCol}`;
              const nearbyBubble = gridBubble.current[key];
              if (nearbyBubble) {
                nearbyBubbles.push(nearbyBubble);
              }
            }
            
            // Add bounce animation to 2-3 random nearby bubbles
            const numToBounce = Math.min(3, nearbyBubbles.length);
            const shuffled = nearbyBubbles.sort(() => Math.random() - 0.5);
            
            for (let i = 0; i < numToBounce; i++) {
              const bubble = shuffled[i];
              bubble.animationProps = {
                startTime: p5.frameCount + (i * 3), // Stagger the animations
                startScale: 1.0,
                pulsePhase: 0,
                glowIntensity: 1.0
              };
            }
          }
        }

        renderBubbleList(p5, gridBubble.current);
        specialBubble.current.isAnswered = Answer.NOT_YET;
        bubbleNext.current.shift()!;
        addBubbleNext(gridBubble.current, bubbleNext.current);
        updateDirectionBubbleNext(bubbleNext.current, grid);

        activeBubble.current = bubbleNext.current[0];
        secondaryBubble.current = bubbleNext.current[1] || bubbleNext.current[0];
        activeBubble.current.x = bubbleStartX;
        activeBubble.current.y = bubbleStartY;
        activeBubble.current.speedX = 0;
        activeBubble.current.speedY = 0;
        activeBubble.current.isMoving = false;
        activeBubble.current.animationProps = undefined; // Reset animation
        isShowingTrajectory.current = false; // Clear trajectory when bubble stops
        isFollowingPredictedPath.current = false; // Reset predicted path following
        predictedPathIndex.current = 0;
        
        // Save game after bubble attaches to grid
        setTimeout(() => saveGameToLocalStorage(), 100);
      } else if (activeBubble.current.isMoving && activeBubble.current.y <= 0) {
        // Shot missed completely (went off screen) - count this shot
        gameProperties.current.shotsInRound++;
        
        // Reset bubble
        activeBubble.current.x = bubbleStartX;
        activeBubble.current.y = bubbleStartY;
        activeBubble.current.speedX = 0;
        activeBubble.current.speedY = 0;
        activeBubble.current.isMoving = false;
        activeBubble.current.animationProps = undefined;
        isShowingTrajectory.current = false; // Clear trajectory when bubble stops
        isFollowingPredictedPath.current = false; // Reset predicted path following
        predictedPathIndex.current = 0;
        
        // Save game after bubble goes off screen
        setTimeout(() => saveGameToLocalStorage(), 100);
      }
      
      // Check if we've used all 5 shots without breaking bubbles (moved outside collision detection)
      if (gameProperties.current.shotsInRound >= 4) {
        // Drop the entire grid down
        gridRef.current.numRows++;
        addRowBubbleList(
          gridBubble.current,
          gridRef.current,
          gameProperties.current.color
        );
        
        // Reset shots remaining to 5 for next round
        gameProperties.current.shotsInRound = 0;
        
        // Save game after grid moves down
        setTimeout(() => saveGameToLocalStorage(), 100);
      }
    }

    // Draw dual-bubble launcher
    drawTripleBubbleLauncher(p5);
    
    // Draw trajectory prediction arrow
    drawTrajectoryArrow(p5);
    
    // Draw hover arrow if holding (but not when trajectory is showing)
    if (isHolding.current && !isShowingTrajectory.current) {
      const launcherX = gameWidth / 2;
      const launcherY = gameHeight - 80;
      
      // Get target coordinates - handle both mouse and touch events
      let targetX = p5.mouseX;
      let targetY = p5.mouseY;
      
      // For touch events, use the first touch position
      if (p5.touches && p5.touches.length > 0) {
        const touch = p5.touches[0] as any;
        targetX = touch.x;
        targetY = touch.y;
      }
      
      // Use actual mouse/touch position instead of hoverTarget
      drawHoverArrow(p5, launcherX, launcherY - 35, targetX, targetY, getVisualColor(activeBubble.current.color) || '#ffffff');
    }

    // Arrow trajectory removed - will be re-implemented later

    // Draw the active bubble when it's moving
    if (activeBubble.current.isMoving) {
      drawBubble(activeBubble.current, p5);
    }

    //score
    const scoreText = document.getElementById("score");
    if (scoreText) {
      scoreText.innerHTML = `${gameProperties.current.score.toLocaleString()}`;
    }



    // Check for disconnected bubbles more frequently
    if (p5.frameCount % 15 === 0) {
      verifyGrid(gridBubble.current, removeBubbles);
    }

    // Normal physics movement (always use this for smooth, fast movement)
    // Prevent movement if shooting is blocked
    if (!isShootingBlocked.current) {
      activeBubble.current.x += activeBubble.current.speedX;
      activeBubble.current.y += activeBubble.current.speedY;
    } else {
      // Reset movement if blocked
      activeBubble.current.isMoving = false;
      activeBubble.current.speedX = 0;
      activeBubble.current.speedY = 0;
    }
    
    if (
      activeBubble.current.isSpecial &&
      specialBubble.current.isAnswered === Answer.NOT_YET
    ) {
      return;
    }
    
    // RENDER ALL ANIMATIONS ON TOP OF EVERYTHING (highest z-index)
    // Draw bubble popping animations
    drawBubblePopping(removeBubbles, p5);
    
    // Draw score animations
    drawScoreAnimations(p5);
    
    // Draw combo images on top
    for (const comboImage of comboImages) {
      if (comboImage.image) {
        p5.push();
        p5.translate(comboImage.x, comboImage.y);
        p5.scale(comboImage.scale);
        
        // Set image mode to center for proper positioning
        p5.imageMode(p5.CENTER);
        
        // Draw the combo image with alpha transparency
        p5.tint(255, comboImage.alpha * 255);
        p5.image(comboImage.image, 0, 0);
        p5.noTint();
        
        // Draw sparkle effect
        if (comboImage.glowIntensity > 1.2) {
          p5.push();
          p5.fill(255, 255, 255, comboImage.alpha * 150);
          p5.noStroke();
          p5.textSize(30);
          p5.textAlign(p5.CENTER, p5.CENTER);
          p5.textStyle(p5.BOLD);
          p5.textFont('"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif');
          p5.text("✨", 0, 0);
          p5.pop();
        }
        
        p5.pop();
      }
    }
  };

  const Monster = React.memo(() => {
    return (
      <div 
        className="monster-character"
        style={{
          position: 'absolute',
          bottom: '45px',
          right: '10px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img 
          src="/bubble-shooter/cat.gif" 
          alt="Cat Character" 
          width={150} 
          height={200} 
          style={{
            width: '100%',
            height: '100%'
          }}
        />
      </div>
    )
  })

  const mouseClicked = (p5: p5Types) => {
    // COMPLETELY BLOCK all game interactions if any UI element is active
    if (isModalOpen || isModalSettingOpen || isMenuVisible || isLeaderboardOpen || isLanguageSelectorOpen || isInfoVisible) {
      return;
    }
    
    // Block if game is paused or over
    if (gameState.isPause || gameState.isGameOver) {
      return;
    }
    
    // Block if we were holding (let mouseReleased handle it)
    if (isHolding.current) {
      return;
    }
    
          // Final check - only proceed if game is not paused
      if (!checkGamePause()) {
        // Handle first interaction to start music (only if no UI elements are active)
        if (!isModalOpen && !isModalSettingOpen && !isMenuVisible && !isLeaderboardOpen && !isLanguageSelectorOpen && !isInfoVisible) {
          handleFirstInteraction();
        }
      
      // Get click coordinates - handle both mouse and touch events
      let clickX = p5.mouseX;
      let clickY = p5.mouseY;
      
      // For touch events, use the first touch position
      if (p5.touches && p5.touches.length > 0) {
        const touch = p5.touches[0] as any;
        clickX = touch.x;
        clickY = touch.y;
      }
      
      // Check if click is within the canvas bounds using p5's coordinate system
      if (clickX < 0 || clickX > p5.width || clickY < 0 || clickY > p5.height) {
        return; // Ignore clicks outside canvas
      }
      
      if (clickX !== 0 && clickY !== 0) {
        // Check if click is on swap area (around the bubbles)
        const launcherX = gameWidth / 2;
        const launcherY = gameHeight - 80;
        
        // Define the entire launcher area as swap-only zone
        const launcherAreaX = launcherX - 60; // Left edge of launcher area
        const launcherAreaY = launcherY - 40; // Top edge of launcher area
        const launcherAreaWidth = 120; // Width of launcher area
        const launcherAreaHeight = 80; // Height of launcher area
        
        // Check if click is within the entire launcher area
        if (
          clickX >= launcherAreaX &&
          clickX <= launcherAreaX + launcherAreaWidth &&
          clickY >= launcherAreaY &&
          clickY <= launcherAreaY + launcherAreaHeight
        ) {

          // Set swap area flag and swap bubbles
          isInSwapArea.current = true;
          swapBubbles();
          return;
        }
        
        // Only allow shooting if not in swap area and bubble is not moving
        if (
          clickY <= gameHeight &&
          clickX >= 0 &&
          clickX <= gameWidth &&
          !activeBubble.current.isMoving
        ) {
          // Global shooting block check
          if (isShootingBlocked.current) {
            return;
          }
          
          // Don't shoot if trajectory is hidden
          if (isShowingTrajectory.current === false) {
            return;
          }
          if (
            activeBubble.current.isSpecial &&
            specialBubble.current.isAnswered === Answer.NOT_YET
          ) {
            setIsModalOpen(true);
            return;
          }


          // Use predicted trajectory for initial direction, then use normal physics
          if (isShowingTrajectory.current && predictedTrajectory.current.length >= 2) {
            // Use trajectory prediction to set initial velocity
            const trajectory = predictedTrajectory.current;
            const startPoint = trajectory[0];
            const endPoint = trajectory[1]; // Use first segment for initial direction
            
            // Calculate initial velocity from trajectory with faster speed
            const dx = endPoint.x - startPoint.x;
            const dy = endPoint.y - startPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
              const speed = activeBubble.current.speed * 3; // 3x faster initial speed
              activeBubble.current.speedX = (speed * dx) / distance;
              // Force upward shooting - prevent shooting downward
              const calculatedSpeedY = (speed * dy) / distance;
              activeBubble.current.speedY = Math.min(calculatedSpeedY, -1); // Ensure Y speed is negative (upward)
            }
            
            // Set bubble to launcher position
            const launcherX = gameWidth / 2;
            const launcherY = gameHeight - 80 - 35; // Top bubble position
            activeBubble.current.x = launcherX;
            activeBubble.current.y = launcherY;
            
            activeBubble.current.isMoving = true;
            isShowingTrajectory.current = false; // Clear trajectory when bubble starts moving
            gameState.countShoot++;
            
            // Play shoot sound
            playShootSound();
          } else {
            // Fallback to mouse direction
            let dx = clickX - activeBubble.current.x;
            let dy = clickY - activeBubble.current.y;
            let magnitude = Math.sqrt(dx * dx + dy * dy);
            
            // Ensure minimum distance for shooting
            if (magnitude > 10) {
              let speed = activeBubble.current.speed;
              activeBubble.current.speedX = (speed * dx) / magnitude;
              // Force upward shooting - prevent shooting downward
              const calculatedSpeedY = (speed * dy) / magnitude;
              activeBubble.current.speedY = Math.min(calculatedSpeedY, -1); // Ensure Y speed is negative (upward)
              activeBubble.current.isMoving = true;
              isShowingTrajectory.current = false; // Clear trajectory when bubble starts moving
              gameState.countShoot++;
              
              // Play shoot sound
              playShootSound();
            }
          }
        }
      }
    }
  };
  
  // Add mouse pressed and released handlers for arrow
  const mousePressed = (p5: p5Types) => {
    isHolding.current = true;
  };
  
  const mouseReleased = (p5: p5Types) => {
    // If we were holding and bubble is not moving, shoot the bubble
    if (isHolding.current && !activeBubble.current.isMoving && !checkGamePause()) {
      // Get release coordinates
      let releaseX = p5.mouseX;
      let releaseY = p5.mouseY;
      
      // For touch events, use the first touch position
      if (p5.touches && p5.touches.length > 0) {
        const touch = p5.touches[0] as any;
        releaseX = touch.x;
        releaseY = touch.y;
      }
      
      // Check if release is within the canvas bounds using p5's coordinate system
      if (releaseX < 0 || releaseX > p5.width || releaseY < 0 || releaseY > p5.height) {
        isHolding.current = false;
        hoverTarget.current.x = 0;
        hoverTarget.current.y = 0;
        isShowingTrajectory.current = false;
        return; // Ignore releases outside canvas
      }
      
      if (releaseX !== 0 && releaseY !== 0) {
        // Check if release is not in swap area
        const launcherX = gameWidth / 2;
        const launcherY = gameHeight - 80;
        
        // Define the entire launcher area as swap-only zone
        const launcherAreaX = launcherX - 60;
        const launcherAreaY = launcherY - 40;
        const launcherAreaWidth = 120;
        const launcherAreaHeight = 80;
        
        // Only shoot if not in swap area
        if (
          releaseX < launcherAreaX ||
          releaseX > launcherAreaX + launcherAreaWidth ||
          releaseY < launcherAreaY ||
          releaseY > launcherAreaY + launcherAreaHeight
        ) {
          // Use predicted trajectory if available, otherwise use mouse direction
          if (isShowingTrajectory.current && predictedTrajectory.current.length >= 2) {
            // Start following the predicted path exactly
            isFollowingPredictedPath.current = true;
            predictedPathIndex.current = 0;
            
            // Set bubble to exact starting position of trajectory
            activeBubble.current.x = launcherX;
            activeBubble.current.y = launcherY - 35; // Top bubble position
            
            activeBubble.current.isMoving = true;
            isShowingTrajectory.current = false; // Clear trajectory when bubble starts moving
            gameState.countShoot++;
            
            // Play shoot sound
            playShootSound();
          } else {
            // Fallback to mouse direction
            let dx = releaseX - launcherX;
            let dy = releaseY - launcherY;
            let magnitude = Math.sqrt(dx * dx + dy * dy);
            
            // Ensure minimum distance for shooting
            if (magnitude > 10) {
              let speed = activeBubble.current.speed;
              activeBubble.current.speedX = (speed * dx) / magnitude;
              activeBubble.current.speedY = (speed * dy) / magnitude;
              
              // Set bubble to launcher position
              activeBubble.current.x = launcherX;
              activeBubble.current.y = launcherY - 35; // Top bubble position
              
              activeBubble.current.isMoving = true;
              isShowingTrajectory.current = false; // Clear trajectory when bubble starts moving
              gameState.countShoot++;
              
              // Play shoot sound
              playShootSound();
              
              // Save game after each shot
              setTimeout(() => saveGameToLocalStorage(), 100);
            }
          }
        }
      }
    }
    
    isHolding.current = false;
    hoverTarget.current.x = 0;
    hoverTarget.current.y = 0;
    isShowingTrajectory.current = false;
  };
  
  const keyPressed = (p5: p5Types) => {
    // COMPLETELY BLOCK all game interactions if any UI element is active
    if (isModalOpen || isModalSettingOpen || isMenuVisible || isLeaderboardOpen || isLanguageSelectorOpen || isInfoVisible) {
      return;
    }
    
    // Block if game is paused or over
    if (gameState.isPause || gameState.isGameOver) {
      return;
    }
    
    // Handle first interaction to start music
    handleFirstInteraction();
    
    if (p5.key === ' ') {
      isHolding.current = !isHolding.current;
    }
    if (p5.key === 'd' || p5.key === 'D') {
      debugLocalStorage();
    }
    if (p5.key === 'r' || p5.key === 'R') {
      forceNewGame();
    }
    if (p5.key === 's' || p5.key === 'S') {
      syncHighestScore();
    }
    if (p5.key === 'h' || p5.key === 'H') {
      loadHighestScore();
    }
  };

  const mouseMoved = (p5: p5Types) => {
    // COMPLETELY BLOCK all game interactions if any UI element is active
    if (isModalOpen || isModalSettingOpen || isMenuVisible || isLeaderboardOpen || isLanguageSelectorOpen || isInfoVisible) {
      return;
    }
    
    // Block if game is paused or over
    if (gameState.isPause || gameState.isGameOver) {
      return;
    }
    
    // Get move coordinates - handle both mouse and touch events
    let moveX = p5.mouseX;
    let moveY = p5.mouseY;
    
    // For touch events, use the first touch position
    if (p5.touches && p5.touches.length > 0) {
      const touch = p5.touches[0] as any;
      moveX = touch.x;
      moveY = touch.y;
    }
    
    // Always update hover target when mouse/touch moves
    if (moveX !== 0 || moveY !== 0) {
      hoverTarget.current.x = moveX;
      hoverTarget.current.y = moveY;
    }
  };

  // Add touch coordinate tracking
  const touchStartCoords = useRef<{x: number, y: number} | null>(null);

  // Add touch event handlers for iOS compatibility
  const touchStarted = (p5: p5Types) => {
    // COMPLETELY BLOCK all game interactions if any UI element is active
    if (isModalOpen || isModalSettingOpen || isMenuVisible || isLeaderboardOpen || isLanguageSelectorOpen || isInfoVisible) {
      return;
    }
    
    // Block if game is paused or over
    if (gameState.isPause || gameState.isGameOver) {
      return;
    }
    
    // Handle first interaction to start music (only if no UI elements are active)
    if (!isModalOpen && !isModalSettingOpen && !isMenuVisible && !isLeaderboardOpen && !isLanguageSelectorOpen && !isInfoVisible) {
      handleFirstInteraction();
    }
    
    // Store initial touch position for accurate tracking
    if (p5.touches && p5.touches.length > 0) {
      const touch = p5.touches[0] as any;
      touchStartCoords.current = { x: touch.x, y: touch.y };
      
      // Only set holding state if touch is within canvas bounds using p5's coordinate system
      if (touch.x >= 0 && touch.x <= p5.width && touch.y >= 0 && touch.y <= p5.height) {
        isHolding.current = true;
      }
    }
  };

  const touchMoved = (p5: p5Types) => {
    // COMPLETELY BLOCK all game interactions if any UI element is active
    if (isModalOpen || isModalSettingOpen || isMenuVisible || isLeaderboardOpen || isLanguageSelectorOpen || isInfoVisible) {
      return;
    }
    
    // Block if game is paused or over
    if (gameState.isPause || gameState.isGameOver) {
      return;
    }
    
    // Update current touch position for accurate tracking
    if (p5.touches && p5.touches.length > 0) {
      const touch = p5.touches[0] as any;
      touchStartCoords.current = { x: touch.x, y: touch.y };
    }
  };

  const touchEnded = (p5: p5Types) => {
    // If we were holding and bubble is not moving, shoot the bubble
    if (isHolding.current && !activeBubble.current.isMoving && !checkGamePause()) {
      // Get release coordinates - prioritize touch coordinates, then fallback to mouse
      let releaseX = p5.mouseX;
      let releaseY = p5.mouseY;
      
      // For touch events, use the first touch position
      if (p5.touches && p5.touches.length > 0) {
        const touch = p5.touches[0] as any;
        releaseX = touch.x;
        releaseY = touch.y;
      } else if (touchStartCoords.current) {
        // Use stored touch coordinates as fallback
        releaseX = touchStartCoords.current.x;
        releaseY = touchStartCoords.current.y;
      }
      
      if (releaseX !== 0 && releaseY !== 0) {
        // Check if release is not in swap area
        const launcherX = gameWidth / 2;
        const launcherY = gameHeight - 80;
        
        // Define the entire launcher area as swap-only zone
        const launcherAreaX = launcherX - 60;
        const launcherAreaY = launcherY - 40;
        const launcherAreaWidth = 120;
        const launcherAreaHeight = 80;
        
        // Only shoot if not in swap area
        if (
          releaseX < launcherAreaX ||
          releaseX > launcherAreaX + launcherAreaWidth ||
          releaseY < launcherAreaY ||
          releaseY > launcherAreaY + launcherAreaHeight
        ) {
          // Global shooting block check
          if (isShootingBlocked.current) {
            return;
          }

          if (isShowingTrajectory.current === false) {
            // Force trajectory calculation as fallback
            updateTrajectoryPrediction(p5);
            if (isShowingTrajectory.current === false) {
              // Create a simple fallback trajectory if calculation still fails
              const launcherX = gameWidth / 2;
              const launcherY = gameHeight - 80 - 35;
              const fallbackTrajectory = [
                { x: launcherX, y: launcherY },
                { x: launcherX, y: launcherY - 50 }
              ];
              predictedTrajectory.current = fallbackTrajectory;
              isShowingTrajectory.current = true;
            }
          }

          // Use predicted trajectory if available, otherwise use mouse direction
          if (isShowingTrajectory.current && predictedTrajectory.current.length >= 2) {
            // Use trajectory prediction to set initial velocity
            const trajectory = predictedTrajectory.current;
            const startPoint = trajectory[0];
            const endPoint = trajectory[1]; // Use first segment for initial direction
            
            // Calculate initial velocity from trajectory
            const dx = endPoint.x - startPoint.x;
            const dy = endPoint.y - startPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
              const speed = activeBubble.current.speed;
              activeBubble.current.speedX = (speed * dx) / distance;
              // Force upward shooting - prevent shooting downward
              const calculatedSpeedY = (speed * dy) / distance;
              activeBubble.current.speedY = Math.min(calculatedSpeedY, -1); // Ensure Y speed is negative (upward)
            }
            
            // Set bubble to launcher position
            activeBubble.current.x = launcherX;
            activeBubble.current.y = launcherY - 35; // Top bubble position
            
            // Enable trajectory following for smooth movement
            isFollowingPredictedPath.current = true;
            predictedPathIndex.current = 0;
            
            activeBubble.current.isMoving = true;
            isShowingTrajectory.current = false; // Clear trajectory when bubble starts moving
            gameState.countShoot++;
            
            // Play shoot sound
            playShootSound();
          } else {
            // Fallback to mouse direction
            let dx = releaseX - launcherX;
            let dy = releaseY - launcherY;
            let magnitude = Math.sqrt(dx * dx + dy * dy);
            
            // Ensure minimum distance for shooting
            if (magnitude > 10) {
              let speed = activeBubble.current.speed;
              activeBubble.current.speedX = (speed * dx) / magnitude;
              activeBubble.current.speedY = (speed * dy) / magnitude;
              
              // Set bubble to launcher position
              activeBubble.current.x = launcherX;
              activeBubble.current.y = launcherY - 35; // Top bubble position
              
              activeBubble.current.isMoving = true;
              isShowingTrajectory.current = false; // Clear trajectory when bubble starts moving
              gameState.countShoot++;
              
              // Play shoot sound
              playShootSound();
            }
          }
        }
      }
      
      // Reset touch coordinates
      touchStartCoords.current = null;
    }
    
    isHolding.current = false;
    hoverTarget.current.x = 0;
    hoverTarget.current.y = 0;
    isShowingTrajectory.current = false;
  };

  const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default), {
    ssr: false,
    loading: () => <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontSize: '1.2rem'
    }}>{t('loadingGame')}</div>
  });

  const showAlert = (message: string) => {
    if (alertActive) {
      return;
    }
    
    // Clean up any existing modals before creating a new one
    cleanupExistingModals();
    
    alertActive = true;
    freezeGame();

    // Determine if it's a win or game over
    const isWin = message.includes('Win') || message.includes('赢了') || message.includes('ឈ្នះ');
    const isGameOver = message.includes('Over') || message.includes('结束') || message.includes('បញ្ចប់');

    // Play appropriate sound effect
    if (isWin && (window as any).soundEffects) {
      (window as any).soundEffects.playGameWinSound();
    } else if (isGameOver && (window as any).soundEffects) {
      (window as any).soundEffects.playGameOverSound();
    }

    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.4));
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.5s ease-in-out;
    `;

    const alertBox = document.createElement("div");
    alertBox.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.3);
      background: linear-gradient(to bottom, #FFFFFF, #D0D0D0);
      padding: 15px;
      border-radius: 40px;
      border: 4px solid #D682DF;
      z-index: 1001;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      min-width: 350px;
      opacity: 0;
      transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;

    const particlesContainer = document.createElement("div");
    particlesContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      border-radius: 20px;
      pointer-events: none;
    `;

    // Add floating particles
    for (let i = 0; i < 25; i++) {
      const particle = document.createElement("div");
      const particleColor = `rgba(214, 130, 223, ${0.6 + Math.random() * 0.4})`;
      
      particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 8 + 4}px;
        height: ${Math.random() * 8 + 4}px;
        background: ${particleColor};
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: float 3s ease-in-out infinite;
        animation-delay: ${Math.random() * 2}s;
      `;
      particlesContainer.appendChild(particle);
    }

    const style = document.createElement("style");
    style.setAttribute('data-alert-style', 'true');
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
        50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }
      @keyframes buttonGlow {
        0%, 100% { 
          box-shadow: 0 8px 25px rgba(214, 130, 223, 0.3);
          transform: scale(1);
        }
        50% { 
          box-shadow: 0 12px 35px rgba(214, 130, 223, 0.6);
          transform: scale(1.02);
        }
      }
      @keyframes buttonPulse {
        0%, 100% { 
          background: #D682DF;
          transform: scale(1);
        }
        50% { 
          background: #E691E8;
          transform: scale(1.03);
        }
      }
      @keyframes buttonFloat {
        0%, 100% { 
          transform: translateY(0px) scale(1);
        }
        50% { 
          transform: translateY(-8px) scale(1.02);
        }
      }
      @keyframes buttonRotate {
        0% { 
          transform: rotate(0deg) scale(1);
        }
        25% { 
          transform: rotate(1deg) scale(1.01);
        }
        50% { 
          transform: rotate(0deg) scale(1);
        }
        75% { 
          transform: rotate(-1deg) scale(1.01);
        }
        100% { 
          transform: rotate(0deg) scale(1);
        }
      }
    `;
    document.head.appendChild(style);

    alertBox.innerHTML = `
      <div style="position: relative; z-index: 2;">
        ${isWin ? `
          <img 
            src="/bubble-shooter/you-win.png" 
            alt="You Win" 
            style="
              width: 100%;
              max-width: 200px;
              height: auto;
              margin-top: 10px;
              display: block;
              margin-left: auto;
              margin-right: auto;
            "
          />
          <img 
            src="/bubble-shooter/game-win.gif" 
            alt="Game Win Animation" 
            style="
              width: 100%;
              max-width: 200px;
              height: auto;
              display: block;
              margin-left: auto;
              margin-right: auto;
            "
          />
        ` : `
          <img 
            src="/bubble-shooter/you-lose.png" 
            alt="You Lose" 
            style="
              width: 100%;
              max-width: 200px;
              height: auto;
              margin-top: 10px;
              display: block;
              margin-left: auto;
              margin-right: auto;
            "
          />
          <img 
            src="/bubble-shooter/game-over.gif" 
            alt="Game Over Animation" 
            style="
              width: 100%;
              max-width: 200px;
              height: auto;
              display: block;
              margin-left: auto;
              margin-right: auto;
            "
          />
        `}
        <button id="alert-ok-btn" style="
          background: #D682DF;
          color: white;
          border: 4px solid white;
          border-radius: 20px;
          padding: 15px;
          font-size: 1.5rem;
          font-weight: 900;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          letter-spacing: 1px;
          font-family: 'TypoGrotek', 'Space Grotesk', 'Poppins', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          min-width: 250px;
          box-shadow: 0 8px 25px rgba(214, 130, 223, 0.3);
        ">${isWin ? 'Play Again' : 'New Game'}</button>
      </div>
    `;

    alertBox.appendChild(particlesContainer);
    document.body.appendChild(overlay);
    document.body.appendChild(alertBox);

    // Animate in
    setTimeout(() => {
      overlay.style.opacity = '1';
      alertBox.style.opacity = '1';
      alertBox.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 10);

    // Add hover effects
    const okBtn = document.getElementById("alert-ok-btn");
    if (okBtn) {
      okBtn.addEventListener("mouseenter", () => {
        okBtn.style.transform = 'scale(1.02)';
        okBtn.style.background = '#C973D0';
        okBtn.style.boxShadow = '0 10px 30px rgba(214, 130, 223, 0.4)';
      });
      
      okBtn.addEventListener("mouseleave", () => {
        okBtn.style.transform = 'scale(1)';
        okBtn.style.background = '#D682DF';
        okBtn.style.boxShadow = '0 8px 25px rgba(214, 130, 223, 0.3)';
      });

      okBtn.addEventListener("click", async () => {
        // Stop game win sound if it's playing (for win scenarios)
        if (isWin && (window as any).soundEffects) {
          (window as any).soundEffects.stopGameWinSound();
        }
        
        // Animate out
        overlay.style.opacity = '0';
        alertBox.style.opacity = '0';
        alertBox.style.transform = 'translate(-50%, -50%) scale(0.3)';
        
        setTimeout(async () => {
          if (document.body.contains(alertBox)) {
            document.body.removeChild(alertBox);
          }
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }
          if (document.head.contains(style)) {
            document.head.removeChild(style);
          }
          alertActive = false;
          unfreezeGame();
          await resetGame();
        }, 500);
      }, { once: true });
    }
  };

  return (
    <main className="bubble-shooter__game">
      <header className="bubble-shooter__game-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '25px 20px 15px 20px',
        borderRadius: '0 0 20px 20px',
        marginTop: '30px'
      }}>
        <div 
          className="bubble-shooter__game-score-container" 
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', marginTop: '10px', gap: '15px' }}>
          
          {/* User Avatar - Circular div like hamburger/mute buttons */}
          <div 
            onClick={handleUserProfileClick}
            style={{
              width: '55px',
              height: '55px',
              borderRadius: '50%',
              // background: '#7F4585',
              border: '3px solid #E088E8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(127, 69, 133, 0.4)',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(127, 69, 133, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(127, 69, 133, 0.4)';
            }}
          >
            {currentUserRank?.avatarUrl ? (
              <Image
                src={currentUserRank.avatarUrl}
                alt="User Avatar"
                width={45}
                height={45}
                style={{
                  width: '45px',
                  height: '45px',
                  objectFit: 'cover',
                  borderRadius: '50%'
                }}
              />
            ) : (
              <span style={{
                fontSize: '24px',
                color: '#FFFFFF'
              }}>
                👤
              </span>
            )}
          </div>

            {/* Username and Score Badge - Stacked vertically */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '1px',
              height: '55px',
              justifyContent: 'space-between',
              marginLeft: '-12px'
            }}>
            {/* Rank & Username */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span 
                style={{
                  fontSize: '14px !important',
                  color: 'white',
                  fontWeight: '600', 
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, rgb(255, 215, 0), rgb(255, 165, 0))',
                  border: '2px solid #E088E8'
                }}
              >
                { currentUserRank?.rank || 'N/A' }
              </span>
              <span 
                onClick={handleUserProfileClick}
                style={{
                  fontSize: '16px !important',
                  color: '#7F4585',
                  fontWeight: '600',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                  lineHeight: '1.2',
                  maxWidth: '200px !important',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#9B4DA3';
                  e.currentTarget.style.textShadow = '0 3px 6px rgba(0, 0, 0, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#7F4585';
                  e.currentTarget.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.5)';
                }}
              >
                {currentUserRank?.name || 'Player'}
              </span>
            </div>

            {/* Score Badge */}
            <div 
              className="custom-score-container"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#7F4585',
                borderRadius: '25px',
                padding: '4px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 3px 10px rgba(127, 69, 133, 0.4)',
                border: '3px solid #E088E8',
                minWidth: '120px',
                height: '35px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(127, 69, 133, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 3px 10px rgba(127, 69, 133, 0.4)';
              }}
            >
              <Image
                src="/bubble-shooter/star-coin.png"
                alt="Star Coin"
                width={30}
                height={30}
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                }}
              />
              <span 
                id="score" 
                className="custom-score"
                style={{ 
                  fontSize: '20px !important', 
                  color: '#FFFFFF', 
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                }}
              ></span>
            </div>
          </div>
        </div>

        <div 
          className="bubble-shooter__game-hamburger-bar" 
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', marginTop: '10px', gap: '5px' }}>
          
          {/* Mute/Unmute Icon */}
          <div 
            onClick={handleMuteToggle}
            style={{
              width: '55px',
              height: '55px',
              borderRadius: '50%',
              background: '#7F4585',
              border: '3px solid #E088E8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(127, 69, 133, 0.4)',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(127, 69, 133, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(127, 69, 133, 0.4)';
            }}
          >
            <Image
              width={24}
              height={24}
              src="/bubble-shooter/mute.png"
              alt="Unmuted"
              title="Click to mute"
              className="mute-unmute-icon"
              style={{
                width: '24px !important',
                height: '24px !important',
                minWidth: '24px !important',
                minHeight: '24px !important',
                maxWidth: '24px !important',
                maxHeight: '24px !important'
              }}
            />
          </div>
          <button 
            className="hamburger-button"
            onClick={(e) => {
              e.stopPropagation();
              // Handle first interaction to start music
              handleFirstInteraction();
              setIsMenuVisible(true);
            }}
            style={{
              background: '#7F4585',
              borderRadius: '50%',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(127, 69, 133, 0.4)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '55px',
              height: '55px',
              border: '3px solid #E088E8',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <span style={{ 
              fontSize: '28px', 
              color: '#FFFFFF',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5), 0 0 10px rgba(255, 255, 255, 0.3)',
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
              zIndex: '1',
              position: 'relative'
            }}>☰</span>
          </button>
        </div>
      </header>
      <aside className="bubble-shooter__game-aside">
        <ul>
          <li
            onClick={() => {
              // Handle first interaction to start music
              handleFirstInteraction();
              gameState.isPause = false;
            }}
          >
            <Image width={60} height={60} src={play} alt="遊戲按鈕" />
          </li>
          <li
            onClick={() => {
              // Handle first interaction to start music
              handleFirstInteraction();
              gameState.isPause = true;
            }}
          >
            <Image width={60} height={60} src={pause} alt="暫停按鈕" />
          </li>
          <li onClick={() => {
            // Handle first interaction to start music
            handleFirstInteraction();
            setIsModalSettingOpen(true);
          }}>
            <Image width={60} height={60} src={setting} alt="設定按鈕" />
          </li>
        </ul>
      </aside>
      
      {/* Information/Help Button */}
      <div 
        className="bubble-shooter__info-button"
        onClick={(e) => {
          e.stopPropagation();
          handleFirstInteraction();
          setIsInfoVisible(true);
        }}
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '30px',
          marginBottom: isAndroid ? '5px' : '60px',
          background: '#7F4585',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: '4px solid #E088E8',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'translateY(0)',
          zIndex: 10
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.1)';
          e.currentTarget.style.boxShadow = 
            '0 12px 35px rgba(127, 69, 133, 0.6), ' +
            'inset 0 2px 4px rgba(255, 255, 255, 0.6), ' +
            'inset 0 -2px 4px rgba(0, 0, 0, 0.15)';
          e.currentTarget.style.animation = 'infoButtonGlow 0.5s ease-in-out';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = 
            '0 8px 25px rgba(127, 69, 133, 0.4), ' +
            'inset 0 2px 4px rgba(255, 255, 255, 0.5), ' +
            'inset 0 -2px 4px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.animation = 'infoButtonPulse 2s ease-in-out infinite';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translateY(1px) scale(0.95)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.1)';
        }}
      >
        <span style={{ 
          fontSize: '28px', 
          color: 'white',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          animation: 'infoIconSpin 3s linear infinite'
        }}>❓</span>
      </div>

      <Monster />

      <article className="bubble-shooter__game-main">
        <div 
          style={{
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            touchAction: 'none',
            position: 'relative'
          }}
        >
          <Sketch
            setup={setup}
            draw={draw}
            preload={preload}
            mouseClicked={mouseClicked}
            mouseMoved={mouseMoved}
            mousePressed={mousePressed}
            mouseReleased={mouseReleased}
            keyPressed={keyPressed}
            touchStarted={touchStarted}
            touchMoved={touchMoved}
            touchEnded={touchEnded}
          />
          
          {/* External grid container */}
          <div className="external-grid-container"></div>
        </div>
        <Modal
          title={t('question')}
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
        >
          <p>{t('pressOkForCorrect')}</p>
          <p>{t('pressCancelForWrong')}</p>
        </Modal>

        {/* for testing  */}
        <Modal
          title={t('settings')}
          open={isModalSettingOpen}
          onOk={handleOkSetting}
          onCancel={handleCancelSetting}
        >
          <Form
            name="basic"
            initialValues={initValuesForm()}
            onFinish={(values) => {
              for (let i = 0; i < Object.keys(values).length; i++) {
                const colorKey = Object.keys(values)[i];
                const colorValue = values[colorKey];
                const index = Number(colorKey.split("-")[1]);
                gameProperties.current.color[index] = colorValue;
              }
              gameProperties.current.moveDownInterval = values.moveDown;
              resetGame();
            }}
          >
            <label htmlFor="">{t('color')}</label>
            {gameProperties.current.color.map((color, index) => {
              return (
                <Form.Item
                  key={index}
                  label={
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 30,
                        background: color,
                      }}
                    ></div>
                  }
                  name={`color-${index}`}
                  rules={[{ required: true, message: t('pleaseInputColor') }]}
                >
                  <Input />
                </Form.Item>
              );
            })}
            <label htmlFor="">{t('moveDownAfter')}</label>
            <Form.Item
              name="moveDown"
              rules={[{ required: true, message: t('pleaseInputTime') }]}
            >
              <Input />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 0, span: 16 }}>
              <Button type="primary" htmlType="submit">
                {t('submit')}
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Leaderboard Modal */}
        <Modal
          title={
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
            }}>
              {t('globalLeaderboard')}
            </div>
          }
          open={isLeaderboardOpen}
          onCancel={handleLeaderboardCancel}
          width={isMobile ? '90vw' : 600}
          centered={true}
          footer={null}
          bodyStyle={{
            maxHeight: '60vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '20px',
            WebkitOverflowScrolling: 'touch', // iOS momentum scrolling
            msOverflowStyle: 'none', // Hide scrollbar on IE/Edge
            scrollbarWidth: 'none', // Hide scrollbar on Firefox
            // Touch event handling for miniapp
            touchAction: 'pan-y',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
          style={{
            maxHeight: '90vh'
          }}
        >
          <div style={{ marginBottom: '15px' }}>
            <div 
              className="bubble-shooter__leaderboard-score-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: isMobile ? '8px 12px' : '10px 15px',
                background: 'rgba(214, 130, 223, 0.8)',
                borderRadius: '10px',
                color: 'white',
                fontWeight: 'bold',
                marginBottom: '10px',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                fontSize: isMobile ? '12px' : '14px'
              }}>
              <span style={{ fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif' }}>
                {t('current')}: {gameProperties.current.score}
              </span>
              {currentUserRank && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AvatarDisplay
                    avatarUrl={currentUserRank.avatarUrl}
                    name="You"
                    size={20}
                    showBorder={true}
                  />
                  <span style={{ fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif' }}>
                    {t('yourRank')}: #{currentUserRank.rank}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div 
            style={{ marginBottom: '15px' }}
          >
            {leaderboardLoading ? (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: 'white',
                fontSize: '16px'
              }}>
                Loading leaderboard...
              </div>
            ) : leaderboardError ? (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#ff6b6b',
                fontSize: '14px'
              }}>
                {leaderboardError}
              </div>
            ) : leaderboardData.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: 'white',
                fontSize: '14px'
              }}>
                No leaderboard data available
              </div>
            ) : (
              leaderboardData.map((player, index) => {
                const isCurrentPlayer = currentUserRank && player.name === currentUserRank.name;
                const isTop3 = index < 3;
              
              return (
                <div
                  key={player.rank}
                  className="bubble-shooter__leaderboard-player"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: isMobile ? '8px 12px' : '12px 15px',
                    marginBottom: isMobile ? '6px' : '8px',
                    borderRadius: '10px',
                    background: isCurrentPlayer 
                      ? 'rgba(214, 130, 223, 0.6)'
                      : isTop3 
                        ? 'rgba(255, 215, 0, 0.2)'
                        : 'rgba(255, 255, 255, 0.1)',
                    border: isCurrentPlayer 
                      ? '2px solid rgba(214, 130, 223, 0.8)'
                      : isTop3 
                        ? '1px solid rgba(255, 215, 0, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    color: 'white',
                    textShadow: isCurrentPlayer 
                      ? '0 2px 4px rgba(0, 0, 0, 0.6)'
                      : '0 1px 2px rgba(0, 0, 0, 0.4)',
                    // Prevent touch events from interfering with scrolling
                    touchAction: 'pan-y',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    transform: isCurrentPlayer ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isCurrentPlayer 
                      ? '0 4px 12px rgba(214, 130, 223, 0.4)'
                      : '0 2px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = isCurrentPlayer ? 'scale(1.05)' : 'scale(1.02)';
                    e.currentTarget.style.background = isCurrentPlayer 
                      ? 'rgba(214, 130, 223, 0.7)'
                      : isTop3 
                        ? 'rgba(255, 215, 0, 0.25)'
                        : 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.boxShadow = isCurrentPlayer 
                      ? '0 6px 20px rgba(214, 130, 223, 0.6)'
                      : '0 3px 10px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = isCurrentPlayer ? 'scale(1.02)' : 'scale(1)';
                    e.currentTarget.style.background = isCurrentPlayer 
                      ? 'rgba(214, 130, 223, 0.6)'
                      : isTop3 
                        ? 'rgba(255, 215, 0, 0.2)'
                        : 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.boxShadow = isCurrentPlayer 
                      ? '0 4px 12px rgba(214, 130, 223, 0.4)'
                      : '0 2px 6px rgba(0, 0, 0, 0.1)';
                  }}

                >
                  {isCurrentPlayer && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      left: '-8px',
                      background: 'white',
                      color: 'rgba(214, 130, 223, 1)',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      zIndex: 1,
                      border: '2px solid rgba(214, 130, 223, 0.8)',
                      animation: 'pulse 2s infinite'
                    }}>
                      <span style={{ filter: 'drop-shadow(none)' }}>👤</span>
                    </div>
                  )}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  flex: 1
                }}>
                  <div 
                    className="bubble-shooter__leaderboard-rank-circle"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      background: index < 3 
                        ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                        : 'linear-gradient(135deg, #3b82f6, #1e3a8a)',
                      color: 'white',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}>
                    {player.rank}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '8px' : '10px',
                    flex: 1
                  }}>
                    <AvatarDisplay
                      avatarUrl={player.avatarUrl}
                      name={player.name}
                      size={isMobile ? 28 : 36}
                      showBorder={true}
                      style={{ marginLeft: '-10px' }}
                    />
                    <span style={{
                      fontWeight: 'bold',
                      color: 'white',
                      fontSize: isMobile ? '14px' : '16px',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
                      fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: isMobile ? '120px' : '150px',
                      display: 'block'
                    }}>
                      {player.name}
                    </span>
                  </div>
                  
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: isMobile ? '16px' : '18px',
                    color: 'white',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
                    fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
                  }}>
                    {player.score.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          }))
          }
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '15px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(240, 248, 255, 0.2))',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <p style={{
              margin: '0',
              color: 'white',
              fontSize: '14px',
              fontStyle: 'italic',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
              fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
            }}>
              {t('tip')}
            </p>
          </div>
        </Modal>

        {/* Menu Modal */}
        <Modal
          open={isMenuVisible}
          onOk={() => {
            setIsMenuVisible(false);
          }}
          onCancel={() => {
            setIsMenuVisible(false);
          }}
          width={400}
          bodyStyle={{
            padding: '0',
            textAlign: 'center',
            borderRadius: '20px',
            overflow: 'hidden',
            position: 'relative'
          }}
          footer={null}
          className="bubble-shooter__menu-modal"
          title={null}
          centered={true}
        >
          {/* Animated background overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
            animation: 'shimmer 3s ease-in-out infinite',
            pointerEvents: 'none',
            borderRadius: '15px'
          }} />
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            padding: '20px 18px',
            position: 'relative',
            zIndex: 1
          }}>
            {/* Resume Button */}
            <button
              onClick={() => {
                setIsMenuVisible(false);
                gameState.isPause = false;
              }}
              className="bubble-shooter__menu-button"
              style={{
                background: 'rgba(214, 130, 223, 0.7)',
                color: 'white',
                borderRadius: '12px',
                padding: '12px 18px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = 'rgba(214, 130, 223, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = 'rgba(214, 130, 223, 0.7)';
              }}
            >
              <span style={{ 
                fontSize: '18px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                transition: 'transform 0.3s ease'
              }}>▶️</span>
              <span style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '0.5px'
              }}>{t('resume')}</span>
            </button>

            {/* Restart Button */}
            <button
              onClick={async () => {
                setIsMenuVisible(false);
                await resetGame();
              }}
              className="bubble-shooter__menu-button"
              style={{
                background: 'rgba(214, 130, 223, 0.7)',
                color: 'white',
                borderRadius: '12px',
                padding: '12px 18px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = 'rgba(214, 130, 223, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = 'rgba(214, 130, 223, 0.7)';
              }}
            >
              <span style={{ 
                fontSize: '18px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                transition: 'transform 0.3s ease'
              }}>🔄</span>
              <span style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '0.5px'
              }}>{t('restart')}</span>
            </button>

            {/* Leaderboard Button (3rd position) */}
            <button
              onClick={async () => {
                setIsMenuVisible(false);
                setIsLeaderboardOpen(true);
                // Refresh leaderboard data when opened
                await refreshLeaderboard();
              }}
              className="bubble-shooter__menu-button"
              style={{
                background: 'rgba(214, 130, 223, 0.7)',
                color: 'white',
                borderRadius: '12px',
                padding: '12px 18px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = 'rgba(214, 130, 223, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = 'rgba(214, 130, 223, 0.7)';
              }}
            >
              <span style={{ 
                fontSize: '18px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                transition: 'transform 0.3s ease'
              }}>🏆</span>
              <span style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '0.5px'
              }}>{t('leaderboard')}</span>
            </button>

                        {/* Language Button */}
            <button
              onClick={() => {
                setIsMenuVisible(false);
                setIsLanguageSelectorOpen(true);
              }}
              className="bubble-shooter__menu-button"
              style={{
                background: 'rgba(214, 130, 223, 0.7)',
                color: 'white',
                borderRadius: '12px',
                padding: '12px 18px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = 'rgba(214, 130, 223, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = 'rgba(214, 130, 223, 0.7)';
              }}
            >
              <span style={{ 
                fontSize: '18px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                transition: 'transform 0.3s ease'
              }}>{getLanguageFlag(language)}</span>
              <span style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '0.5px'
              }}>{getLanguageName(language)}</span>
            </button>
          </div>
        </Modal>

        {/* Information/Help Modal */}
        <Modal
          open={isInfoVisible}
          onCancel={() => setIsInfoVisible(false)}
          style={{
            background: 'transparent',
            padding: '0',
            textAlign: 'center',
            borderRadius: '20px',
            overflow: 'hidden',
            position: 'relative'
          }}
          footer={null}
          className="bubble-shooter__info-modal"
          title={null}
          centered={true}
        >
          {/* Animated background overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
            animation: 'shimmer 3s ease-in-out infinite',
            pointerEvents: 'none',
            borderRadius: '15px'
          }} />
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            // padding: '25px 20px',
            position: 'relative',
            zIndex: 1
          }}>


            {/* Title */}
            <h2 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '0 0 10px 0',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
            }}>
              {t('howToPlay')}
            </h2>

            {/* Objective Section */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05))',
              borderRadius: '15px',
              padding: '20px',
              textAlign: 'left',
              color: 'white',
              fontSize: '16px',
              lineHeight: '1.6',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: '18px', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif' }}>🎯 {t('objective')}</h3>
              <p style={{ margin: '0', textAlign: 'left', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif', fontWeight: 'normal' }}>
                {t('objectiveDescription')}
              </p>
            </div>

            {/* Controls Section */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(93, 173, 226, 0.15), rgba(93, 173, 226, 0.05))',
              borderRadius: '15px',
              padding: '20px',
              textAlign: 'left',
              color: 'white',
              fontSize: '16px',
              lineHeight: '1.6',
              border: '1px solid rgba(93, 173, 226, 0.3)',
              fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: '18px', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif' }}>🎮 {t('controls')}</h3>
              <ul style={{ margin: '0', paddingLeft: '0', listStyle: 'none', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif' }}>
                <li style={{ margin: '0 0 8px 0', textAlign: 'left', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif', fontWeight: 'normal' }}>{t('control1')}</li>
                <li style={{ margin: '0 0 8px 0', textAlign: 'left', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif', fontWeight: 'normal' }}>{t('control2')}</li>
                <li style={{ margin: '0 0 8px 0', textAlign: 'left', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif', fontWeight: 'normal' }}>{t('control3')}</li>
              </ul>
            </div>

            {/* Scoring Section */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 193, 7, 0.05))',
              borderRadius: '15px',
              padding: '20px',
              textAlign: 'left',
              color: 'white',
              fontSize: '16px',
              lineHeight: '1.6',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: '18px', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif' }}>🏆 {t('scoring')}</h3>
              <ul style={{ margin: '0', paddingLeft: '0', listStyle: 'none', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif' }}>
                <li style={{ margin: '0 0 8px 0', textAlign: 'left', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif', fontWeight: 'normal' }}>{t('score1')}</li>
                <li style={{ margin: '0 0 8px 0', textAlign: 'left', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif', fontWeight: 'normal' }}>{t('score2')}</li>
                <li style={{ margin: '0 0 8px 0', textAlign: 'left', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif', fontWeight: 'normal' }}>{t('score3')}</li>
              </ul>
            </div>

            {/* Game Over Section */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(220, 53, 69, 0.15), rgba(220, 53, 69, 0.05))',
              borderRadius: '15px',
              padding: '20px',
              textAlign: 'left',
              color: 'white',
              fontSize: '16px',
              lineHeight: '1.6',
              border: '1px solid rgba(220, 53, 69, 0.3)',
              fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: '18px', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif' }}>⚠️ {t('gameOver')}</h3>
              <p style={{ margin: '0', textAlign: 'left', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif', fontWeight: 'normal' }}>
                {t('gameOverDescription')}
              </p>
            </div>

            {/* Tips Section */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.15), rgba(40, 167, 69, 0.05))',
              borderRadius: '15px',
              padding: '20px',
              textAlign: 'left',
              color: 'white',
              fontSize: '16px',
              lineHeight: '1.6',
              border: '1px solid rgba(40, 167, 69, 0.3)',
              fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: '18px', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif' }}>💡 {t('tips')}</h3>
              <ul style={{ margin: '0', paddingLeft: '0', listStyle: 'none', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif' }}>
                <li style={{ margin: '0 0 8px 0', textAlign: 'left', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif', fontWeight: 'normal' }}>{t('tip1')}</li>
                <li style={{ margin: '0 0 8px 0', textAlign: 'left', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif', fontWeight: 'normal' }}>{t('tip2')}</li>
                <li style={{ margin: '0 0 8px 0', textAlign: 'left', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif', fontWeight: 'normal' }}>{t('tip3')}</li>
                <li style={{ margin: '0 0 8px 0', textAlign: 'left', fontFamily: '"TypoGrotek", "Space Grotesk", "Poppins", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif', fontWeight: 'normal' }}>{t('tip4')}</li>
              </ul>
            </div>
          </div>
        </Modal>

        {/* Language Selector Modal */}
        <LanguageSelector 
          isOpen={isLanguageSelectorOpen}
          onClose={() => {
            setIsLanguageSelectorOpen(false);
          }}
        />
      </article>

      <footer className="bubble-shooter__game-footer">
        <div id="activeBubble"></div>
        <div id="secondaryBubble"></div>

      </footer>
    </main>
  );
};

export default Board;