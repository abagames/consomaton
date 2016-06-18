import * as _ from 'lodash';
import Vector from './util/vector';
import * as math from './util/math';

export const width = 36;
export const height = 36;
export let texts: string[][];
export let reversed: boolean[][];
export let beforeCharSet: Function;
export let onCharSet: Function;
export let onCursorMove: Function;
export let onKeyDown: Function;
export let onKeyUp: Function;
export let onOutBoardClick: Function;

const canvasWidth = 640;
const canvasHeight = 640;
const textColor = '#8e8';
const backgroundColor = '#000';
const fontName = "'Press Start 2P'";
const fontSizeRatio = 2;
const textWidth = canvasWidth / width;
const textHeight = canvasHeight / height;
let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
let cursorPos = new Vector();
let ticks = 0;
let isSaved = false;
let savedTexts: string[][];
let savedPos = new Vector();
let savedSize = new Vector();

export function init() {
  canvas = <HTMLCanvasElement>document.getElementById('mainCanvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  context = canvas.getContext('2d');
  texts = _.times(width, () => _.times(height, () => null));
  reversed = _.times(width, () => _.times(height, () => false));
  savedTexts = _.times(width, () => _.times(height, () => null));
  context.font = `${Math.floor(textHeight / 2) * fontSizeRatio}px ${fontName}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const isSupportingTouchEvent = 'ontouchstart' in document.documentElement;
  if (!isSupportingTouchEvent) {
    document.onmousemove = (e) => {
      onMouseTouchMove(e.pageX, e.pageY);
    };
    document.onmousedown = (e) => {
      onMouseTouchMove(e.pageX, e.pageY);
      onMouseTouchDown(e);
    };
    document.onmouseup = (e) => {
      onMouseTouchUp(e);
    };
  }
  document.ontouchmove = (e) => {
    e.preventDefault();
    onMouseTouchMove(e.touches[0].pageX, e.touches[0].pageY);
  }
  document.ontouchstart = (e) => {
    onMouseTouchMove(e.touches[0].pageX, e.touches[0].pageY);
    onMouseTouchDown(e);
  }
  document.ontouchend = (e) => {
    onMouseTouchUp(e);
  }
  const cursorMvs = [[-1, 0], [0, -1], [1, 0], [0, 1]];
  document.onkeypress = (e) => {
    setChar(String.fromCharCode(e.charCode), cursorPos.x, cursorPos.y);
    const isOnBoard = isSaved && cursorPos.isIn(savedPos, savedSize);
    if (!isOnBoard) {
      onOutBoardClick();
    }
  }
  document.onkeydown = (e) => {
    if (e.keyCode >= 37 && e.keyCode <= 40) {
      e.preventDefault();
      const mv = cursorMvs[e.keyCode - 37];
      cursorPos.x = math.wrap(cursorPos.x + mv[0], 0, width);
      cursorPos.y = math.wrap(cursorPos.y + mv[1], 0, height);
      const isOnBoard = isSaved && cursorPos.isIn(savedPos, savedSize);
      onCursorMove(cursorPos, isOnBoard);
    } else if (e.keyCode === 8) {
      e.preventDefault();
      cursorPos.x = math.wrap(cursorPos.x - 1, 0, width);
      const cmv = setChar(' ', cursorPos.x, cursorPos.y) ? -1 : 1;
      cursorPos.x = math.wrap(cursorPos.x + cmv, 0, width);
    } else {
      onKeyDown();
      const isOnBoard = isSaved && cursorPos.isIn(savedPos, savedSize);
      if (!isOnBoard) {
        onOutBoardClick();
      }
    }
  };
  document.onkeyup = (e) => {
    if (!(e.keyCode >= 37 && e.keyCode <= 40)) {
      onKeyUp();
    }
  };
}

function onMouseTouchMove(x, y) {
  const nx = Math.floor
    ((x - canvas.offsetLeft) * canvasWidth / canvas.offsetWidth / textWidth);
  const ny = Math.floor
    ((y - canvas.offsetTop) * canvasHeight / canvas.offsetHeight / textHeight);
  if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
    (cursorPos.x !== nx || cursorPos.y !== ny)) {
    cursorPos.x = nx;
    cursorPos.y = ny;
    const isOnBoard = isSaved && cursorPos.isIn(savedPos, savedSize);
    onCursorMove(cursorPos, isOnBoard);
  }
}

function onMouseTouchDown(e) {
  onKeyDown();
  const isOnBoard = isSaved && cursorPos.isIn(savedPos, savedSize);
  if (!isOnBoard) {
    onOutBoardClick();
  }
}

function onMouseTouchUp(e) {
  onKeyUp();
}

export function update() {
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = textColor;
  _.times(width, x => _.times(height, y => drawChar(x, y)));
}

export function print(str: string, x: number, y: number) {
  _.forEach(str, (s, i) => {
    if (math.isIn(x, 0, width - 1) && math.isIn(y, 0, height - 1)) {
      texts[x + i][y] = s;
    }
  });
}

export function printVertical(str: string, x: number, y: number) {
  _.forEach(str, (s, i) => {
    if (math.isIn(x, 0, width - 1) && math.isIn(y, 0, height - 1)) {
      texts[x][y + i] = s;
    }
  });
}

export function printClear(len: number, x: number, y: number) {
  _.times(len, i => {
    if (math.isIn(x, 0, width - 1) && math.isIn(y, 0, height - 1)) {
      texts[x + i][y] = null;
    }
  });
}

export function printClearVertical(len: number, x: number, y: number) {
  _.times(len, i => {
    if (math.isIn(x, 0, width - 1) && math.isIn(y, 0, height - 1)) {
      texts[x][y + i] = null;
    }
  });
}

export function cls() {
  _.times(width, x => _.times(height, y => {
    texts[x][y] = null;
    reversed[x][y] = false;
  }));
}

function setChar(c: string, x: number, y: number) {
  if (isSaved && cursorPos.isIn(savedPos, savedSize)) {
    return false;
  }
  if (math.isIn(x, 0, width - 1) && math.isIn(y, 0, height - 1)) {
    if (beforeCharSet(c, x, y)) {
      texts[x][y] = c;
      onCharSet(c, x, y);
      cursorPos.x = math.wrap(cursorPos.x + 1, 0, width);
      return true;
    }
  }
  return false;
}

function drawChar(x, y) {
  const c = texts[x][y];
  let isOnCursor = (x === cursorPos.x && y === cursorPos.y);
  if ((isOnCursor && beforeCharSet(-1, x, y) &&
    !(isSaved && cursorPos.isIn(savedPos, savedSize))) ||
    reversed[x][y]) {
    context.fillRect(x * textWidth, y * textHeight, textWidth, textHeight);
    context.fillStyle = backgroundColor;
    fillChar(c, x, y);
    context.fillStyle = textColor;
    return;
  }
  if (isOnCursor) {
    context.fillRect(x * textWidth, y * textHeight + textHeight - 2, textWidth, 2);
    fillChar(c, x, y);
    return;
  }
  fillChar(c, x, y);
}

function fillChar(c, x, y) {
  if (c != null && c !== ' ') {
    context.fillText(c, (x + 0.5) * textWidth, (y + 0.5) * textHeight);
  }
}

export function saveAreaTexts(x: number, y: number, width: number, height: number) {
  savedPos.set(x, y);
  savedSize.set(width, height);
  for (let x = savedPos.x; x < savedPos.x + savedSize.x; x++) {
    for (let y = savedPos.y; y < savedPos.y + savedSize.y; y++) {
      savedTexts[x][y] = texts[x][y];
    }
  }
  isSaved = true;
}

export function loadAreaTexts() {
  if (!isSaved) {
    return;
  }
  for (let x = savedPos.x; x < savedPos.x + savedSize.x; x++) {
    for (let y = savedPos.y; y < savedPos.y + savedSize.y; y++) {
      texts[x][y] = savedTexts[x][y];
    }
  }
  isSaved = false;
}
