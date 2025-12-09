<template>
  <div class="max-w-6xl mx-auto px-6 py-16">
    <!-- Header -->
    <header class="text-center mb-20">
      <h1
        class="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-teal-500 to-amber-500 from-40% bg-clip-text text-transparent"
      >
        YouDroppedThis
      </h1>
      <p class="text-xl text-neutral-400 mb-10">
        Collaborative pixel art that lives, breathes, and disappears
      </p>
      <router-link
        to="/c/1"
        class="inline-block bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-12 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-teal-500/50"
      >
        Enter the Canvas
      </router-link>
    </header>

    <!-- Demo Canvas -->
    <section class="mb-24">
      <div class="border border-neutral-600 rounded-2xl max-w-lg mx-auto">
        <canvas
          ref="canvasRef"
          class="w-full aspect-square rounded-lg opacity-40"
          style="image-rendering: pixelated"
          width="64"
          height="64"
          @click="handleCanvasClick"
        />
      </div>
    </section>

    <!-- Features -->
    <section class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
      <div
        class="bg-neutral-900 border border-neutral-800 rounded-xl p-8 hover:border-teal-500 transition-all hover:-translate-y-1"
      >
        <div class="size-10 mb-4 text-neutral-400"><draw-icon /></div>
        <h3 class="text-xl font-semibold mb-3">Drop Your Art</h3>
        <p class="text-neutral-400">
          Place pixel art on a shared canvas. Simple grid-based placement means no overlap, just
          pure collaboration.
        </p>
      </div>

      <div
        class="bg-neutral-900 border border-neutral-800 rounded-xl p-8 hover:border-teal-500 transition-all hover:-translate-y-1"
      >
        <div class="size-10 mb-4 text-neutral-400"><timer-icon /></div>
        <h3 class="text-xl font-semibold mb-3">Ephemeral by Design</h3>
        <p class="text-neutral-400">
          Art disappears after 24 hours. Every canvas is a moment in time, never to be repeated
          exactly the same way.
        </p>
      </div>

      <div
        class="bg-neutral-900 border border-neutral-800 rounded-xl p-8 hover:border-teal-500 transition-all hover:-translate-y-1"
      >
        <div class="size-10 mb-4 text-neutral-400"><heart-icon /></div>
        <h3 class="text-xl font-semibold mb-3">Collect & Curate</h3>
        <p class="text-neutral-400">
          Found something you love? Collect artwork after it's been visible for a while. Build your
          personal gallery.
        </p>
      </div>

      <div
        class="bg-neutral-900 border border-neutral-800 rounded-xl p-8 hover:border-teal-500 transition-all hover:-translate-y-1"
      >
        <div class="size-10 mb-4 text-neutral-400"><users-icon /></div>
        <h3 class="text-xl font-semibold mb-3">Real-Time Collaboration</h3>
        <p class="text-neutral-400">
          Watch the canvas evolve live. Zoom, explore, and see what others are creating in the
          moment.
        </p>
      </div>

      <div
        class="bg-neutral-900 border border-neutral-800 rounded-xl p-8 hover:border-teal-500 transition-all hover:-translate-y-1"
      >
        <div class="size-10 mb-4 text-neutral-400"><palette-icon /></div>
        <h3 class="text-xl font-semibold mb-3">Themed Canvases</h3>
        <p class="text-neutral-400">
          Each canvas has its own palette, rules, and creative prompt. Find your vibe or create your
          own.
        </p>
      </div>

      <div
        class="bg-neutral-900 border border-neutral-800 rounded-xl p-8 hover:border-teal-500 transition-all hover:-translate-y-1"
      >
        <div class="size-10 mb-4 text-neutral-400"><coins-icon /></div>
        <h3 class="text-xl font-semibold mb-3">Intentional Creation</h3>
        <p class="text-neutral-400">
          Placement costs coins and has limits. Every piece matters when resources are constrained.
        </p>
      </div>
    </section>

    <!-- How It Works -->
    <section class="text-center mb-24">
      <h2 class="text-4xl font-bold mb-16">How It Works</h2>
      <div class="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
        <div>
          <div
            class="size-10 bg-gradient-to-b from-teal-500 to-amber-500 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4"
          >
            1
          </div>
          <h4 class="text-lg font-semibold mb-3">Explore</h4>
          <p class="text-neutral-400 text-sm">
            Zoom around the canvas, discover what others have created, and find the perfect spot.
          </p>
        </div>

        <div>
          <div
            class="size-10 bg-gradient-to-b from-teal-500 to-amber-500 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4"
          >
            2
          </div>
          <h4 class="text-lg font-semibold mb-3">Create</h4>
          <p class="text-neutral-400 text-sm">
            Double-click an empty space to open the editor. Draw your pixel art with the canvas
            palette.
          </p>
        </div>

        <div>
          <div
            class="size-10 bg-gradient-to-b from-teal-500 to-amber-500 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4"
          >
            3
          </div>
          <h4 class="text-lg font-semibold mb-3">Drop</h4>
          <p class="text-neutral-400 text-sm">
            Place your art on the grid. It'll live for 24 hours alongside everyone else's creations.
          </p>
        </div>

        <div>
          <div
            class="size-10 bg-gradient-to-b from-teal-500 to-amber-500 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4"
          >
            4
          </div>
          <h4 class="text-lg font-semibold mb-3">Collect</h4>
          <p class="text-neutral-400 text-sm">
            See something amazing? Collect it to save in your personal gallery before it disappears.
          </p>
        </div>
      </div>
    </section>

    <!-- Footer CTA -->
    <section class="text-center mb-16">
      <h2 class="text-3xl font-bold mb-4">Ready to drop something?</h2>
      <p class="text-neutral-400 text-lg mb-8">Join the canvas and leave your mark</p>
      <router-link
        to="/c/1"
        class="inline-block bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-12 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-teal-500/50"
      >
        Start Creating
      </router-link>
    </section>
  </div>

  <!-- Footer -->
  <footer class="border-t border-neutral-800 py-8 text-center text-neutral-500 text-sm">
    <p>Built with curiosity by a developer who likes pixels</p>
  </footer>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import DrawIcon from '@/assets/icons/draw.svg'
