import { isMobile } from "react-device-detect";
import {
  BUBBLE_DIAMETER,
  BUBBLE_DIAMETER_MEDIUM,
  BUBBLE_DIAMETER_SMALL,
  BUBBLE_RADIUS_MEDIUM,
  BUBBLE_RADIUS_SMALL,
  BUBBLE_SPEED,
  BUBBLE_START_X_MEDIUM,
  BUBBLE_START_X_SMALL,
  BUBBLE_START_Y_MEDIUM,
  BUBBLE_START_Y_SMALL,
  GAME_HEIGHT,
  GAME_HEIGHT_MEDIUM,
  GAME_HEIGHT_SMALL,
  GAME_WIDTH,
  GAME_WIDTH_MEDIUM,
  GAME_WIDTH_SMALL,
  GRID_COLUMNS,
  GRID_COLUMNS_MEDIUM,
  GRID_COLUMNS_SMALL,
  GRID_ROWS,
} from "./../utils/contants";
import {
  BUBBLE_RADIUS,
  BUBBLE_START_X,
  BUBBLE_START_Y,
  NUM_NEXT_BUBBLES,
} from "@/utils/contants";
import { Bubble, DeviceType, Grid } from "@/models/game";

export const randomColor = (arrayColor: string[]) => {
  return arrayColor[Math.floor(Math.random() * arrayColor.length)];
};

export const getAllColors = (gridBubble: Record<string, Bubble>) => {
  let colors: any = {};
  let keys = Object.keys(gridBubble);
  for (let index = 0; index < keys.length; index++) {
    let c = gridBubble[keys[index]].color;
    if (!(c in colors)) {
      colors[c] = 0;
    }
  }
  return Object.keys(colors);
};

export const createGridBubble = (grid: Grid, arrayColor: string[]) => {
  const bubbleObject: Record<string, Bubble> = {};
  let maxY: number = 0;
  for (let i = 1; i <= grid.numRows; i++) {
    for (let j = 1; j <= grid.numCols; j++) {
      let bubbleX =
        grid.startX + (j - 1) * (grid.bubbleDiameter + grid.bubbleMargin);
      if (i % 2 === 1) {
        bubbleX += (grid.bubbleDiameter + grid.bubbleMargin) / 2;
      }
      let bubbleY = grid.startY + (grid.numRows - i) * grid.bubbleDiameter;
      if (bubbleY > maxY) {
        maxY = bubbleY;
      }
      bubbleObject[`${i},${j}`] = {
        x: bubbleX,
        y: bubbleY,
        speed: BUBBLE_SPEED,
        speedX: 0,
        speedY: 0,
        r: grid.bubbleDiameter / 2,
        color: randomColor(arrayColor),
        isMoving: false,
        isSpecial: false,
      };
    }
  }
  grid.movement = grid.numRows * grid.bubbleDiameter;
  return bubbleObject;
};

export const createListBubbleNext = (
  grid: Grid,
  bubbleStartX: number,
  bubbleStartY: number,
  arrayColor: string[]
) => {
  const bubbles = [];
  const bubbleQueue = [];
  for (let i = 0; i < NUM_NEXT_BUBBLES; i++) {
    const bubbleX = bubbleStartX - i * grid.bubbleDiameter;
    const bubble: Bubble = {
      x: bubbleX,
      y: bubbleStartY,
      speed: BUBBLE_SPEED,
      speedX: 0,
      speedY: 0,
      r: grid.bubbleDiameter / 2,
      color: randomColor(arrayColor),
      isMoving: false,
      isSpecial: false,
    };
    bubbles.push(bubble);
    bubbleQueue.push(bubble);
  }
  return bubbleQueue;
};
export const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const updateDirectionBubbleNext = (bubbleQueue: any, grid: Grid) => {
  for (let i in bubbleQueue) {
    bubbleQueue[i].x += grid.bubbleDiameter;
  }
};

