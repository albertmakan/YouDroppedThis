export function rgbToHSL(r: number, g: number, b: number) {
  const normalizedR = r / 255;
  const normalizedG = g / 255;
  const normalizedB = b / 255;

  const max = Math.max(normalizedR, normalizedG, normalizedB);
  const min = Math.min(normalizedR, normalizedG, normalizedB);

  const lightness = (max + min) / 2;

  if (min === max) {
    return [0, 0, Math.round(lightness * 100)];
  }

  const saturation = (max - min) / (1 - Math.abs(2 * lightness - 1));

  let hue = 0;
  if (max === normalizedR) {
    hue = ((normalizedG - normalizedB) / (max - min)) % 6;
  } else if (max === normalizedG) {
    hue = (normalizedB - normalizedR) / (max - min) + 2;
  } else {
    hue = (normalizedR - normalizedG) / (max - min) + 4;
  }
  hue *= 60;
  if (hue < 0) hue += 360;

  return [
    Math.round(hue),
    Math.round(saturation * 100),
    Math.round(lightness * 100),
  ];
}
