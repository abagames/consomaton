import * as _ from 'lodash';
import * as con from './console';
import * as math from './util/math';
import Button from './button';
import Vector from './util/vector';
import * as board from './board';
import quizzes from './quizzes';
import * as tutorial from './tutorial';
import * as mainmenu from './mainmenu';
import config from './config';
declare const require: any;
const LZString = require('lz-string');

let cells: string[][];
let nextCells: string[][];
let initCells: string[][];
let goalCells: string[][];
const width = 16;
const height = 16;
const consoleRulesLeft = 1;
const consoleRulesTop = 2;
const consoleCellsLeft = 19;
let consoleCellsTop = 18;
const consoleFixCellsLeft = 19;
let consoleFixCellsTop = 1;
let consoleAttributes: number[][];
const consoleCellAttribute = 100;
const consoleFixCellAttribute = 200;
export let rules: { before: string[], after: string[] }[];
let playgroundRules: { before: string[], after: string[] }[];
let quizRules: { before: string[], after: string[] }[];
let ruleConsolePosition: Vector[];
export let isPlaying = false;
let isPausing = false;
let playButton: Button;
let pauseButton: Button;

export enum Mode {
  playground, setGoal, editRule, testPlay, quiz
}
const modeDesc = [
  'PLAYGROUND',
  'SET A GOAL',
  'EDIT RULES',
  'TEST PLAY',
  'QUIZ'
];
let mode: Mode = Mode.playground;
let quizNumber: number;
let isPlayingEnabled = true;

export function init() {
  cells = _.times(width, () => _.times(height, () => null));
  nextCells = _.times(width, () => _.times(height, () => null));
  initCells = _.times(width, () => _.times(height, () => null));
  goalCells = _.times(width, () => _.times(height, () => null));
  const maxRuleCount = 8;
  rules = _.times(maxRuleCount, () => {
    return {
      before: ['   ', '   ', '   '],
      after: ['   ', '   ', '   ']
    };
  });
  quizRules = [];
  con.cls();
  mode = Mode.playground;
}

export function initMode(_mode: Mode) {
  board.remove();
  saveCurrentState();
  mode = _mode;
  con.cls();
  Button.init();
  isPlaying = isPausing = false;
  enablePlaying();
  consoleAttributes = _.times(con.width, () => _.times(con.height, () => null));
  if (mode === Mode.playground || mode === Mode.setGoal) {
    consoleCellsTop = 18;
    consoleFixCellsTop = 1;
    addCellFrame(consoleCellsLeft, consoleCellsTop, null);
    con.print('INIT', 14, 1);
    if (mode === Mode.playground) {
      addCellFrame(consoleFixCellsLeft, consoleFixCellsTop, consoleFixCellAttribute);
      con.print('CNSL', 14, 18);
    } else {
      addCellFrame(consoleFixCellsLeft, consoleFixCellsTop, null);
      con.print('GOAL', 14, 18);
    }
  } else {
    consoleCellsTop = 1;
    consoleFixCellsTop = 18;
    addCellFrame(consoleCellsLeft, consoleCellsTop, null);
    addCellFrame(consoleFixCellsLeft, consoleFixCellsTop, null);
    con.print('CNSL', 14, 1);
    con.print('GOAL', 14, 18);
  }
  loadCurrentState();
  addRuleFrames();
  con.beforeCharSet = beforeCharSet;
  con.onCharSet = onCharSet;
  const playButtonY = (mode === Mode.playground || mode === Mode.setGoal) ? 23 :
    mode !== Mode.testPlay ? 6 : 8;
  playButton = new Button('I>', 14, playButtonY, () => {
    if (!isPlayingEnabled) {
      return;
    }
    if (isPlaying) {
      stop();
      changeToPlayButton();
    } else {
      play();
      changeToStopButton();
    }
  });
  if (mode !== Mode.testPlay && mode !== Mode.quiz) {
    const pauseButtonY = (mode === Mode.playground || mode === Mode.setGoal) ? 28 : 11;
    pauseButton = new Button('=>', 14, pauseButtonY, () => {
      if (!isPlaying) {
        play();
        changeToStopButton();
      } else if (!isPausing) {
        pause();
        changeToResumeButton();
      } else {
        resume();
        changeToPauseButton();
      }
    });
  } else {
    pauseButton = null;
  }
  if (mode === Mode.playground) {
    _.times(rules.length - 1, i =>
      new Button('|', consoleRulesLeft + 11, i * 4 + consoleRulesTop + 2, () => {
        swapRule(i);
      }, false));
    new Button('MAKE QUIZ', 0, 35, () => {
      initMode(Mode.setGoal);
    });
  } else {
    if (mode !== Mode.quiz) {
      new Button('BACK', 12, 35, () => {
        if (mode === Mode.setGoal) {
          initMode(Mode.playground);
        } else if (mode === Mode.editRule) {
          initMode(Mode.setGoal);
        } else {
          initMode(Mode.editRule);
        }
      });
    }
    if (mode === Mode.setGoal) {
      new Button('EDIT RULE', 0, 35, () => {
        initMode(Mode.editRule);
      });
      enableRuleFrames(false);
    } else if (mode == Mode.editRule) {
      new Button('PLAY', 0, 35, () => {
        initMode(Mode.testPlay);
      });
    }
  }
  con.print('RULE', 0, 0);
  playButton.setDescription('PLAY', 0, -1);
  if (pauseButton != null) {
    pauseButton.setDescription('PLAY', 0, -1);
  }
  new Button('SAVE', 19, 35, () => {
    saveAsUrl();
  });
  new Button('MAIN MENU', 25, 35, () => {
    mainmenu.start();
  });
  let md = modeDesc[mode];
  if (mode === Mode.quiz && quizNumber != null) {
    md += mainmenu.createQuizNumberStr(quizNumber);
  }
  con.print(md, 0, 34);
  tutorial.startForEachAutMode(mode);
  Button.checkHover();
}

