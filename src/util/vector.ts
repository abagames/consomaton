export default class Vector {
  x: number;
  y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x: number | Vector, y: number = null) {
    if (x instanceof Vector) {
      this.x = x.x;
      this.y = x.y;
    } else {
      if (y == null) {
        this.x = this.y = x;
      } else {
        this.x = x;
        this.y = y;
      }
    }
  }

  isIn(pos: Vector, size: Vector) {
    return (pos.x <= this.x && this.x < pos.x + size.x &&
      pos.y <= this.y && this.y < pos.y + size.y);
  }
}