export const addRowBubbleList = (
  gridBubble: Record<string, Bubble>,
  grid: Grid,
  arrayColor: string[]
) => {
  // update direction gridBubble
  let key = Object.keys(gridBubble);
  for (let index = 0; index < key.length; index++) {
    let bubble = gridBubble[key[index]];
    bubble.y += grid.bubbleDiameter;
  }
  //add row
  for (let i = 1; i < grid.numCols; i++) {
    let bubbleX =
      grid.startX + (i - 1) * (grid.bubbleDiameter + grid.bubbleMargin);
    if (grid.numRows % 2 === 1) {
      bubbleX += (grid.bubbleDiameter + grid.bubbleMargin) / 2;
    }
    let bubbleY = grid.startY;
    gridBubble[`${grid.numRows},${i}`] = {
      x: bubbleX,
      y: bubbleY,
      speed: BUBBLE_SPEED,
      speedX: 0,
      speedY: 0,
      r: grid.bubbleDiameter / 2,
      color: randomColor(arrayColor),
      isMoving: false,
      isSpecial: false,
    };
  }
  grid.movement += grid.bubbleDiameter;
};

export const inGrid = (
  gridBubble: Record<string, Bubble>,
  row: number,
  col: number
) => {
  if (gridBubble[`${row},${col}`] !== undefined) {
    return true;
  }
  return false;
};

export const getBubble = (
  gridBubble: Record<string, Bubble>,
  row: number,
  col: number
) => {
  return gridBubble[`${row},${col}`];
};

const getMaxCurrentRow = (gridBubble: Record<string, Bubble>) => {
  let locs: any[] = Object.keys(gridBubble);
  let maxRow: number = 0;
  for (let loc of locs) {
    if (parseInt(loc.split(",")[0]) > maxRow) {
      maxRow = parseInt(loc.split(",")[0]);
    }
  }
  return maxRow;
};

export const removeBubble = (
  gridBubble: Record<string, Bubble>,
  row: number,
  col: number
) => {
  if (inGrid(gridBubble, row, col)) {
    delete gridBubble[`${row},${col}`];
    return true;
  }
  return false;
};

export const getAdjacent = (row: number, col: number) => {
  if (Math.abs(row) % 2 === 1) {
    return [
      [row - 1, col],
      [row - 1, col + 1],
      [row, col + 1],
      [row, col - 1],
      [row + 1, col],
      [row + 1, col + 1],
    ];
  } else {
    return [
      [row - 1, col - 1],
      [row - 1, col],
      [row, col + 1],
      [row, col - 1],
      [row + 1, col - 1],
      [row + 1, col],
    ];
  }
};
export const getAdjacentForSpecialBubble = (row: number, col: number) => {
  return [
    [row, col + 1],
    [row, col - 1],
    [row + 1, col],
    [row + 1, col + 1],
    [row + 1, col - 1],
  ];
};

export const flood = (
  gridBubble: Record<string, Bubble>,
  row: number,
  col: number
) => {
  let marked: any = {};
  let stack: number[][] = [];
  let found: any[] = [];
  stack.push([row, col]);

  while (stack.length > 0) {
    let loc: any = stack.pop();
    if (!(loc in marked)) {
      marked[loc] = 0;
      if (inGrid(gridBubble, loc[0], loc[1])) {
        found.push(loc);
        let adj = getAdjacent(loc[0], loc[1]);
        for (let index = 0; index < adj.length; index++) {
          stack.push(adj[index]);
        }
      }
    }
  }

  return found;
};

export const colorFlood = (
  gridBubble: Record<string, Bubble>,
  row: number,
  col: number,
  color: string
) => {
  let marked: any = {};
  let stack: number[][] = [];
  let found: number[][] = [];
  stack.push([row, col]);

  while (stack.length > 0) {
    let loc: any = stack.pop();
    if (!(loc in marked)) {
      marked[loc] = 0;
      if (
        inGrid(gridBubble, loc[0], loc[1]) &&
        getBubble(gridBubble, loc[0], loc[1]).color == color
      ) {
        found.push(loc);
        let adj = getAdjacent(loc[0], loc[1]);
        for (let index = 0; index < adj.length; index++) {
          stack.push(adj[index]);
        }
      }
    }
  }
  return found;
};

