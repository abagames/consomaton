export function clamp(v: number, min: number, max: number) {
  if (v < min) {
    return min;
  } else if (v > max) {
    return max;
  }
  return v;
}

export function wrap(v: number, min: number, max: number) {
  if (max - min <= 1) {
    return min;
  }
  let w = max - min;
  let o = v - min;
  if (o >= 0) {
    return o % w + min;
  } else {
    return w + o % w + min;
  }
}

export function isIn(v: number, min: number, max: number) {
  return v >= min && v <= max;
}
