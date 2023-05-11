import {
  addRowBubbleList,
  checkCollision,
  colorFlood,
  createGridBubble,
  createListBubbleNext,
  getAdjacentForSpecialBubble,
  getAllColors,
  getHeight,
  getLocation,
  getSize,
  inGrid,
  randomColor,
  randomInt,
  updateDirectionBubbleNext,
  verifyGrid,
} from "@/helpers/game";
import { Answer, Bubble, GameState, Grid } from "@/models/game";
import {
  BUBBLE_DIAMETER,
  BUBBLE_RADIUS,
  BUBBLE_SPEED,
  BUBBLE_START_X,
  BUBBLE_START_Y,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRID_COLUMNS,
  GRID_ROWS,
  LIMIT_HEIGHT,
  TIME_COUNT_DOWN,
} from "@/utils/contants";
import { Button, Form, Input, Modal } from "antd";
import dynamic from "next/dynamic";
import p5Types from "p5";
import React, { useRef, useState } from "react";
import nextBubble from "@public/bubble-shooter/background/next-bubble.png";
import score from "@public/bubble-shooter/background/score.png";
import time from "@public/bubble-shooter/background/time.png";
import role from "@public/bubble-shooter/element/role_cat.png";
import pause from "@public/bubble-shooter/icon/pause.png";
import play from "@public/bubble-shooter/icon/play.png";
import setting from "@public/bubble-shooter/icon/setting.png";
import Image from "next/image";

