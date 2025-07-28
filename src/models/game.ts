export interface Bubble {
  x: number;
  y: number;
  speed: number;
  speedX: number;
  speedY: number;
  r: number;
  color: string;
  isMoving: boolean;
  isSpecial: boolean;
  animationProps?: {
    startTime: number;
    startScale: number;
    pulsePhase: number;
    glowIntensity: number;
  };
}
export interface Grid {
  numRows: number;
  numCols: number;
  bubbleDiameter: number;
  bubbleMargin: number;
  startX: number;
  startY: number;
  movement: number;
}

export interface GameState {
  countShoot: number;
  isGameOver: boolean;
  isWin: boolean;
  isPause: boolean;
  defaultTime: number;
}

export enum Answer {
  WRONG = "WRONG",
  CORRECT = "CORRECT",
  NOT_YET = "NOT_YET",
}

export enum DeviceType {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
}
