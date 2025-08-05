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
import React, { useRef, useState } from "react";
import score from "@public/bubble-shooter/background/score.png";
import time from "@public/bubble-shooter/background/time.png";
import pause from "@public/bubble-shooter/icon/pause.png";
import play from "@public/bubble-shooter/icon/play.png";
import setting from "@public/bubble-shooter/icon/setting.png";
import Image from "next/image";
import { isMobile } from "react-device-detect";

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

  let image: any = {
    imageDraw: "",
    imageSpecialBall: "",
  };
  
  // Particle system for explosion effects
  let particles: any[] = [];
  
  const createParticles = (x: number, y: number, color: string, p5: p5Types) => {
    const particleCount = 16; // Reduced particles
    for (let i = 0; i < particleCount; i++) {
      const angle = (p5.TWO_PI * i) / particleCount;
      const speed = p5.random(6, 14); // Reduced speed
      particles.push({
        x: x,
        y: y,
        vx: p5.cos(angle) * speed,
        vy: p5.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color: color,
        size: p5.random(5, 12), // Smaller particles
        rotation: 0,
        rotationSpeed: p5.random(-0.4, 0.4), // Reduced rotation
        scale: 1.1, // Smaller starting scale
        scaleSpeed: -0.01, // Slower scale reduction
        pulse: 0,
        pulseSpeed: 0.3,
        trail: [] // Initialize trail array
      });
    }
  };
  
  const updateAndDrawParticles = (p5: p5Types) => {
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      
      // Update particle
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.015; // Slightly faster fade
      particle.rotation += particle.rotationSpeed;
      particle.scale += particle.scaleSpeed;
      particle.scale = Math.max(0.25, particle.scale); // Don't get too small
      particle.pulse += particle.pulseSpeed;
      
      // Add trail effect for particles
      particle.trail.push({ x: particle.x, y: particle.y, fade: 1 });
      if (particle.trail.length > 4) { // Reduced trail length
        particle.trail.shift();
      }
      
      // Draw particle with enhanced effects
      if (particle.life > 0 && particle.scale > 0.25) {
        const pulseGlow = 1 + 0.3 * Math.sin(particle.pulse); // Reduced glow
        
        // Draw trail effect
        for (let j = 0; j < particle.trail.length; j++) {
          const trailPoint = particle.trail[j];
          const trailFade = trailPoint.fade * particle.life;
          const trailScale = particle.scale * (j / particle.trail.length);
          
          p5.push();
          p5.translate(trailPoint.x, trailPoint.y);
          p5.rotate(particle.rotation * 0.3);
          p5.scale(trailScale);
          
          p5.push();
          p5.noStroke();
          p5.fill(particle.color + Math.floor(trailFade * 120).toString(16).padStart(2, '0'));
          p5.ellipse(0, 0, particle.size * trailFade + 4); // Reduced trail glow
          p5.pop();
          
          p5.push();
          p5.tint(255, trailFade * 255);
          p5.noStroke();
          p5.fill(particle.color);
          p5.ellipse(0, 0, particle.size * trailFade);
          p5.pop();
          
          p5.pop();
          
          trailPoint.fade -= 0.18;
        }
        
        p5.push();
        p5.translate(particle.x, particle.y);
        p5.rotate(particle.rotation);
        p5.scale(particle.scale);
        
        // Draw glow effect
        p5.push();
        p5.noStroke();
        p5.fill(particle.color + Math.floor(particle.life * 200).toString(16).padStart(2, '0'));
        p5.ellipse(0, 0, particle.size * particle.life + 8 * pulseGlow); // Reduced glow
        p5.pop();
        
        // Draw main particle
        p5.noStroke();
        p5.fill(particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0'));
        p5.ellipse(0, 0, particle.size * particle.life);
        
        p5.pop();
      } else {
        particles.splice(i, 1);
      }
    }
  };
  const gameProperties = useRef({
    score: 0,
    shotsInRound: 0, // Shots taken in current round (0-5)
    color: [
      "#FF0000", // Pure red
      "#00FF00", // Pure green
      "#2196F3", // More colorful blue
      "#FFD700", // More colorful yellow
      "#FF00FF", // Magenta
      "#00FFFF", // Cyan
      "#FF6600", // Bright orange
    ],
    moveDownInterval: 20,
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isModalSettingOpen, setIsModalSettingOpen] = useState<boolean>(false);
  const gridBubble = useRef<Record<string, Bubble>>(
    createGridBubble(gridRef.current, gameProperties.current.color)
  );
  const specialBubble = useRef({
    isAnswered: Answer.NOT_YET,
  });
  const bubbleNext = useRef(
    createListBubbleNext(
      grid,
      bubbleStartX,
      bubbleStartY,
      gameProperties.current.color
    )
  );
  const activeBubble = useRef(bubbleNext.current[0]);
  const secondaryBubble = useRef(bubbleNext.current[1] || bubbleNext.current[0]);
  const tertiaryBubble = useRef(bubbleNext.current[2] || bubbleNext.current[0]);
  const isSwapping = useRef<boolean>(false);
  const swapAnimation = useRef<number>(0);
  const isGenerateSpecialBall = useRef<boolean>(false);
  const removeBubbles: any[] = [];
  const arrayTime: any = [];

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

  const caculateScore = (pop: number) => {
    return pop * 30;
  };

  const resetGame = () => {
    gridRef.current.numRows = GRID_ROWS;
    gridRef.current.numCols = girdColumns;
    gridRef.current.movement = 0;
    gameProperties.current.score = 0;
    gameProperties.current.shotsInRound = 0;
    gameState.isPause = false;
    gameState.isGameOver = false;
    gameState.isWin = false;
    gameState.countShoot = 0;
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
      showAlert('You Win!');
    }
  };

  const checkGameOVer = (gridBubble: Record<string, Bubble>) => {
    if (getHeight(gridBubble) >= LIMIT_HEIGHT) {
      freezeGame();
      showAlert('Game Over!');
    }
  };

  const checkGamePause = () => {
    if (isModalOpen || isModalSettingOpen || gameState.isPause) {
      return true;
    }
    return false;
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
      
      // Handle bounce animation
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
  };

  const drawBubblePopping = (removeBubbles: any[], p5: p5Types) => {
    for (let i = removeBubbles.length - 1; i >= 0; i--) {
      const bubble = removeBubbles[i];
      const imageBubble = bubble.isSpecial
        ? image.imageSpecialBall
        : image.imageDraw;
      const centerX: number = bubble.x;
      const centerY: number = bubble.y;
      const imgWidth: number = imageBubble.width;
      const imgHeight: number = imageBubble.height;
      const imgDiameter: number = Math.max(imgWidth, imgHeight);
      const scale: number = (bubble.r * 2) / imgDiameter;
      const imgX: number = centerX - (imgWidth / 2) * scale;
      const imgY: number = centerY - (imgHeight / 2) * scale;
      
      if (bubble.vy == undefined) {
        bubble.vy = -18; // Reduced initial velocity
        bubble.vx = p5.random(-10, 10); // Reduced horizontal movement
        bubble.g = 0.6; // Gentler gravity for longer animation
        bubble.rotation = 0;
        bubble.rotationSpeed = p5.random(-0.6, 0.6); // Slightly reduced rotation
        bubble.scale = 1.1; // Smaller starting scale
        bubble.scaleSpeed = -0.012; // Slower scale reduction
        bubble.fade = 1; // Opacity for fade effect
        bubble.fadeSpeed = -0.012; // Slower fade for longer animation
        bubble.pulse = 0; // For pulsing effect
        bubble.pulseSpeed = 0.5; // Slightly reduced pulse
        bubble.bounceCount = 0; // Track bounces
        bubble.maxBounces = 3; // Reduced bounces
        bubble.trail = []; // For trail effect
      }
      
      // Update animation properties
      bubble.rotation += bubble.rotationSpeed;
      bubble.scale += bubble.scaleSpeed;
      bubble.scale = Math.max(0.35, bubble.scale); // Don't get too small
      bubble.fade += bubble.fadeSpeed;
      bubble.fade = Math.max(0, bubble.fade);
      bubble.pulse += bubble.pulseSpeed;
      
      // Add trail effect
      bubble.trail.push({ x: bubble.x, y: bubble.y, fade: 1 });
      if (bubble.trail.length > 6) { // Reduced trail length
        bubble.trail.shift();
      }
      
      if (bubble.scale > 0.35 && bubble.fade > 0) {
        // Create pulsing glow effect
        const pulseGlow = 1 + 0.4 * Math.sin(bubble.pulse); // Reduced glow intensity
        
        // Draw trail effect
        for (let j = 0; j < bubble.trail.length; j++) {
          const trailPoint = bubble.trail[j];
          const trailFade = trailPoint.fade * bubble.fade;
          const trailScale = bubble.scale * (j / bubble.trail.length);
          
          p5.push();
          p5.translate(trailPoint.x, trailPoint.y);
          p5.rotate(bubble.rotation * 0.5);
          p5.scale(trailScale);
          
          p5.push();
          p5.noStroke();
          p5.fill(bubble.color + Math.floor(trailFade * 80).toString(16).padStart(2, '0'));
          p5.ellipse(0, 0, bubble.r * 2 + 8); // Reduced trail glow
          p5.pop();
          
          p5.push();
          p5.tint(255, trailFade * 255);
          p5.fill(bubble.color);
          p5.noStroke();
          p5.ellipse(0, 0, bubble.r * 2);
          // Use a simple circle instead of image to avoid canvas performance issues
          p5.ellipse(0, 0, bubble.r * 2 * 0.8);
          p5.pop();
          
          p5.pop();
          
          trailPoint.fade -= 0.12;
        }
        
        p5.push();
        p5.translate(bubble.x, bubble.y);
        p5.rotate(bubble.rotation);
        p5.scale(bubble.scale);
        
        // Draw enhanced glow effect
        p5.push();
        p5.noStroke();
        p5.fill(bubble.color + Math.floor(bubble.fade * 150).toString(16).padStart(2, '0'));
        p5.ellipse(0, 0, bubble.r * 2 + 18 * pulseGlow); // Reduced glow size
        p5.pop();
        
        // Draw main bubble with enhanced fade
        p5.push();
        p5.tint(255, bubble.fade * 255);
        p5.fill(bubble.color);
        p5.noStroke();
        p5.ellipse(0, 0, bubble.r * 2);
        // Use a simple circle instead of image to avoid canvas performance issues
        p5.ellipse(0, 0, bubble.r * 2 * 0.8);
        p5.pop();
        
        p5.pop();

        // Update physics with bounce logic
        bubble.vy += bubble.g;
        bubble.x -= bubble.vx;
        bubble.y += bubble.vy;

        // Enhanced bounce off walls with energy loss
        if (bubble.x - bubble.r <= 0 || bubble.x + bubble.r >= gameWidth) {
          bubble.x += bubble.vx;
          bubble.vx = -bubble.vx * 0.65; // More energy loss on bounce
          bubble.bounceCount++;
        }
        
        // Bounce off bottom with energy loss
        if (bubble.y + bubble.r >= gameHeight && bubble.vy > 0) {
          bubble.y = gameHeight - bubble.r;
          bubble.vy = -bubble.vy * 0.55; // Bounce off bottom
          bubble.bounceCount++;
        }
        
        // Remove when off screen, fully faded, or too many bounces
        if (bubble.y >= gameHeight + 80 || bubble.scale <= 0.35 || bubble.fade <= 0 || bubble.bounceCount >= bubble.maxBounces) {
          removeBubbles.splice(i, 1);
        }
      } else {
        removeBubbles.splice(i, 1);
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
    const bubbleRadius = 18; // Same as launcher bubble radius
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
      
      // Draw flowing bubbles with opposite colors during animation
      p5.push();
      
      // Top bubble flowing to left position
      p5.fill(secondaryBubble.current.color || '#ffffff');
      p5.noStroke();
      const topToLeftX = p5.lerp(topBubbleX, leftBubbleX, easeProgress);
      const topToLeftY = p5.lerp(topBubbleY, leftBubbleY, easeProgress);
      p5.ellipse(topToLeftX, topToLeftY, 36);
      
      // Left bubble flowing to right position
      p5.fill(tertiaryBubble.current.color || '#ffffff');
      p5.noStroke();
      const leftToRightX = p5.lerp(leftBubbleX, rightBubbleX, easeProgress);
      const leftToRightY = p5.lerp(leftBubbleY, rightBubbleY, easeProgress);
      p5.ellipse(leftToRightX, leftToRightY, 36);
      
      // Right bubble flowing to top position
      p5.fill(activeBubble.current.color || '#ffffff');
      p5.noStroke();
      const rightToTopX = p5.lerp(rightBubbleX, topBubbleX, easeProgress);
      const rightToTopY = p5.lerp(rightBubbleY, topBubbleY, easeProgress);
      p5.ellipse(rightToTopX, rightToTopY, 36);
      
      // Overlay bubble images
      const imgWidth = image.imageDraw.width;
      const imgHeight = image.imageDraw.height;
      const imgScale = 36 / Math.max(imgWidth, imgHeight);
      
      p5.image(
        image.imageDraw,
        topToLeftX - imgWidth * imgScale / 2,
        topToLeftY - imgHeight * imgScale / 2,
        imgWidth * imgScale,
        imgHeight * imgScale
      );
      
      p5.image(
        image.imageDraw,
        leftToRightX - imgWidth * imgScale / 2,
        leftToRightY - imgHeight * imgScale / 2,
        imgWidth * imgScale,
        imgHeight * imgScale
      );
      
      p5.image(
        image.imageDraw,
        rightToTopX - imgWidth * imgScale / 2,
        rightToTopY - imgHeight * imgScale / 2,
        imgWidth * imgScale,
        imgHeight * imgScale
      );
      
      p5.pop();
    }
  };

  const drawGameOverWarningLine = (p5: p5Types) => {
    // Calculate the Y position for the game-over warning line
    // This should be at row 9 (LIMIT_HEIGHT) from the top
    const warningLineY = grid.startY + (LIMIT_HEIGHT * grid.bubbleDiameter * 0.866); // Hexagonal grid spacing
    
    p5.push();
    
    // Draw elegant animated warning line
    const time = p5.frameCount * 0.03;
    const alpha = 200 + Math.sin(time) * 55; // Much more vibrant pulsing effect
    
    // Main warning line with saw-tooth pattern
    const lineWidth = gameWidth;
    const toothCount = 25; // Number of saw teeth
    const toothWidth = lineWidth / toothCount;
    const toothHeight = 8; // Height of each tooth
    
    for (let i = 0; i < toothCount; i++) {
      const x1 = i * toothWidth;
      const x2 = (i + 1) * toothWidth;
      const segmentAlpha = alpha + Math.sin(time + i * 0.3) * 30;
      
      // Draw saw tooth pattern
      const y1 = warningLineY - toothHeight/2;
      const y2 = warningLineY + toothHeight/2;
      
      p5.stroke(255, 0, 0, segmentAlpha); // Bright vibrant red color
      p5.strokeWeight(3); // Thicker line for more impact
      
      // Draw the tooth (diagonal line up, then down)
      p5.line(x1, y2, x1 + toothWidth/2, y1); // Up diagonal
      p5.line(x1 + toothWidth/2, y1, x2, y2); // Down diagonal
    }
    
    // Add elegant animated dots along the line
    const dotCount = 15;
    for (let i = 0; i < dotCount; i++) {
      const x = (i / (dotCount - 1)) * gameWidth;
      const dotTime = time + i * 0.3;
      const dotAlpha = alpha + Math.sin(dotTime) * 40;
      const dotSize = 4 + Math.sin(dotTime * 2) * 1; // Slightly larger size variation
      
      p5.fill(255, 50, 50, dotAlpha); // More vibrant red dots
      p5.noStroke();
      p5.ellipse(x, warningLineY, dotSize);
    }
    
    // Add vibrant glow effect above and below the line
    p5.fill(255, 0, 0, 40); // More vibrant red glow
    p5.noStroke();
    p5.rect(0, warningLineY - 3, gameWidth, 6); // Thicker glow
    
    p5.pop();
  };

  const drawHoverArrow = (p5: p5Types, startX: number, startY: number, targetX: number, targetY: number, color: string) => {
    // Don't draw arrow if swapping is happening or in swap area
    if (isSwapAnimating.current || swapAnimationProgress.current > 0 || isInSwapArea.current) {
      return;
    }
    
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
    
    // Draw animated dots only (no connected line or arrowhead)
    const dotCount = 8;
    const dotSpeed = 0.015; // Slower speed for more relaxed animation
    const dotProgress = (p5.frameCount * dotSpeed) % 1; // Continuous loop
    
    for (let i = 0; i < dotCount; i++) {
      // Calculate animated position for each dot
      const baseProgress = i / (dotCount - 1);
      const animatedProgress = (baseProgress + dotProgress) % 1; // Add travel offset
      const dotDistance = animatedProgress * arrowLength;
      
      const x = startX + Math.cos(angle) * dotDistance;
      const y = startY + Math.sin(angle) * dotDistance;
      
      // Animated dots are smaller and bright
      const dotSize = 6;
      
      // Bright white animated dots
      p5.fill(255, 255, 255, 200); // Bright white with transparency
      p5.ellipse(x, y, dotSize);
      
      // Add glow effect around animated dots
      p5.fill(color + '40'); // Bubble color with transparency
      p5.ellipse(x, y, dotSize + 4); // Glow effect
    }
    
    p5.pop();
  };

  const drawTripleBubbleLauncher = (p5: p5Types) => {
    const launcherX = gameWidth / 2;
    const launcherY = gameHeight - 80;
    const bubbleRadius = 18; // Slightly bigger bubbles for better visibility
    
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
      p5.pop();
      
      // Draw secondary bubble (bottom-left)
      p5.push();
      p5.translate(launcherX - 30, launcherY + 20);
      p5.fill(secondaryBubble.current.color || '#ffffff'); // Fallback color
      p5.noStroke();
      p5.ellipse(0, 0, bubbleRadius * 2);
      // Overlay bubble image
      p5.image(
        image.imageDraw,
        -imgWidth * imgScale / 2,
        -imgHeight * imgScale / 2,
        imgWidth * imgScale,
        imgHeight * imgScale
      );
      p5.pop();
      
      // Draw tertiary bubble (bottom-right)
      p5.push();
      p5.translate(launcherX + 30, launcherY + 20);
      p5.fill(tertiaryBubble.current.color || '#ffffff'); // Fallback color
      p5.noStroke();
      p5.ellipse(0, 0, bubbleRadius * 2);
      // Overlay bubble image
      p5.image(
        image.imageDraw,
        -imgWidth * imgScale / 2,
        -imgHeight * imgScale / 2,
        imgWidth * imgScale,
        imgHeight * imgScale
      );
      p5.pop();
      
      // Draw hover arrow if holding (but not during swap animation or in swap area)
      if (isHolding.current && !isSwapAnimating.current && swapAnimationProgress.current === 0 && !isInSwapArea.current) {
        drawHoverArrow(p5, launcherX, launcherY - 35, p5.mouseX, p5.mouseY, activeBubble.current.color || '#ffffff');
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
  };

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(gameWidth, gameHeight).parent(canvasParentRef);
    
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

    // Update and draw particles
    updateAndDrawParticles(p5);

    // draw when ball fall down
    drawBubblePopping(removeBubbles, p5);

    // check is win
    checkIsWin(gridBubble.current);

    // game over
    checkGameOVer(gridBubble.current);

    // Check for disconnected bubbles periodically
    checkDisconnectedBubbles(p5);

    // render bubble list
    renderBubbleList(p5, gridBubble.current);
    
    // Draw game over warning line
    drawGameOverWarningLine(p5);

    //check the bubble hit the wall
    if (
      activeBubble.current.x - activeBubble.current.r <= 0 ||
      activeBubble.current.x + activeBubble.current.r >= gameWidth
    ) {
      activeBubble.current.speedX = -activeBubble.current.speedX;
    }

    if (specialBubble.current.isAnswered === Answer.WRONG) {
      activeBubble.current.isSpecial = false;
    }

    // check when the bubble collides with the grid and insert bubble
    if (activeBubble.current.isMoving === true) {
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
          console.log("Broke bubbles, counter stays at:", gameProperties.current.shotsInRound);
          
          let extra = verifyGrid(gridBubble.current, removeBubbles);
          gameProperties.current.score += caculateScore(pop + extra);
          
          // Create enhanced explosion particles at collision point
          createParticles(activeBubble.current.x, activeBubble.current.y, activeBubble.current.color, p5);
          
          // Add impact effect - create a ripple effect at collision point
          const impactParticles = [];
          for (let i = 0; i < 8; i++) {
            const angle = (p5.TWO_PI * i) / 8;
            const speed = p5.random(3, 8);
            impactParticles.push({
              x: activeBubble.current.x,
              y: activeBubble.current.y,
              vx: p5.cos(angle) * speed,
              vy: p5.sin(angle) * speed,
              life: 1,
              maxLife: 1,
              color: activeBubble.current.color,
              size: p5.random(3, 6),
              rotation: 0,
              rotationSpeed: p5.random(-0.2, 0.2),
              scale: 1.0,
              scaleSpeed: -0.015,
              pulse: 0,
              pulseSpeed: 0.2,
              trail: [] // Initialize trail array
            });
          }
          
          // Add impact particles to main particle array
          particles.push(...impactParticles);
          
          // Create additional particles for each popped bubble with easing
          for (let i = 0; i < Math.min(pop + extra, 3); i++) {
            const randomX = activeBubble.current.x + p5.random(-15, 15);
            const randomY = activeBubble.current.y + p5.random(-15, 15);
            createParticles(randomX, randomY, activeBubble.current.color, p5);
          }
        } else {
          // Shot attached but didn't break bubbles - count this shot
          gameProperties.current.shotsInRound++;
          console.log("No bubbles broken, shots in round:", gameProperties.current.shotsInRound);
          
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
      } else if (activeBubble.current.isMoving && activeBubble.current.y <= 0) {
        // Shot missed completely (went off screen) - count this shot
        gameProperties.current.shotsInRound++;
        console.log("Shot missed (off screen), shots in round:", gameProperties.current.shotsInRound);
        
        // Reset bubble
        activeBubble.current.x = bubbleStartX;
        activeBubble.current.y = bubbleStartY;
        activeBubble.current.speedX = 0;
        activeBubble.current.speedY = 0;
        activeBubble.current.isMoving = false;
        activeBubble.current.animationProps = undefined;
      }
      
      // Check if we've used all 5 shots without breaking bubbles (moved outside collision detection)
      if (gameProperties.current.shotsInRound >= 5) {
        console.log("5 shots without breaking bubbles, dropping grid");
        // Drop the entire grid down
        gridRef.current.numRows++;
        addRowBubbleList(
          gridBubble.current,
          gridRef.current,
          gameProperties.current.color
        );
        
        // Reset shots remaining to 5 for next round
        gameProperties.current.shotsInRound = 0;
      }
    }

    // Draw dual-bubble launcher
    drawTripleBubbleLauncher(p5);
    
    // Draw hover arrow if holding (draw it here to ensure it's always visible)
    if (isHolding.current) {
      const launcherX = gameWidth / 2;
      const launcherY = gameHeight - 80;
      // Use actual mouse position instead of hoverTarget
      drawHoverArrow(p5, launcherX, launcherY - 35, p5.mouseX, p5.mouseY, activeBubble.current.color);
    }

    // Arrow trajectory removed - will be re-implemented later

    // Draw the active bubble when it's moving
    if (activeBubble.current.isMoving) {
      drawBubble(activeBubble.current, p5);
    }

    //score
    const scoreText = document.getElementById("score");
    if (scoreText) {
      scoreText.innerHTML = ` ${gameProperties.current.score} `;
    }

    // Display shots remaining (for debugging and player info)
    const timeText = document.getElementById("time");
    if (timeText) {
      timeText.innerHTML = ` ${5 - gameProperties.current.shotsInRound} `;
    }

    // Check for disconnected bubbles more frequently
    if (p5.frameCount % 15 === 0) {
      verifyGrid(gridBubble.current, removeBubbles);
    }

    if (
      activeBubble.current.isSpecial &&
      specialBubble.current.isAnswered === Answer.NOT_YET
    ) {
      return;
    }
    activeBubble.current.x += activeBubble.current.speedX;
    activeBubble.current.y += activeBubble.current.speedY;
  };

  const mouseClicked = (p5: p5Types) => {
    if (!checkGamePause()) {
      if (p5.mouseX !== 0 && p5.mouseY !== 0) {
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
          p5.mouseX >= launcherAreaX &&
          p5.mouseX <= launcherAreaX + launcherAreaWidth &&
          p5.mouseY >= launcherAreaY &&
          p5.mouseY <= launcherAreaY + launcherAreaHeight
        ) {
          // Set swap area flag and swap bubbles
          isInSwapArea.current = true;
          swapBubbles();
          return;
        }
        
        // Only allow shooting if not in swap area and bubble is not moving
        if (
          p5.mouseY <= gameHeight &&
          p5.mouseX >= 0 &&
          p5.mouseX <= gameWidth &&
          !activeBubble.current.isMoving
        ) {
          if (
            activeBubble.current.isSpecial &&
            specialBubble.current.isAnswered === Answer.NOT_YET
          ) {
            setIsModalOpen(true);
            return;
          }

          let dx = p5.mouseX - activeBubble.current.x;
          let dy = p5.mouseY - activeBubble.current.y;
          let magnitude = Math.sqrt(dx * dx + dy * dy);
          
          // Ensure minimum distance for shooting
          if (magnitude > 10) {
            let speed = activeBubble.current.speed;
            activeBubble.current.speedX = (speed * dx) / magnitude;
            activeBubble.current.speedY = (speed * dy) / magnitude;
            activeBubble.current.isMoving = true;
            gameState.countShoot++;
          }
        }
      }
    }
  };
  
  // Add mouse pressed and released handlers for arrow
  const mousePressed = (p5: p5Types) => {
    console.log('Mouse pressed');
    isHolding.current = true;
  };
  
  const mouseReleased = (p5: p5Types) => {
    console.log('Mouse released');
    isHolding.current = false;
    hoverTarget.current.x = 0;
    hoverTarget.current.y = 0;
  };
  
  const keyPressed = (p5: p5Types) => {
    console.log('Key pressed:', p5.key);
    if (p5.key === ' ') {
      isHolding.current = !isHolding.current;
      console.log('Space pressed, holding:', isHolding.current);
    }
  };

  const mouseMoved = (p5: p5Types) => {
    // Always update hover target when mouse moves
    if (p5.mouseX !== 0 || p5.mouseY !== 0) {
      hoverTarget.current.x = p5.mouseX;
      hoverTarget.current.y = p5.mouseY;
    }
  };

  const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default), {
    ssr: false,
  });

  const showAlert = (message: string) => {
    if (alertActive) return;
    
    alertActive = true;
    freezeGame();

    // Determine if it's a win or game over
    const isWin = message.includes('Win');
    const isGameOver = message.includes('Over');

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
      background: linear-gradient(135deg, #1e3a8a, #3b82f6);
      padding: 30px 40px;
      border-radius: 20px;
      z-index: 1001;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      border: 3px solid #1e40af;
      min-width: 280px;
      opacity: 0;
      transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;

    // Create animated background particles
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
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement("div");
      particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 8 + 4}px;
        height: ${Math.random() * 8 + 4}px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: float 3s ease-in-out infinite;
        animation-delay: ${Math.random() * 2}s;
      `;
      particlesContainer.appendChild(particle);
    }

    // Add CSS animation for particles
    const style = document.createElement("style");
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
    `;
    document.head.appendChild(style);

    alertBox.innerHTML = `
      <div style="position: relative; z-index: 2;">
        <div style="
          font-size: 32px;
          font-weight: bold;
          color: white;
          margin-bottom: 20px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          animation: bounce 1s ease-in-out;
        ">${message}</div>
        <div style="
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 25px;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        ">${isWin ? '🎉 Congratulations! 🎉' : '💪 Try again! 💪'}</div>
        <button id="alert-ok-btn" style="
          padding: 12px 30px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-radius: 25px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          animation: pulse 2s ease-in-out infinite;
        ">OK</button>
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
        okBtn.style.transform = 'scale(1.1)';
        okBtn.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2))';
        okBtn.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
      });
      
      okBtn.addEventListener("mouseleave", () => {
        okBtn.style.transform = 'scale(1)';
        okBtn.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))';
        okBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
      });

      okBtn.addEventListener("click", () => {
        // Animate out
        overlay.style.opacity = '0';
        alertBox.style.opacity = '0';
        alertBox.style.transform = 'translate(-50%, -50%) scale(0.3)';
        
        setTimeout(() => {
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
          resetGame();
        }, 500);
      }, { once: true });
    }
  };

  return (
    <main className="bubble-shooter__game">
      <header className="bubble-shooter__game-header">
                  <div className="bubble-shooter__game-score-bar">
            <img width={198} height={90} src={score.src} alt="遊戲積分" />
            <p id="score"></p>
          </div>
          <div className="bubble-shooter__game-time-bar">
            <img width={198} height={90} src={time.src} alt="遊戲時間" />
            <p id="time"></p>
          </div>
      </header>
      <aside className="bubble-shooter__game-aside">
        <ul>
          <li
            onClick={() => {
              gameState.isPause = false;
            }}
          >
            <Image width={60} height={60} src={play} alt="遊戲按鈕" />
          </li>
          <li
            onClick={() => {
              gameState.isPause = true;
            }}
          >
            <Image width={60} height={60} src={pause} alt="暫停按鈕" />
          </li>
          <li onClick={() => setIsModalSettingOpen(true)}>
            <Image width={60} height={60} src={setting} alt="設定按鈕" />
          </li>
        </ul>
      </aside>
      <article className="bubble-shooter__game-main">
        <Sketch
          setup={setup}
          draw={draw}
          preload={preload}
          mouseClicked={mouseClicked}
          mouseMoved={mouseMoved}
          mousePressed={mousePressed}
          mouseReleased={mouseReleased}
          keyPressed={keyPressed}
        />
        <Modal
          title="Question"
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
        >
          <p>Press Ok button for the correct answer</p>
          <p>Press Cancel button for the wrong answer</p>
        </Modal>

        {/* for testing  */}
        <Modal
          title="Setting"
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
            <label htmlFor="">Color:</label>
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
                  rules={[{ required: true, message: "Please input color!" }]}
                >
                  <Input />
                </Form.Item>
              );
            })}
            <label htmlFor="">Move down after (second):</label>
            <Form.Item
              name="moveDown"
              rules={[{ required: true, message: "Please input time!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 0, span: 16 }}>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </article>

      <footer className="bubble-shooter__game-footer">
        <div id="activeBubble"></div>
        <div id="secondaryBubble"></div>

      </footer>
    </main>
  );
};

export default Board;