const Board: React.FC = () => {
  let gameState: GameState = {
    countShoot: 0,
    isGameOver: false,
    isWin: false,
    isPause: false,
    defaultTime: TIME_COUNT_DOWN,
  };

  let grid: Grid = {
    numRows: GRID_ROWS,
    numCols: GRID_COLUMNS,
    bubbleDiameter: BUBBLE_DIAMETER,
    bubbleMargin: 0,
    startX: BUBBLE_RADIUS + 10,
    startY: BUBBLE_RADIUS,
    movement: 0,
  };

  const gridRef = useRef<Grid>(grid);

  let image: any = {
    imageDraw: "",
    imageSpecialBall: "",
  };
  const gameProperties = useRef({
    score: 0,
    time: gameState.defaultTime,
    color: [
      "#e74815",
      "#1b9c09",
      "#1f65eb",
      "#31d7e0",
      "#c33dce",
      "#ed9810",
      "#FDE2F3",
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
  const bubbleNext = useRef(createListBubbleNext(gameProperties.current.color));
  const bubble = useRef(bubbleNext.current[0]);
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
    updateDirectionBubbleNext(bubbleNext.current);

    bubble.current = bubbleNext.current[0];
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
    gridRef.current.numCols = GRID_COLUMNS;
    gridRef.current.movement = 0;
    gameProperties.current.score = 0;
    gameProperties.current.time = gameState.defaultTime;
    gameState.isGameOver = false;
    gameState.isWin = false;
    gameState.countShoot = 0;
    bubbleNext.current = createListBubbleNext(gameProperties.current.color);
    gridBubble.current = createGridBubble(
      gridRef.current,
      gameProperties.current.color
    );
    bubble.current = bubbleNext.current[0];
    isGenerateSpecialBall.current = false;
  };

  const checkIsWin = (gridBubble: Record<string, Bubble>) => {
    if (getSize(gridBubble) === 0 && getSize(removeBubbles) === 0) {
      gameState.isWin = true;
      alert("Win!");
      resetGame();
    }
  };

  const checkGameOVer = (gridBubble: Record<string, Bubble>) => {
    if (
      gameProperties.current.time <= 0 ||
      getHeight(gridBubble) >= LIMIT_HEIGHT
    ) {
      gameState.isGameOver = true;
      alert("Game Over!");
      resetGame();
    }
  };

  const checkGamePause = () => {
    if (isModalOpen || isModalSettingOpen || gameState.isPause) {
      return true;
    }
    return false;
  };

  const moveDown = (gridBubble: Record<string, Bubble>) => {
    if (
      gameProperties.current.time !== gameState.defaultTime &&
      gameProperties.current.time % gameProperties.current.moveDownInterval ===
        0 &&
      !arrayTime.includes(gameProperties.current.time)
    ) {
      gridRef.current.numRows++;
      addRowBubbleList(
        gridBubble,
        gridRef.current,
        gameProperties.current.color
      );
      arrayTime.push(gameProperties.current.time);
    }
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
    const bubbleX = BUBBLE_START_X - (bubbleQueue.length + 1) * BUBBLE_DIAMETER;
    const bubble: Bubble = {
      x: bubbleX,
      y: BUBBLE_START_Y,
      speed: BUBBLE_SPEED,
      speedX: 0,
      speedY: 0,
      r: BUBBLE_RADIUS,
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
      if (bubble.isSpecial === true) {
        const imgWidth: number = image.imageSpecialBall.width;
        const imgHeight: number = image.imageSpecialBall.height;
        const imgX: number = centerX - imgWidth / 2;
        const imgY: number = centerY - imgHeight / 2;
        p5.noFill();
        p5.image(image.imageSpecialBall, imgX, imgY);
        p5.ellipse(bubble.x, bubble.y, bubble.r * 2);
      } else {
        const centerX: number = bubble.x;
        const centerY: number = bubble.y;
        const imgWidth: number = image.imageDraw.width;
        const imgHeight: number = image.imageDraw.height;
        const imgDiameter: number = Math.max(imgWidth, imgHeight);
        const scale: number = (bubble.r * 2) / imgDiameter;
        const imgX: number = centerX - (imgWidth / 2) * scale;
        const imgY: number = centerY - (imgHeight / 2) * scale;
        p5.noStroke();
        p5.fill(bubble.color);
        p5.ellipse(bubble.x, bubble.y, bubble.r * 2);
        p5.image(
          image.imageDraw,
          imgX,
          imgY,
          imgWidth * scale,
          imgHeight * scale
        );
      }
    }
  };

  const drawBubblePopping = (removeBubbles: any[], p5: p5Types) => {
    for (let key in removeBubbles) {
      const bubble = removeBubbles[key];
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
        bubble.vy = -10;
        bubble.vx = p5.random(-5, 5);
        bubble.g = 1;
      }
      p5.noStroke();
      p5.fill(bubble.color);
      p5.ellipse(bubble.x, bubble.y, bubble.r * 2);
      p5.image(imageBubble, imgX, imgY, imgWidth * scale, imgHeight * scale);

      bubble.vy += bubble.g;
      bubble.x -= bubble.vx;
      bubble.y += bubble.vy;

      if (bubble.x - bubble.r <= 0 || bubble.x + bubble.r >= GAME_WIDTH) {
        bubble.x += bubble.vx;
      }
      if (bubble.y >= GAME_HEIGHT) {
        delete removeBubbles[key];
      }
    }
  };

  const drawArrow = (p5: p5Types, bubble: Bubble) => {
    const arrowLength: number = 150;
    const startX: number = 400;
    const startY: number = GAME_HEIGHT - 130;
    const dx: number = p5.mouseX - startX;
    const dy: number = p5.mouseY - startY;
    const angle: number = p5.atan2(dy, dx);
    const endX: number = startX + arrowLength * p5.cos(angle);
    const endY: number = startY + arrowLength * p5.sin(angle);
    const arrowSize: number = 30;
    const x1: number = endX - arrowSize * p5.cos(angle - p5.PI / 6);
    const y1: number = endY - arrowSize * p5.sin(angle - p5.PI / 6);
    const x2: number = endX - arrowSize * p5.cos(angle + p5.PI / 6);
    const y2: number = endY - arrowSize * p5.sin(angle + p5.PI / 6);

    if (p5.drawingContext instanceof CanvasRenderingContext2D) {
      p5.drawingContext.setLineDash([5, 10]);
    }
    p5.stroke(bubble.isSpecial ? "blue" : bubble.color);
    p5.strokeWeight(3);
    p5.line(startX, startY, endX, endY);
    p5.noStroke();
    p5.fill(bubble.isSpecial ? "blue" : bubble.color);
    p5.triangle(endX, endY, x1, y1, x2, y2);
  };

  const loadNextBall = (bubble: any) => {
    const nextBubble = document.getElementById("nextBubble");
    if (nextBubble) {
      if (bubble.isSpecial) {
        nextBubble.innerHTML = `<img src="/bubble-shooter/element/special-ball.png"  />`;
      } else {
        nextBubble.innerHTML = `<img src="/bubble-shooter/background/bubble-mask.png"  />`;
        nextBubble.style.background = bubble.color;
      }
    }
  };

  const preload = (p5: p5Types) => {
    image.imageSpecialBall = p5.loadImage(
      "/bubble-shooter/element/special-ball.png",
      () => {
        image.imageSpecialBall.resize(BUBBLE_DIAMETER, BUBBLE_DIAMETER);
      }
    );
    image.imageDraw = p5.loadImage(
      "/bubble-shooter/background/bubble-mask.png",
      () => {
        image.imageDraw.resize(BUBBLE_DIAMETER, BUBBLE_DIAMETER);
      }
    );
  };

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(GAME_WIDTH, GAME_HEIGHT).parent(canvasParentRef);
  };

  const draw = (p5: p5Types) => {
    p5.clear();

    // draw when ball fall down
    drawBubblePopping(removeBubbles, p5);

    // check is win
    checkIsWin(gridBubble.current);

    // game over
    checkGameOVer(gridBubble.current);

    // move down grid bubble
    moveDown(gridBubble.current);

    // render bubble list
    renderBubbleList(p5, gridBubble.current);

    //check the bubble hit the wall
    if (
      bubble.current.x - bubble.current.r <= 0 ||
      bubble.current.x + bubble.current.r >= GAME_WIDTH
    ) {
      bubble.current.speedX = -bubble.current.speedX;
    }

    if (specialBubble.current.isAnswered === Answer.WRONG) {
      bubble.current.isSpecial = false;
    }

    // check when the bubble collides with the grid and insert bubble
    if (bubble.current.isMoving === true) {
      const [collision, loc] = checkCollision(
        bubble.current,
        gridBubble.current,
        gridRef.current
      );

      if (collision && Array.isArray(loc)) {
        const pop = insertBubble(
          gridBubble.current,
          gridRef.current,
          bubble.current,
          loc[0],
          loc[1]
        );
        if (pop > 0) {
          let extra = verifyGrid(gridBubble.current, removeBubbles);
          gameProperties.current.score += caculateScore(pop + extra);
        }

        renderBubbleList(p5, gridBubble.current);
        specialBubble.current.isAnswered = Answer.NOT_YET;
        bubbleNext.current.shift()!;
        addBubbleNext(gridBubble.current, bubbleNext.current);
        updateDirectionBubbleNext(bubbleNext.current);

        bubble.current = bubbleNext.current[0];
        bubble.current.x = BUBBLE_START_X;
        bubble.current.y = BUBBLE_START_Y;
        bubble.current.speedX = 0;
        bubble.current.speedY = 0;
      }
    }

    // load next bubble
    loadNextBall(bubbleNext.current[1]);

    //draw bubble
    drawBubble(bubbleNext.current[0], p5);

    // draw arrow
    drawArrow(p5, bubbleNext.current[0]);

    //score
    const scoreText = document.getElementById("score");
    if (scoreText) {
      scoreText.innerHTML = ` ${gameProperties.current.score} `;
    }

    //time countdown
    if (
      p5.frameCount % 70 == 0 &&
      gameProperties.current.time > 0 &&
      !gameState.isPause
    ) {
      gameProperties.current.time--;
    }
    const countdownText = document.getElementById("time");
    if (countdownText) {
      countdownText.innerHTML = ` ${p5.round(gameProperties.current.time)} `;
    }

    if (
      bubble.current.isSpecial &&
      specialBubble.current.isAnswered === Answer.NOT_YET
    ) {
      return;
    }
    bubble.current.x += bubble.current.speedX;
    bubble.current.y += bubble.current.speedY;
  };

  const mouseClicked = (p5: p5Types) => {
    if (!checkGamePause()) {
      if (p5.mouseX !== 0 && p5.mouseY !== 0) {
        if (
          p5.mouseY <= GAME_HEIGHT &&
          p5.mouseX >= 0 &&
          p5.mouseX <= GAME_WIDTH
        ) {
          if (bubble.current.isMoving) return;
          if (
            bubble.current.isSpecial &&
            specialBubble.current.isAnswered === Answer.NOT_YET
          ) {
            setIsModalOpen(true);
          }

          let dx = p5.mouseX - bubble.current.x;
          let dy = p5.mouseY - bubble.current.y;
          let magnitude = Math.sqrt(dx * dx + dy * dy);
          let speed = bubble.current.speed;
          bubble.current.speedX = (speed * dx) / magnitude;
          bubble.current.speedY = (speed * dy) / magnitude;
          bubble.current.isMoving = true;
          gameState.countShoot++;
        }
      }
    }
  };

  const mouseMoved = (p5: p5Types) => {};
  const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default), {
    ssr: false,
  });

  return (
    <main className="bubble-shooter__game">
      <header className="bubble-shooter__game-header">
        <Image width={198} height={90} src={score} alt="遊戲積分" />
        <p id="score"></p>
        <Image width={198} height={90} src={time} alt="遊戲時間" />
        <p id="time"></p>
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
              gameState.defaultTime = values.time;
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
            <label htmlFor="">Time:</label>
            <Form.Item
              name="time"
              rules={[{ required: true, message: "Please input time!" }]}
            >
              <Input />
            </Form.Item>
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
        <Image width={230} height={220} src={role} alt="存保象" />
        <Image width={195} height={125} src={nextBubble} alt="下一個泡泡" />
        <div id="nextBubble"></div>
      </footer>
    </main>
  );
};

export default Board;
