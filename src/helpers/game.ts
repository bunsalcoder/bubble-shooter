import {
  BUBBLE_DIAMETER,
  BUBBLE_SPEED,
  GRID_COLUMNS,
  GRID_ROWS,
} from "./../utils/contants";
import {
  BUBBLE_RADIUS,
  BUBBLE_START_X,
  BUBBLE_START_Y,
  NUM_NEXT_BUBBLES,
} from "@/utils/contants";
import { Bubble, Grid } from "@/models/game";

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
        r: BUBBLE_RADIUS,
        color: randomColor(arrayColor),
        isMoving: false,
        isSpecial: false,
      };
    }
  }
  grid.movement = grid.numRows * grid.bubbleDiameter;
  return bubbleObject;
};

export const createListBubbleNext = (arrayColor: string[]) => {
  const bubbles = [];
  const bubbleQueue = [];
  for (let i = 0; i < NUM_NEXT_BUBBLES; i++) {
    const bubbleX = BUBBLE_START_X - i * BUBBLE_RADIUS * 2;
    const bubble: Bubble = {
      x: bubbleX,
      y: BUBBLE_START_Y,
      speed: BUBBLE_SPEED,
      speedX: 0,
      speedY: 0,
      r: BUBBLE_RADIUS,
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

export const updateDirectionBubbleNext = (bubbleQueue: any) => {
  for (let i in bubbleQueue) {
    bubbleQueue[i].x += BUBBLE_DIAMETER;
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
      r: BUBBLE_RADIUS,
      color: randomColor(arrayColor),
      isMoving: false,
      isSpecial: false,
    };
  }
  grid.movement += BUBBLE_DIAMETER;
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
          loc[1] <= GRID_COLUMNS
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
    BUBBLE_RADIUS +
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
  while (index < locs.length) {
    let loc = locs[index];
    loc = [
      parseInt(loc.slice(0, loc.indexOf(","))),
      parseInt(loc.slice(loc.indexOf(",") + 1, loc.length)),
    ];
    index++;
    if (!(loc in marked)) {
      let group = flood(gridBubble, loc[0], loc[1]);
      let maxRow = group[0][0];
      for (let index2 = 1; index2 < group.length; index2++) {
        if (group[index2][0] > maxRow) {
          maxRow = group[index2][0];
        }
      }

      if (maxRow < GRID_ROWS) {
        for (let index2 = 0; index2 < group.length; index2++) {
          removeBubbles.push(
            gridBubble[`${group[index2][0]},${group[index2][1]}`]
          );
          removeBubble(gridBubble, group[index2][0], group[index2][1]);
          removed++;
        }
      }
      for (let index2 = 0; index2 < group.length; index2++) {
        marked[group[index2]] = 0;
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