import TimerIcon from '@/assets/icons/timer.svg'
import HeartIcon from '@/assets/icons/heart.svg'
import UsersIcon from '@/assets/icons/users.svg'
import PaletteIcon from '@/assets/icons/palette.svg'
import CoinsIcon from '@/assets/icons/coins.svg'

// Canvas demo animation
const canvasRef = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)

// Grid configuration
const gridSize = 8
const cellSize = 8
const colors = ['#14b8a6', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#10b981']
const grid = Array.from({ length: gridSize * gridSize }, () => ({
  color: '',
  opacity: 0,
  life: 0,
}))

let animationFrame: number
let interval: number

function render() {
  if (!canvasRef.value || !ctx.value) return
  ctx.value.fillStyle = '#0a0a0a'
  ctx.value.fillRect(0, 0, gridSize * cellSize, gridSize * cellSize)

  grid.forEach((cell, i) => {
    const x = (i % gridSize) * cellSize
    const y = Math.floor(i / gridSize) * cellSize
    // Draw colored cell if exists
    if (cell.life > 0) {
      cell.opacity += (1 - cell.opacity) * 0.1
      cell.life -= 1
      ctx.value!.fillStyle = cell.color
      ctx.value!.globalAlpha = cell.opacity
      ctx.value!.fillRect(x, y, cellSize, cellSize)
      ctx.value!.globalAlpha = 1
    }
  })

  animationFrame = requestAnimationFrame(render)
}

// Randomly add pieces
function addPiece() {
  const emptyIndices = grid.map((cell, i) => (cell.life > 0 ? -1 : i)).filter((i) => i !== -1)
  if (emptyIndices.length > 0) {
    const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)]
    grid[randomIndex].color = colors[Math.floor(Math.random() * colors.length)]
    grid[randomIndex].life = 1050
  }
}

function handleCanvasClick(event: MouseEvent | TouchEvent) {
  const { clientX, clientY } = 'touches' in event ? event.touches[0] : event
  if (!canvasRef.value) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  const x = (clientX - rect.left) / (canvasRef.value.clientWidth / gridSize)
  const y = (clientY - rect.top) / (canvasRef.value.clientHeight / gridSize)
  const i = Math.floor(y) * gridSize + Math.floor(x)
  const cell = grid[i]
  if (cell.life > 0) {
    cell.life = 0
  } else {
    cell.color = colors[Math.floor(Math.random() * colors.length)]
    cell.life = 1050
  }
}

onMounted(() => {
  ctx.value = canvasRef.value!.getContext('2d')
  render()
  // Initially populate some cells
  for (let i = 0; i < 25; i++) {
    setTimeout(addPiece, i * 100)
  }
  // Continue adding pieces
  interval = setInterval(addPiece, 1000)

  onUnmounted(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
    if (interval) {
      clearInterval(interval)
    }
  })
})
</script>
