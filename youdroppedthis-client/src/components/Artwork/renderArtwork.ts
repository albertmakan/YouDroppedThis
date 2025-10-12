import type { Particle } from '@/utils/physics'

export function renderArtwork(
  pixels: Readonly<Readonly<string[]>[]>,
  context: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  width: number,
  height: number,
  pixelSize: number,
) {
  const heightRemaining = height % 1
  height = Math.floor(height)
  for (let pixelY = 0; pixelY < height; pixelY++) {
    const y = offsetY + pixelY * pixelSize
    for (let pixelX = 0; pixelX < width; pixelX++) {
      const x = offsetX + pixelX * pixelSize
      const w = pixelSize + (pixels[pixelY][pixelX + 1] ? 1 : 0)
      const h = pixelSize + (pixels[pixelY + 1]?.[pixelX] ? 1 : 0)
      context!.fillStyle = pixels[pixelY][pixelX] || 'transparent'
      context!.fillRect(x, y, w, h)
    }
  }
  if (heightRemaining) {
    const y = offsetY + height * pixelSize
    const h = pixelSize * heightRemaining
    for (let pixelX = 0; pixelX < width; pixelX++) {
      const x = offsetX + pixelX * pixelSize
      const w = pixelSize + (pixels[height][pixelX + 1] ? 1 : 0)
      context!.fillStyle = pixels[height][pixelX] || 'transparent'
      context!.fillRect(x, y, w, h)
    }
  }
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