export const checkCollision = (
  bubble: Bubble,
  gridBubble: Record<string, Bubble>,
  grid: Grid
) => {
  let loc: number[] = getPosition(bubble.x, bubble.y, grid);
  const row: number = Math.round(loc[0]);
  const col: number = Math.round(loc[1]);
  const adj: any = getAdjacent(row, col);
  adj.push([row, col]);
  if (bubble.y - bubble.r <= 0) {
    loc[0] = getMaxCurrentRow(gridBubble);
    return [true, loc];
  }
  for (let index = 0; index < adj.length; index++) {
    loc = adj[index];
    if (
      inGrid(gridBubble, loc[0], loc[1]) &&
      intersect(bubble, gridBubble[`${loc[0]},${loc[1]}`])
    ) {
      adj.sort(makeComp(bubble, grid));
      for (let index = 0; index < adj.length; index++) {
        loc = adj[index];
        if (
          !inGrid(gridBubble, loc[0], loc[1]) &&
          loc[1] > 0 &&
          loc[1] <= grid.numCols
        ) {
          return [true, loc];
        }
      }
    }
  }
  return [false, null];
};

export const intersect = (bubble: Bubble, circle: Bubble) => {
  const dx: number = bubble.x - circle.x;
  const dy: number = bubble.y - circle.y;
  const rsum: number = bubble.r + circle.r;
  return dx * dx + dy * dy <= rsum * rsum;
};

export const makeComp = (bubble: Bubble, grid: Grid) => {
  return (a: number[], b: number[]) => {
    const pos1: number[] = getLocation(a[0], a[1], grid);
    const pos2: number[] = getLocation(b[0], b[1], grid);
    const da: number = Math.sqrt(
      (bubble.x - pos1[0]) * (bubble.x - pos1[0]) +
        (bubble.y - pos1[1]) * (bubble.y - pos1[1])
    );
    const db = Math.sqrt(
      (bubble.x - pos2[0]) * (bubble.x - pos2[0]) +
        (bubble.y - pos2[1]) * (bubble.y - pos2[1])
    );
    if (da == db) return 0;
    else if (da < db) return -1;
    else return 1;
  };
};

export const getLocation = (row: number, col: number, grid: Grid) => {
  let x: number = grid.startX + grid.bubbleDiameter * (col - 1);
  if (Math.abs(row) % 2 === 1) x += grid.bubbleDiameter / 2;
  const y: number =
    grid.bubbleMargin -
    (grid.bubbleMargin + grid.bubbleDiameter) * row +
    grid.bubbleDiameter / 2 +
    grid.movement;

  return [x, y];
};

export const getPosition = (x: number, y: number, grid: Grid) => {
  let row: number =
    (y - grid.bubbleMargin - grid.startY / 2 - grid.movement) /
    -(grid.bubbleMargin + grid.bubbleDiameter);
  let col: number =
    (x + grid.bubbleDiameter / 2 - grid.bubbleMargin - grid.startY) /
    (grid.bubbleMargin + grid.bubbleDiameter);
  if (Math.abs(row) % 2 == 0)
    col =
      (x +
        grid.bubbleDiameter / 2 -
        grid.bubbleMargin -
        grid.startY -
        grid.bubbleDiameter / 2) /
      (grid.bubbleMargin + grid.bubbleDiameter);

  return [Math.round(row), Math.round(col)];
};

export const verifyGrid = (
  gridBubble: Record<string, Bubble>,
  removeBubbles: any[]
) => {
  let locs: any[] = Object.keys(gridBubble);
  let index = 0;
  let removed = 0;
  let marked: any = {};
  let connectedGroups: any[] = [];
  
  // First pass: find all connected groups
  while (index < locs.length) {
    let loc = locs[index];
    loc = [
      parseInt(loc.slice(0, loc.indexOf(","))),
      parseInt(loc.slice(loc.indexOf(",") + 1, loc.length)),
    ];
    index++;
    if (!(loc in marked)) {
      let group = flood(gridBubble, loc[0], loc[1]);
      connectedGroups.push(group);
      for (let index2 = 0; index2 < group.length; index2++) {
        marked[group[index2]] = 0;
      }
    }
  }
  
  // Second pass: check which groups are connected to the top
  for (let groupIndex = 0; groupIndex < connectedGroups.length; groupIndex++) {
    let group = connectedGroups[groupIndex];
    let isConnectedToTop = false;
    
    // Check if any bubble in this group is in the top row (GRID_ROWS)
    for (let bubbleIndex = 0; bubbleIndex < group.length; bubbleIndex++) {
      if (group[bubbleIndex][0] >= GRID_ROWS) {
        isConnectedToTop = true;
        break;
      }
    }
    
    // If not connected to top, remove all bubbles in this group
    if (!isConnectedToTop) {
      for (let bubbleIndex = 0; bubbleIndex < group.length; bubbleIndex++) {
        let bubbleLoc = group[bubbleIndex];
        if (gridBubble[`${bubbleLoc[0]},${bubbleLoc[1]}`]) {
          removeBubbles.push(
            gridBubble[`${bubbleLoc[0]},${bubbleLoc[1]}`]
          );
          removeBubble(gridBubble, bubbleLoc[0], bubbleLoc[1]);
          removed++;
        }
      }
    }
  }

  //return number of removed bubbles
  return removed;
};

