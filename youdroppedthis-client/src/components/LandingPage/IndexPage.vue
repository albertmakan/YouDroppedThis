<template>
  <div class="max-w-6xl mx-auto px-6">
    <!-- Hero Section -->
    <header class="text-center py-24 md:py-32">
      <h1
        class="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary from-40% bg-clip-text text-transparent"
      >
        YouDroppedThis
      </h1>
      <p class="text-2xl md:text-3xl text-neutral-300 mb-4 font-light">
        A shared canvas for moments, not monuments.
      </p>
      <p class="text-lg text-neutral-500 mb-12 max-w-2xl mx-auto">
        Pixel art appears, lives for a while, and quietly fades.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <router-link
          to="/now"
          class="inline-block bg-gradient-to-r from-primary to-primary/80 hover:from-primary/80 hover:to-primary/60 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/50"
        >
          Enter a moment
        </router-link>
        <a href="#how-it-works" class="text-neutral-400 hover:text-neutral-300 transition-colors">
          Learn how it works
        </a>
      </div>
    </header>

    <!-- Demo Canvas -->
    <section class="mb-24">
      <div class="border border-neutral-600 rounded-2xl max-w-lg mx-auto">
        <canvas
          ref="canvasRef"
          class="w-full aspect-square rounded-lg opacity-30"
          style="image-rendering: pixelated"
          width="64"
          height="64"
          @click="handleCanvasClick"
        />
      </div>
    </section>

    <!-- What Happens Here -->
    <section class="mb-32">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-16">What happens on a canvas</h2>

      <div class="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
        <div class="text-center">
          <div class="size-10 mb-4 text-neutral-400 mx-auto"><draw-icon /></div>
          <h3 class="text-xl font-semibold mb-3">You drop something</h3>
          <p class="text-neutral-400 leading-relaxed">
            Place a small piece of pixel art on a shared grid. Everyone works within the same
            limits.
          </p>
        </div>

        <div class="text-center">
          <div class="size-10 mb-4 text-neutral-400 mx-auto"><users-icon /></div>
          <h3 class="text-xl font-semibold mb-3">Others respond</h3>
          <p class="text-neutral-400 leading-relaxed">
            The canvas updates live as people add, explore, and notice each other's work.
          </p>
        </div>

        <div class="text-center">
          <div class="size-10 mb-4 text-neutral-400 mx-auto"><timer-icon /></div>
          <h3 class="text-xl font-semibold mb-3">Time takes it away</h3>
          <p class="text-neutral-400 leading-relaxed">
            Every piece fades after a while. Nothing stays forever — and that's the point.
          </p>
        </div>
      </div>
    </section>

    <!-- Ephemerality & Collection -->
    <section class="mb-32">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-16">
        Nothing lasts. Some things are kept.
      </h2>

      <div class="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
        <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
          <h3 class="text-xl font-semibold mb-4">Art fades</h3>
          <p class="text-neutral-400 leading-relaxed">
            Each canvas is a moment in time. Pieces disappear quietly, making room for what comes
            next.
          </p>
        </div>

        <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
          <h3 class="text-xl font-semibold mb-4">Collection is rare</h3>
          <p class="text-neutral-400 leading-relaxed">
            If something stays with you, you can collect it — once. Someone else has to let it go.
          </p>
        </div>
      </div>
    </section>

    <!-- Constraints as a Feature -->
    <section class="mb-32">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-16">Limits create meaning</h2>

      <div class="max-w-3xl mx-auto space-y-8">
        <div class="flex gap-6 items-start">
          <div
            class="size-8 rounded-lg bg-gradient-to-br from-primary to-secondary p-1.5 text-white shrink-0"
          >
            <palette-icon />
          </div>
          <div>
            <h3 class="text-xl font-semibold mb-2">Shared palettes</h3>
            <p class="text-neutral-400 leading-relaxed">
              Everyone uses the same colors. The mood is set together.
            </p>
          </div>
        </div>

        <div class="flex gap-6 items-start">
          <div
            class="size-8 rounded-lg bg-gradient-to-br from-primary to-secondary p-1.5 text-white shrink-0"
          >
            <coins-icon />
          </div>
          <div>
            <h3 class="text-xl font-semibold mb-2">Placement has a cost</h3>
            <p class="text-neutral-400 leading-relaxed">
              You can't drop endlessly. Each piece asks for intention.
            </p>
          </div>
        </div>

        <div class="flex gap-6 items-start">
          <div
            class="size-8 rounded-lg bg-gradient-to-br from-primary to-secondary p-1.5 text-white shrink-0"
          >
            <grid-icon />
          </div>
          <div>
            <h3 class="text-xl font-semibold mb-2">The canvas has edges</h3>
            <p class="text-neutral-400 leading-relaxed">
              Space is finite. What you place changes the whole.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Canvases as Moments -->
    <section class="mb-32">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-8">Each canvas is its own moment</h2>

      <div class="max-w-2xl mx-auto text-center">
        <p class="text-lg text-neutral-400 leading-relaxed mb-4">
          Canvases have their own size, palette, and pace. Some are quiet and focused. Others are
          loose and playful. When one fills and fades, it's gone — and a new one begins.
        </p>
        <p class="text-neutral-500">You can host one too.</p>
      </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="mb-32">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-16">How it works</h2>

      <div class="max-w-3xl mx-auto">
        <div class="relative">
          <div
            class="absolute left-3 top-3 bottom-3 w-0.5 bg-gradient-to-b from-primary to-secondary hidden md:block"
          ></div>

          <div class="space-y-12">
            <div class="flex gap-6 items-start relative">
              <div
                class="size-6 rounded-full bg-gradient-to-r from-primary to-secondary shrink-0"
              ></div>
              <div class="">
                <h3 class="text-xl font-semibold mb-2">Look around</h3>
                <p class="text-neutral-400 leading-relaxed">
                  Zoom and explore. See what others have left behind.
                </p>
              </div>
            </div>

            <div class="flex gap-6 items-start relative">
              <div
                class="size-6 rounded-full bg-gradient-to-r from-primary to-secondary shrink-0"
              ></div>
              <div class="">
                <h3 class="text-xl font-semibold mb-2">Draw</h3>
                <p class="text-neutral-400 leading-relaxed">
                  Double-click an empty spot to open the editor. Work within the canvas palette.
                </p>
              </div>
            </div>

            <div class="flex gap-6 items-start relative">
              <div
                class="size-6 rounded-full bg-gradient-to-r from-primary to-secondary shrink-0"
              ></div>
              <div class="">
                <h3 class="text-xl font-semibold mb-2">Drop</h3>
                <p class="text-neutral-400 leading-relaxed">
                  Place your piece on the grid. It will live here for a while.
                </p>
              </div>
            </div>

            <div class="flex gap-6 items-start relative">
              <div
                class="size-6 rounded-full bg-gradient-to-r from-primary to-secondary shrink-0"
              ></div>
              <div class="">
                <h3 class="text-xl font-semibold mb-2">Let go</h3>
                <p class="text-neutral-400 leading-relaxed">
                  Either time takes it — or someone keeps it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="text-center py-24 mb-16">
      <h2 class="text-3xl md:text-4xl font-bold mb-4">Ready to be part of a moment?</h2>
      <p class="text-lg text-neutral-400 mb-8">Drop something small. See what happens.</p>
      <router-link
        to="/now"
        class="inline-block bg-gradient-to-r from-primary to-primary/80 hover:from-primary/80 hover:to-primary/60 text-white px-12 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/50"
      >
        Enter a moment
      </router-link>
    </section>
  </div>

  <!-- Footer -->
  <footer class="border-t border-neutral-800 py-12 text-center text-neutral-500 text-sm">
    <p class="mb-2">Built with curiosity and care for small moments.</p>
  </footer>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import DrawIcon from '@/assets/icons/draw.svg'
import TimerIcon from '@/assets/icons/timer.svg'
import GridIcon from '@/assets/icons/grid.svg'
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