export function initQuiz(num) {
  quizNumber = num;
  const dataStr = LZString.decompressFromEncodedURIComponent(quizzes.data[quizNumber]);
  getStateFromDataStr(dataStr);
}

export function enablePlaying(isEnable = true) {
  isPlayingEnabled = isEnable;
}

function changeToStopButton() {
  playButton.setText('[]');
  playButton.setDescription('STOP', 0, -1);
  if (pauseButton != null) {
    changeToPauseButton();
  }
}

function changeToPlayButton() {
  playButton.setText('|>');
  playButton.setDescription('PLAY', 0, -1);
  if (pauseButton != null) {
    pauseButton.setText('|>');
    pauseButton.setDescription(' PLAY', -1, -1);
  }
}

function changeToPauseButton() {
  pauseButton.setText('||');
  pauseButton.setDescription('PAUSE', -1, -1);
}

function changeToResumeButton() {
  pauseButton.setText('=>');
  pauseButton.setDescription('RESUM', -1, -1);
}

function play() {
  if (mode === Mode.playground) {
    saveInitCells();
  }
  if (mode === Mode.testPlay || mode == Mode.quiz) {
    enableRuleFrames(false);
  }
  _.times(width, x => _.times(height, y =>
    cells[x][y] = con.texts[consoleCellsLeft + x][consoleCellsTop + y] = initCells[x][y]
  ));
  if (mode == Mode.playground) {
    addCellFrame(consoleCellsLeft, consoleCellsTop, consoleCellAttribute);
  }
  isPlaying = true;
  isPausing = false;
}

function resume() {
  isPausing = false;
}

function pause() {
  isPausing = true;
}

function stop() {
  if (mode === Mode.testPlay || mode == Mode.quiz) {
    enableRuleFrames(true);
  }
  _.times(width, x => _.times(height, y =>
    cells[x][y] = con.texts[consoleCellsLeft + x][consoleCellsTop + y] = initCells[x][y]
  ));
  addCellFrame(consoleCellsLeft, consoleCellsTop, null);
  isPlaying = false;
  isPausing = false;
}

function swapRule(i: number) {
  const ir = rules[i];
  rules[i] = rules[i + 1];
  rules[i + 1] = ir;
  drawRuleToConsole(i);
  drawRuleToConsole(i + 1);
}