//Get number of bubbles in grid
export const getSize = (gridBubble: any) => {
  return Object.keys(gridBubble).length;
};

export const getHeight = (gridBubble: Record<string, Bubble>) => {
  //get all locations
  let locs: any = Object.keys(gridBubble);
  let min = Infinity,
    max = -Infinity;

  for (let index = 0; index < locs.length; index++) {
    //get current location
    let loc = locs[index];
    loc = [
      parseInt(loc.slice(0, loc.indexOf(","))),
      parseInt(loc.slice(loc.indexOf(",") + 1, loc.length)),
    ];
    if (loc[0] < min) min = loc[0];
    if (loc[0] > max) max = loc[0];
  }
  return max - min + 1;
};

export const getDeviceType = (width: number): string => {
  if (width <= 480 || isMobile) {
    return DeviceType.SMALL;
  } else if (width <= 1024) {
    return DeviceType.MEDIUM;
  } else {
    return DeviceType.LARGE; // default = large
  }
};

export const setBubbleSize = (): [number, number] => {
  if (typeof window !== "undefined") {
    const deviceType = getDeviceType(window.innerWidth);
    if (deviceType === DeviceType.SMALL) {
      return [BUBBLE_RADIUS_SMALL, BUBBLE_DIAMETER_SMALL];
    } else if (deviceType === DeviceType.MEDIUM) {
      return [BUBBLE_RADIUS_MEDIUM, BUBBLE_DIAMETER_MEDIUM];
    } else {
      return [BUBBLE_RADIUS, BUBBLE_DIAMETER];
    }
  }
  return [BUBBLE_RADIUS, BUBBLE_DIAMETER];
};

export const setGameSize = (): [number, number] => {
  if (typeof window !== "undefined") {
    const deviceType = getDeviceType(window.innerWidth);
    if (deviceType === DeviceType.SMALL) {
      return [GAME_WIDTH_SMALL, GAME_HEIGHT_SMALL];
    } else if (deviceType === DeviceType.MEDIUM) {
      return [GAME_WIDTH_MEDIUM, GAME_HEIGHT_MEDIUM];
    } else {
      return [GAME_WIDTH, GAME_HEIGHT];
    }
  }
  return [GAME_WIDTH, GAME_HEIGHT];
};

export const setBubblePosition = (): [number, number] => {
  if (typeof window !== "undefined") {
    const deviceType = getDeviceType(window.innerWidth);
    if (deviceType === DeviceType.SMALL) {
      return [BUBBLE_START_X_SMALL, BUBBLE_START_Y_SMALL];
    } else if (deviceType === DeviceType.MEDIUM) {
      return [BUBBLE_START_X_MEDIUM, BUBBLE_START_Y_MEDIUM];
    } else {
      return [BUBBLE_START_X, BUBBLE_START_Y];
    }
  }
  return [BUBBLE_START_X, BUBBLE_START_Y];
};

export const setGridCols = (): number => {
  if (typeof window !== "undefined") {
    const deviceType = getDeviceType(window.innerWidth);
    if (deviceType === DeviceType.SMALL) {
      return GRID_COLUMNS_SMALL;
    } else if (deviceType === DeviceType.MEDIUM) {
      return GRID_COLUMNS_MEDIUM;
    } else {
      return GRID_COLUMNS;
    }
  }
  return GRID_COLUMNS;
};
