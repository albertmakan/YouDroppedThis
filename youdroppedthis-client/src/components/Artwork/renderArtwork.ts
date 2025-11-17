import type { Particle } from '@/utils/physics'

export function renderArtwork(
  pixels: Readonly<Readonly<string[]>[]>,
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  offsetX: number = 0,
  offsetY: number = 0,
  pixelSize: number = 1,
) {
  let filledCount = 0
  for (let pixelY = 0; pixelY < pixels.length; pixelY++) {
    const y = offsetY + pixelY * pixelSize
    for (let pixelX = 0; pixelX < pixels[pixelY].length; pixelX++) {
      const x = Math.floor(offsetX + pixelX * pixelSize)
      const fill = pixels[pixelY][pixelX]
      if (fill) {
        context.fillStyle = fill
        context.fillRect(x, y, pixelSize, pixelSize)
        filledCount += 1
      }
    }
  }
  return filledCount
}

export function renderParticles(
  particles: Readonly<Particle[]>,
  context: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  pixelSize: number,
) {
  for (const particle of particles) {
    if (particle.life > 0) {
      context.globalAlpha = particle.life
      context.fillStyle = particle.color
      const particleSize = pixelSize * particle.size
      context.fillRect(
        offsetX + particle.x * pixelSize,
        offsetY + particle.y * pixelSize,
        particleSize,
        particleSize,
      )
    }
  }
  context.globalAlpha = 1.0
}