function drawRuleToConsole(i: number) {
  drawRuleStrsToConsole(rules[i].before, consoleRulesLeft, i * 4 + consoleRulesTop);
  drawRuleStrsToConsole(rules[i].after, consoleRulesLeft + 7, i * 4 + consoleRulesTop);
}

function drawRuleStrsToConsole(ruleStrs: string[], x: number, y: number) {
  _.times(3, (i) =>
    con.print(ruleStrs[i], x, y + i));
}

function addCellFrame(cx: number, cy: number, attribute: number) {
  _.times(width, x => {
    con.texts[x + cx][cy - 1] = '=';
    con.texts[x + cx][cy + height] = '=';
  });
  _.times(height, y => {
    con.texts[cx - 1][y + cy] = 'I';
    con.texts[cx + width][y + cy] = 'I';
  });
  _.times(width, x => _.times(height, y => {
    consoleAttributes[x + cx][y + cy] = attribute;
  }));
}

function addRuleFrames() {
  ruleConsolePosition = [];
  _.times(rules.length, i => {
    addRuleFrame(i * 2, 0, i * 4);
    con.print('->', 5, i * 4 + 1 + consoleRulesTop);
    addRuleFrame(i * 2 + 1, 7, i * 4);
    drawRuleToConsole(i);
  });
}

function addRuleFrame(index: number, ox: number, oy: number) {
  const x = consoleRulesLeft - 1 + ox;
  const y = consoleRulesTop - 1 + oy;
  ruleConsolePosition.push(new Vector(x + 1, y + 1));
  con.print('===', x + 1, y);
  _.times(3, i => con.print('|   |', x, y + i + 1));
  con.print('===', x + 1, y + 4);
  enableRuleFrame(index, ox, oy);
}

export function enableRuleFrames(isEnabled = true) {
  _.times(rules.length, i => {
    enableRuleFrame(i * 2, 0, i * 4, isEnabled);
    enableRuleFrame(i * 2 + 1, 7, i * 4, isEnabled);
  });
}

function enableRuleFrame(index: number, ox: number, oy: number, isEnabled = true) {
  const x = consoleRulesLeft - 1 + ox;
  const y = consoleRulesTop - 1 + oy;
  const i = isEnabled ? index : null;
  _.times(3, rx => _.times(3, ry => {
    consoleAttributes[x + rx + 1][y + ry + 1] = i;
  }));
}

// -- update the console

export function update() {
  if (!isPlaying || isPausing) {
    return;
  }
  if ((mode === Mode.testPlay || mode === Mode.quiz) && equalsToGoal()) {
    solveQuiz();
    return;
  }
  clearNextCells();
  _.forEach(rules, r => matchRule(r));
  copyCurrentToNext();
  swapCurrentAndNext();
  drawToConsole();
}

function equalsToGoal() {
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if ((cells[x][y] == null || cells[x][y] === ' ') &&
        (goalCells[x][y] == null || goalCells[x][y] === ' ')) {
        continue;
      }
      if (cells[x][y] !== goalCells[x][y]) {
        return false;
      }
    }
  }
  return true;
}

function solveQuiz() {
  playButton.setDescription('    ', 0, -1);
  playButton.remove();
  tutorial.stop();
  pause();
  if (mode !== Mode.quiz || quizNumber == null) {
    board.set('SOLVED', 18, 17);
    return;
  }
  if (quizNumber >= quizzes.data.length - 1) {
    board.set(`ALL QUIZZES ARE SOLVED!!

NOW MAKE YOUR OWN QUIZ
AT THE PLAYGROUND`, 18, 17);
    return;
  }
  board.set('SOLVED', 18, 17);
  mainmenu.storeQuizSolved();
  new Button('NEXT', 16, 18, () => {
    mainmenu.goToNextQuiz();
  }, true, true);
}

function clearNextCells() {
  _.times(width, x => _.times(height, y => nextCells[x][y] = null));
}

function matchRule(rule) {
  _.times(width, x => {
    _.times(height, y => {
      if (testMatch(x, y, rule)) {
        setAfter(x, y, rule);
      }
    });
  });
}

function testMatch(sx, sy, rule) {
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      const rc = rule.before[y][x];
      if (rc !== ' ' && rc !== getCell(sx + x, sy + y)) {
        return false;
      }
    }
  }
  return true;
}

