export function rgbToHSL(r: number, g: number, b: number) {
  const normalizedR = r / 255
  const normalizedG = g / 255
  const normalizedB = b / 255

  const max = Math.max(normalizedR, normalizedG, normalizedB)
  const min = Math.min(normalizedR, normalizedG, normalizedB)

  const lightness = (max + min) / 2

  if (min === max) {
    return [0, 0, Math.round(lightness * 100)]
  }

  const saturation = (max - min) / (1 - Math.abs(2 * lightness - 1))

  let hue = 0
  if (max === normalizedR) {
    hue = ((normalizedG - normalizedB) / (max - min)) % 6
  } else if (max === normalizedG) {
    hue = (normalizedB - normalizedR) / (max - min) + 2
  } else {
    hue = (normalizedR - normalizedG) / (max - min) + 4
  }
  hue *= 60
  if (hue < 0) hue += 360

  return [Math.round(hue), Math.round(saturation * 100), Math.round(lightness * 100)]
}

function hueToRGB(p: number, q: number, t: number) {
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}

export function hslToRGB(h: number, s: number, l: number) {
  const normalizedH = (h % 360) / 360
  const normalizedS = s / 100
  const normalizedL = l / 100

  let r, g, b

  if (normalizedS === 0) {
    r = g = b = normalizedL
  } else {
    const q =
      normalizedL < 0.5
        ? normalizedL * (1 + normalizedS)
        : normalizedL + normalizedS - normalizedL * normalizedS
    const p = 2 * normalizedL - q

    r = hueToRGB(p, q, normalizedH + 1 / 3)
    g = hueToRGB(p, q, normalizedH)
    b = hueToRGB(p, q, normalizedH - 1 / 3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

const tempCanvasCTX = new OffscreenCanvas(1, 1).getContext('2d', { willReadFrequently: true })!

export function colorToRGBA(color: string) {
  tempCanvasCTX.clearRect(0, 0, 1, 1)
  tempCanvasCTX.fillStyle = color
  tempCanvasCTX.fillRect(0, 0, 1, 1)
  const rgba = Array.from(tempCanvasCTX.getImageData(0, 0, 1, 1).data)
  return rgba
}
