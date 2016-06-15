import * as con from './console';
import * as aut from './automaton';
import * as mainmenu from './mainmenu';
import * as tutorial from './tutorial';

window.onload = () => {
  con.init();
  aut.init();
  mainmenu.init();
  tutorial.init();
  if (aut.loadFromUrl() === false) {
    mainmenu.start();
  }
  update();
}

let ticks = 0;
function update() {
  requestAnimationFrame(update);
  if (!mainmenu.isStarting && ticks % 10 === 0) {
    aut.update();
  }
  tutorial.update();
  con.update();
  ticks++;
}
