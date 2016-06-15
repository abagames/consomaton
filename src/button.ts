import * as _ from 'lodash';
import * as con from './console';
import * as math from './util/math';
import Vector from './util/vector';

let onConsoleIndex: number[][];
let buttons: Button[];

export default class Button {
  pos = new Vector();
  index: number;

  static init() {
    hoverIndex = null;
    buttons = [];
    onConsoleIndex = _.times(con.width, () => _.times(con.height, () => null));
    con.onCursorMove = onCursorMove;
    con.onKeyDown = onKeyDown;
    con.onKeyUp = onKeyUp;
  }

  static checkHover() {
    onCursorMove(prevCursorPos, false);
  }

  constructor(public text: string, x: number, y: number,
    public onClick: Function, public isHorizontal = true, public isOnBoard = false) {
    this.pos.set(x, y);
    this.index = buttons.length;
    this.draw();
    if (this.isHorizontal) {
      _.times(text.length + 2, i => onConsoleIndex[x + i][y] = this.index);
    } else {
      _.times(text.length + 2, i => onConsoleIndex[x][y + i] = this.index);
    }
    buttons.push(this);
  }

  setText(text: string) {
    this.text = text;
    this.draw();
  }

  setDescription(text: string, ox: number, oy: number) {
    con.print(text, this.pos.x + ox, this.pos.y + oy);
  }

  remove() {
    this.onUnhover();
    hoverIndex = null;
    if (this.isHorizontal) {
      _.times(this.text.length + 2, i =>
        onConsoleIndex[this.pos.x + i][this.pos.y] = null);
    } else {
      _.times(this.text.length + 2, i =>
        onConsoleIndex[this.pos.x][this.pos.y + i] = null);
    }
    if (this.isHorizontal) {
      con.printClear(`<${this.text}>`.length, this.pos.x, this.pos.y);
    } else {
      con.printClearVertical(`^${this.text}v`.length, this.pos.x, this.pos.y);
    }
    buttons[buttons.indexOf(this)] = null;
    Button.checkHover();
  }

  draw() {
    if (this.isHorizontal) {
      con.print(`<${this.text}>`, this.pos.x, this.pos.y);
    } else {
      con.printVertical(`^${this.text}v`, this.pos.x, this.pos.y);
    }
  }

  onHover() {
    con.reversed[this.pos.x][this.pos.y] = true;
    if (this.isHorizontal) {
      con.reversed[this.pos.x + this.text.length + 1][this.pos.y] = true;
    } else {
      con.reversed[this.pos.x][this.pos.y + this.text.length + 1] = true;
    }
  }

  onUnhover() {
    if (this.isHorizontal) {
      _.times(this.text.length + 2, i =>
        con.reversed[this.pos.x + i][this.pos.y] = false);
    } else {
      _.times(this.text.length + 2, i =>
        con.reversed[this.pos.x][this.pos.y + i] = false);
    }
  }

  onPressed() {
    if (this.isHorizontal) {
      _.times(this.text.length, i =>
        con.reversed[this.pos.x + i + 1][this.pos.y] = true);
    } else {
      _.times(this.text.length, i =>
        con.reversed[this.pos.x][this.pos.y + i + 1] = true);
    }
  }

  onReleased() {
    if (this.isHorizontal) {
      _.times(this.text.length, i =>
        con.reversed[this.pos.x + i + 1][this.pos.y] = false);
    } else {
      _.times(this.text.length, i =>
        con.reversed[this.pos.x][this.pos.y + i + 1] = false);
    }
    this.onClick();
  }
}

let hoverIndex: number = null;
let prevCursorPos = new Vector();
function onCursorMove(pos: Vector, isOnBoard: boolean) {
  prevCursorPos.set(pos);
  if (hoverIndex != null) {
    buttons[hoverIndex].onUnhover();
    hoverIndex = null;
  }
  const ci = onConsoleIndex[pos.x][pos.y];
  if (ci != null && (!isOnBoard || buttons[ci].isOnBoard)) {
    buttons[ci].onHover();
    hoverIndex = ci;
  }
}

function onKeyDown() {
  if (hoverIndex != null) {
    buttons[hoverIndex].onPressed();
  }
}

function onKeyUp() {
  if (hoverIndex != null) {
    buttons[hoverIndex].onReleased();
  }
}