function setAfter(sx, sy, rule) {
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      const bc = rule.before[y][x];
      const ac = rule.after[y][x];
      if (ac !== ' ') {
        setNextCell(sx + x, sy + y, ac);
      } else if (bc !== ' ') {
        setNextCell(sx + x, sy + y, ' ');
      }
    }
  }
}

function copyCurrentToNext() {
  _.times(width, x => {
    _.times(height, y => {
      if (nextCells[x][y] == null && cells[x][y] != null) {
        nextCells[x][y] = cells[x][y];
      }
    });
  })
}

function swapCurrentAndNext() {
  let tc = cells;
  cells = nextCells;
  nextCells = tc;
}

function drawToConsole() {
  _.times(width, x => _.times(height, y =>
    con.texts[x + consoleCellsLeft][y + consoleCellsTop] = cells[x][y]));
}

function getCell(x, y) {
  return cells[math.wrap(x, 0, width)][math.wrap(y, 0, height)];
}

function setNextCell(x, y, v) {
  nextCells[math.wrap(x, 0, width)][math.wrap(y, 0, height)] = v;
}

// -- key handling

function beforeCharSet(c: string, x: number, y: number) {
  return consoleAttributes[x][y] != null;
}

function onCharSet(c: string, x: number, y: number) {
  const ca = consoleAttributes[x][y];
  if (ca === consoleCellAttribute) {
    cells[x - consoleCellsLeft][y - consoleCellsTop] = c;
  } else if (ca === consoleFixCellAttribute) {
  } else {
    const baStr = (ca % 2) === 0 ? 'before' : 'after';
    const p = ruleConsolePosition[ca];
    const r = rules[Math.floor(ca / 2)][baStr][y - p.y];
    rules[Math.floor(ca / 2)][baStr][y - p.y] = replaceStringAt(r, x - p.x, c);
  }
}

function replaceStringAt(str, index, character) {
  return str.substr(0, index) + character + str.substr(index + character.length);
}

// -- save and load

function saveCurrentState() {
  switch (mode) {
    case Mode.playground:
      saveInitCells();
      playgroundRules = saveRules();
      break;
    case Mode.setGoal:
      saveGoalCells();
      quizRules = saveRules();
      break;
    case Mode.editRule:
      quizRules = saveRules();
      break;
    case Mode.quiz:
      quizRules = saveRules();
      break;
  }
}

function loadCurrentState() {
  switch (mode) {
    case Mode.playground:
      drawInitCells();
      loadRules(playgroundRules);
      break;
    case Mode.setGoal:
      drawInitGoalCellsForEditGoal();
      loadRules(playgroundRules);
      removeEmptyRules();
      break;
    case Mode.editRule:
      drawInitGoalCells();
      loadRules(quizRules);
      break;
    case Mode.testPlay:
    case Mode.quiz:
      drawInitGoalCells();
      loadRules(quizRules);
      break;
  }
}

function saveInitCells() {
  _.times(width, x => _.times(height, y =>
    initCells[x][y] = goalCells[x][y] =
    con.texts[consoleFixCellsLeft + x][consoleFixCellsTop + y]
  ));
}

function saveGoalCells() {
  _.times(width, x => _.times(height, y =>
    goalCells[x][y] = con.texts[consoleCellsLeft + x][consoleCellsTop + y]
  ));
}

function saveRules() {
  return _.map(rules, r => _.cloneDeep(r));
}

function loadRules(savedRules) {
  rules = <any>_.map(savedRules, r => _.cloneDeep(r));
}

function drawInitCells() {
  _.times(width, x => _.times(height, y =>
    con.texts[consoleFixCellsLeft + x][consoleFixCellsTop + y] = initCells[x][y]
  ));
  _.times(width, x => _.times(height, y =>
    con.texts[consoleCellsLeft + x][consoleCellsTop + y] = initCells[x][y]
  ));
}

function drawInitGoalCellsForEditGoal() {
  _.times(width, x => _.times(height, y =>
    con.texts[consoleFixCellsLeft + x][consoleFixCellsTop + y] = initCells[x][y]
  ));
  _.times(width, x => _.times(height, y =>
    con.texts[consoleCellsLeft + x][consoleCellsTop + y] = goalCells[x][y]
  ));
}

