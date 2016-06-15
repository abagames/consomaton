import * as _ from 'lodash';
import * as con from './console';
import * as aut from './automaton';
import Button from './button';
import Vector from './util/vector';
import * as board from './board';
import * as mainmenu from './mainmenu';

export enum Mode {
  mainmenu, quiz1, playground, setgoal, editrules, testplay
}
let mode: Mode;
let step: number;
let checkFunc: Function;
let nextButton: Button;
let isOutBoardClicked = false;

export function init() {
  con.onOutBoardClick = onOutBoardClick;
}

export function start(_mode: Mode) {
  if (_mode != Mode.quiz1 && !mainmenu.storage.isShowingTutorial[_mode]) {
    return;
  }
  mode = _mode;
  mainmenu.storage.isShowingTutorial[mode] = false;
  mainmenu.saveStorage();
  step = 0;
  next();
}

export function startForEachAutMode(_mode: aut.Mode) {
  if (_mode === aut.Mode.quiz) {
    return;
  }
  start(_mode + 2);
}

export function update() {
  if (checkFunc != null) {
    if (checkFunc()) {
      next();
    }
  }
  isOutBoardClicked = false;
}

function onOutBoardClick() {
  isOutBoardClicked = true;
}

export function stop() {
  if (nextButton != null) {
    nextButton.remove();
    nextButton = null;
  }
  board.remove();
  checkFunc = null;
}

function next() {
  if (step >= stepData[mode].length) {
    stop();
    return;
  }
  checkFunc = null;
  const sd: any[] = stepData[mode][step];
  const msg = sd[0];
  const x = sd[1];
  const y = sd[2];
  const arrowDir = sd.length > 3 ? sd[3] : null;
  const hasNextButton = sd.length > 4 ? sd[4] : true;
  checkFunc = sd.length > 5 ? sd[5] : null;
  const initFunc = sd.length > 6 ? sd[6] : null;
  if (msg != null) {
    board.set(msg, x, y, arrowDir);
  }
  if (initFunc != null) {
    initFunc();
  }
  if (hasNextButton) {
    nextButton = new Button('NEXT',
      Math.floor(board.pos.x + board.size.x / 2 - 2),
      Math.floor(board.pos.y + board.size.y - 2), () => {
        nextButton.remove();
        next();
      }, true, true);
    Button.checkHover();
  }
  step++;
}

const stepData = [
  [
    [`WELCOME TO CONSOMATON

USE A MOUSE OR A CURSOR KEY
TO MOVE THE CURSOR

CLICK A NEW GAME BUTTON TO
START A NEW GAME`, 18, 21, null, false],
  ],
  [
    [`WELCOME TO THE TUTORIAL

CLICK A NEXT BUTTON TO
GO TO A NEXT STEP
`, 18, 16, null, true, null, () => {
        aut.enablePlaying(false);
        aut.enableRuleFrames(false);
      }],
    [`THIS IS
A CONSOLE`, 13, 12, 1],
    [`THIS IS
A RULE`, 8, 9, 0],
    [`BEFORE PATTERN
IN THE CONSOLE IS`, 10, 9, 0],
    [`CHANGED TO
THE AFTER PATTERN`, 17, 9, 0],
    [`PUSH PLAY
TO APPLY
THE RULE`, 7, 7, 1, false, () => aut.isPlaying, () => {
        aut.enablePlaying();
      }],
    [`THE RULE IS
APPLIED REPEATEDLY`, 22, 21, null, true, null, () => {
        aut.enablePlaying(false);
      }],
    [`PUSH STOP
TO RESET
THE
CONSOLE`, 7, 8, 1, false, () => !aut.isPlaying, () => {
        aut.enablePlaying();
      }],
    [`THIS IS
A GOAL STATE
OF THE CONSOLE`, 12, 23, 1, true, null, () => {
        aut.enablePlaying(false);
        aut.enableRuleFrames(false);
      }],
    [`MODIFY THE RULE
TO OUTPUT
THE GOAL STATE`, 10, 9],
    [`THE AFTER PATTERN
SHOULD BE
 ===
|   |
|  >|
|   |
 ===
USE
[SPACE] AND [>]
KEY TO MODIFY
THE RULE`, 17, 13, 0, false, () => {
        const r = aut.rules[0];
        return r.before[0] === '   ' && r.before[1] === ' > ' && r.before[2] === '   ' &&
          r.after[0] === '   ' && r.after[1] === '  >' && r.after[2] === '   ';
      }, () => {
        aut.enableRuleFrames();
      }],
    [`PUSH PLAY
TO SOLVE
THE QUIZ`, 7, 7, 1, false, () => aut.isPlaying, () => {
        aut.enablePlaying();
        aut.enableRuleFrames(false);
      }],
    [null, null, null, null, false, null, () => {
      aut.enablePlaying(false);
    }]
  ],
  [
    [`THIS IS A PLAYGROUND

YOU CAN WRITE 
YOUR OWN RULES AND
AN INITIAL CONSOLE STATE

PUSH THE MAKE QUIZ BUTTON TO
MAKE A QUIZ BASED ON
THE RULES AND THE CONSOLE
`, 17, 17, null, true, () => isOutBoardClicked]
  ],
  [
    [`SET A GOAL STATE OF
THE CONSOLE

PRESS THE PLAY BUTTON AND
PAUSE AT THE PROPER TIMING

THEN PUSH THE EDIT RULE BUTTON
`, 17, 17, null, true, () => isOutBoardClicked]
  ],
  [
    [`EDIT RULES FOR THE QUIZ

REMOVE SOME CHARACTERS FROM
RULES AND PUSH THE PLAY BUTTON
`, 17, 17, null, true, () => isOutBoardClicked]
  ],
  [
    [`TEST A QUIZ

PUSH THE SAVE BUTTON AND
THE QUIZ IS SAVED AS A URL
`, 17, 17, null, true, () => isOutBoardClicked]
  ]
];
