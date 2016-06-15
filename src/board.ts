import * as _ from 'lodash';
import * as con from './console';
import * as math from './util/math';
import Vector from './util/vector';

export const pos = new Vector();
export const size = new Vector();
let isShowing = false;

export function set(message: string, x: number, y: number,
  arrowDir: number = null,
  width: number = null, height: number = null) {
  remove();
  isShowing = true;
  const mls = message.split('\n');
  const mw = _.maxBy(mls, l => l.length).length;
  const mh = mls.length;
  if (width == null) {
    width = mw + 4;
  }
  if (height == null) {
    height = mh + 4;
  }
  x -= Math.floor(width / 2);
  y -= Math.floor(height / 2);
  con.saveAreaTexts(x, y, width, height);
  _.times(width, i => {
    con.texts[x + i][y] = '-';
    con.texts[x + i][y + height - 1] = '-';
  });
  _.times(height - 2, i => {
    con.texts[x][y + 1 + i] = 'i';
    con.texts[x + width - 1][y + 1 + i] = 'i';
  });
  _.times(width - 2, ox => _.times(height - 2, oy => {
    con.texts[x + ox + 1][y + oy + 1] = ' ';
  }));
  const arrowPos = [
    [[2, 0, '^'], [2, 1, '^']],
    [[-1, 2, '>'], [-2, 2, '>']],
    [[2, -1, 'v'], [2, -2, 'v']],
    [[0, 2, '<'], [1, 2, '<']]
  ];
  _.forEach(arrowPos[arrowDir], ap => {
    if (arrowDir != null) {
      let ax = <number>ap[0];
      if (ax < 0) {
        ax += width;
      }
      let ay = <number>ap[1];
      if (ay < 0) {
        ay += height;
      }
      con.texts[ax + x][ay + y] = <string>ap[2];
    }
  });
  const mx = Math.floor(x + (width - mw) / 2);
  const my = Math.floor(y + (height - mh) / 2);
  _.forEach(mls, (l, i) => {
    con.print(l, mx, my + i);
  });
  pos.set(x, y);
  size.set(width, height);
}

export function remove() {
  if (!isShowing) {
    return;
  }
  isShowing = false;
  con.loadAreaTexts();
}
