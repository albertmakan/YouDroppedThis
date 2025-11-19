import type { PixelData } from '@/shared/types'
import type { Particle } from '@/utils/physics'
import type { DeepReadonly } from 'vue'

export function createOffscreenCanvas({ palette, mat }: DeepReadonly<PixelData>) {
  const offscreenCanvas = new OffscreenCanvas(mat[0].length, mat.length)
  const offscreenCanvasCtx = offscreenCanvas.getContext('2d')!
  let filledCount = 0
  for (let pixelY = 0; pixelY < mat.length; pixelY++) {
    for (let pixelX = 0; pixelX < mat[pixelY].length; pixelX++) {
      const val = mat[pixelY][pixelX]
      const fill = palette[val]
      if (fill) {
        offscreenCanvasCtx.fillStyle = fill
        offscreenCanvasCtx.fillRect(pixelX, pixelY, 1, 1)
        filledCount += 1
      }
    }
  }
  return offscreenCanvas
}

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
  artworkCanvas: OffscreenCanvas,
  particles: Readonly<Particle[]>,
  context: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  pixelSize: number,
  resolution = 16,
) {
  const { width, height } = artworkCanvas
  const pieceWidth = width / resolution
  const pieceHeight = height / resolution
  for (const particle of particles) {
    if (particle.life > 0) {
      context.globalAlpha = particle.life
      context.drawImage(
        artworkCanvas,
        particle.sx * pieceWidth,
        particle.sy * pieceHeight,
        pieceWidth,
        pieceHeight,
        offsetX + particle.x * pixelSize * pieceWidth,
        offsetY + particle.y * pixelSize * pieceHeight,
        pixelSize * pieceWidth,
        pixelSize * pieceHeight,
      )
    }
  }
  context.globalAlpha = 1.0
}
