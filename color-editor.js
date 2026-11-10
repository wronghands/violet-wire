/** Browser-independent HSV -> hex conversion for the inline color editor. */
export function hsvToRgbHex(hue, saturation, value) {
  if (![hue, saturation, value].every(Number.isFinite) ||
      hue < 0 || hue > 359 || saturation < 0 || saturation > 1000 ||
      value < 0 || value > 1000) {
    throw new RangeError('Expected hue 0–359, saturation and value 0–1000');
  }
  const s = saturation / 1000;
  const v = value / 1000;
  const c = s * v;
  const h = hue / 60;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = v - c;
  let rgb;
  if (h < 1) rgb = [c, x, 0];
  else if (h < 2) rgb = [x, c, 0];
  else if (h < 3) rgb = [0, c, x];
  else if (h < 4) rgb = [0, x, c];
  else if (h < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return '#' + rgb.map(channel =>
    Math.round((channel + m) * 255).toString(16).padStart(2, '0')
  ).join('').toUpperCase();
}