function drawInitGoalCells() {
  _.times(width, x => _.times(height, y =>
    con.texts[consoleCellsLeft + x][consoleCellsTop + y] = initCells[x][y]
  ));
  _.times(width, x => _.times(height, y =>
    con.texts[consoleFixCellsLeft + x][consoleFixCellsTop + y] = goalCells[x][y]
  ));
}

function removeEmptyRules() {
  let nri = 0;
  _.times(rules.length, ri => {
    const r = rules[ri];
    if (!isEmplyRule(r.before) || !isEmplyRule(r.after)) {
      rules[ri] = rules[nri];
      rules[nri] = r;
      nri++;
    }
  });
  rules.splice(nri);
}

function isEmplyRule(ruleStrs: string[]) {
  return _.every(ruleStrs, s => s === '   ');
}

function saveAsUrl() {
  const baseUrl = window.location.href.split('?')[0];
  const dataStr = createDataStr();
  const encDataStr = LZString.compressToEncodedURIComponent(dataStr);
  const url = `${baseUrl}?v=${config.savedUrlVersion}&d=${encDataStr}`;
  window.history.replaceState({}, '', url);
}

const modeLetter = ['p', 'g', 'r', 't', 'q'];
function createDataStr() {
  saveCurrentState();
  let dataStr = modeLetter[mode];
  if (mode === Mode.testPlay) {
    dataStr = modeLetter[Mode.quiz];
  }
  _.times(width, x => _.times(height, y => {
    const ic = initCells[x][y] != null ? initCells[x][y] : ' ';
    const gc = goalCells[x][y] != null ? goalCells[x][y] : ' ';
    dataStr += `${ic}${gc}`;
  }));
  if (mode !== Mode.testPlay && mode !== Mode.quiz) {
    dataStr += createRulesDataStr(playgroundRules);
  }
  dataStr += createRulesDataStr(quizRules);
  return dataStr;
}

function createRulesDataStr(rules: any[]) {
  let str = String.fromCharCode('0'.charCodeAt(0) + rules.length);
  _.forEach(rules, r => {
    _.forEach(r.before, s => str += s);
    _.forEach(r.after, s => str += s);
  });
  return str;
}

export function loadFromUrl() {
  const query = window.location.search.substring(1);
  if (query == null) {
    return false;
  }
  let params = query.split('&');
  let _version: string;
  let encDataStr: string;
  _.forEach(params, (param) => {
    const pair = param.split('=');
    if (pair[0] === 'v') {
      _version = pair[1];
    }
    if (pair[0] === 'd') {
      encDataStr = pair[1];
    }
  });
  if (_version !== config.savedUrlVersion || encDataStr == null) {
    return false;
  }
  try {
    const dataStr = LZString.decompressFromEncodedURIComponent(encDataStr);
    getStateFromDataStr(dataStr);
    quizNumber = null;
  } catch (e) {
    console.log(e);
    return false;
  }
}

function getStateFromDataStr(dataStr: string) {
  mode = modeLetter.indexOf(dataStr[0]);
  let dsi = 1;
  _.times(width, x => _.times(height, y => {
    initCells[x][y] = dataStr[dsi++];
    goalCells[x][y] = dataStr[dsi++];
  }));
  if (mode !== Mode.quiz) {
    const pgr = geteRulesFromDataStr(dataStr, dsi);
    playgroundRules = pgr.rules;
    dsi = pgr.index;
  }
  const qr = geteRulesFromDataStr(dataStr, dsi);
  quizRules = qr.rules;
  loadCurrentState();
  initMode(mode);
}

function geteRulesFromDataStr(dataStr: string, dsi: number) {
  const rl = dataStr[dsi++].charCodeAt(0) - '0'.charCodeAt(0);
  const rules = _.times(rl, () => {
    let r = { before: [], after: [] };
    _.times(3, () => {
      r.before.push(dataStr.substr(dsi, 3));
      dsi += 3;
    });
    _.times(3, () => {
      r.after.push(dataStr.substr(dsi, 3))
      dsi += 3;
    });
    return r;
  });
  return { rules: rules, index: dsi };
}
