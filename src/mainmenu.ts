import * as _ from 'lodash';
import * as con from './console';
import * as aut from './automaton';
import Button from './button';
import * as board from './board';
import * as tutorial from './tutorial';
import quizzes from './quizzes';
import config from './config';
import * as math from './util/math';

const titleString1 = `
   OO   OO /O /O  OO   OO
 /O  O/O  O OO O/O / /O  O  
  O    O  O OO O/ OO  O  O
  O  O O  O O OO /  O O  O
 / OO / OO  O/ O  OO / OO
  / /  / / /  /  / /  / /
`;
const titleString2 = `
/O  O  OO /OOO  OO /O /O
 OOOO/O  O /O /O  O OO O
 O  O OOOO  O  O  O OO O
 O  O O  O  O  O  O O OO
 O  O O  O  O / OO  O/ O
/  / /  /  /   / / /  /
`;

export let isStarting = false;
let quizNumber = 0;

export function init() {
  loadStorage();
  quizNumber = storage.clearedQuizNumber;
}

export function start() {
  isStarting = true;
  board.remove();
  con.cls();
  Button.init();
  _.forEach(titleString1.split('\n'), (l, i) => {
    con.print(l, 4, 2 + i);
  });
  _.forEach(titleString2.split('\n'), (l, i) => {
    con.print(l, 8, 9 + i);
  });
  con.beforeCharSet = () => false;
  con.onCharSet = () => false;
  const clearedQuizNumber = storage.clearedQuizNumber;
  new Button('NEW GAME', 14, 28, () => {
    isStarting = false;
    aut.initQuiz(0);
    tutorial.start(tutorial.Mode.quiz1);
  });
  const quizButton = new Button(`QUIZ${createQuizNumberStr(quizNumber)}`, 15, 21, () => {
    isStarting = false;
    aut.initQuiz(quizNumber);
  });
  new Button('>>', 25, 21, () => {
    quizNumber = math.wrap(quizNumber + 1, 0, clearedQuizNumber + 1);
    quizButton.setText(`QUIZ${createQuizNumberStr(quizNumber)}`);
  })
  new Button('<<', 9, 21, () => {
    quizNumber = math.wrap(quizNumber - 1, 0, clearedQuizNumber + 1);
    quizButton.setText(`QUIZ${createQuizNumberStr(quizNumber)}`);
  })
  new Button('PLAYGROUND', 13, 24, () => {
    isStarting = false;
    aut.init();
    aut.initMode(aut.Mode.playground);
  });
  if (storage.isShowingTutorial[tutorial.Mode.mainmenu]) {
    tutorial.start(tutorial.Mode.mainmenu);
    storage.isShowingTutorial[tutorial.Mode.mainmenu] = false;
    saveStorage();
  }
}

export function storeQuizSolved() {
  let qn = quizNumber + 1;
  if (qn > storage.clearedQuizNumber) {
    storage.clearedQuizNumber = qn;
    saveStorage();
  }
}

export function goToNextQuiz() {
  quizNumber++;
  aut.initQuiz(quizNumber);
}

export function createQuizNumberStr(num: number) {
  const str = "00" + (num + 1);
  return str.substr(str.length - 2);
}

export let storage = {
  isShowingTutorial: _.times(6, () => true),
  clearedQuizNumber: 0
};

function loadStorage() {
  const item = localStorage.getItem(config.storageKey);
  if (item != null) {
    storage = JSON.parse(item);
  }
}

export function saveStorage() {
  localStorage.setItem(config.storageKey, JSON.stringify(storage));
}
