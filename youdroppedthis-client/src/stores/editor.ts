import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { solvePostfix, tokenize, tokensToPostfix } from '@/utils/parser'
import f from '@/utils/builtInFunctions'
import { renderArtwork } from '@/components/Artwork/renderArtwork'

const emptyPixel = ''

export const useEditorStore = defineStore('editor', () => {
  const selectedColor = ref('#ffffff')
  const pixels = ref([[emptyPixel]])
  const offscreenCanvas = new OffscreenCanvas(64, 64)
  const palette = ref(['#ffffff'])
  const id = ref(0)
  const tool = ref<'pen' | 'eraser' | 'fill' | 'code' | null>('pen')
  const expression = ref('')
  const isFilledEnough = ref(false)

  const history = ref([{ pixels: [[emptyPixel]] }])
  const historyStep = ref(0)
  const canUndo = computed(() => historyStep.value > 0)
  const canRedo = computed(() => historyStep.value < history.value.length - 1)

  const drafts = new Map<number, { pixels: string[][] }>()

  const context = ref({
    x: 0,
    y: 0,
    pixel: (x: number, y: number) => pixels.value[y]?.[x] ?? emptyPixel,
    palette: (i: number) => palette.value[f.mod(Math.round(i), palette.value.length)],
  })

  function saveState() {
    // Remove any states after current step (for redo functionality)
    if (history.value.length > historyStep.value)
      history.value = history.value.slice(0, historyStep.value + 1)
    history.value.push({ pixels: pixels.value.map((row) => [...row]) })
    historyStep.value = history.value.length - 1
    // Limit history size
    if (history.value.length > 50) {
      history.value.shift()
      historyStep.value--
    }
    drafts.set(id.value, { pixels: pixels.value })
  }

  function undo() {
    if (canUndo.value) {
      historyStep.value--
      pixels.value = history.value[historyStep.value].pixels.map((row) => [...row])
      drafts.set(id.value, { pixels: pixels.value })
    }
  }

  function redo() {
    if (canRedo.value) {
      historyStep.value++
      pixels.value = history.value[historyStep.value].pixels.map((row) => [...row])
      drafts.set(id.value, { pixels: pixels.value })
    }
  }

  function setPixel(x: number, y: number) {
    const color = tool.value === 'eraser' ? emptyPixel : selectedColor.value
    if (
      y < 0 ||
      y >= pixels.value.length ||
      x < 0 ||
      x >= pixels.value[y].length ||
      pixels.value[y][x] === color
    )
      return false
    if (tool.value === 'pen' || tool.value === 'eraser') {
      pixels.value[y][x] = color
    } else if (tool.value === 'fill') {
      const originalColor = pixels.value[y][x]
      const newPixels = pixels.value.map((r) => [...r])
      const stack = [{ x, y }]
      while (stack.length > 0) {
        const { x, y } = stack.pop()!
        if (y < 0 || y >= newPixels.length || x < 0 || x >= newPixels[y].length) continue
        if (newPixels[y][x] !== originalColor || newPixels[y][x] === color) continue
        newPixels[y][x] = color
        stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 })
      }
      pixels.value = newPixels
    }
    return true
  }

  function clearCanvas() {
    pixels.value = pixels.value.map((r) => r.map(() => emptyPixel))
  }

  function setConfig(config: { canvasId: number; palette: string[]; resolution: number }) {
    if (id.value === config.canvasId) return false
    const { canvasId, palette: newPalette, resolution } = config
    id.value = canvasId
    palette.value = newPalette
    if (!newPalette.includes(selectedColor.value)) selectedColor.value = newPalette[0] || emptyPixel

    if (drafts.has(canvasId)) {
      const { pixels: draftPixels } = drafts.get(canvasId)!
      pixels.value = draftPixels
    } else {
      pixels.value = Array.from({ length: resolution }, () =>
        Array.from({ length: resolution }, () => emptyPixel),
      )
    }
    history.value = [{ pixels: pixels.value.map((row) => [...row]) }]
    historyStep.value = 0
    return true
  }

  function applyFunction() {
    const { tokens, errorFound } = tokenize(expression.value)
    if (errorFound) return false
    const postfix = tokensToPostfix(tokens)
    const variables = { ...context.value }
    const newPixels = pixels.value.map((r) => [...r])
    for (let y = 0; y < newPixels.length; y++) {
      for (let x = 0; x < newPixels[y].length; x++) {
        variables.x = x
        variables.y = y
        const color = solvePostfix(postfix, variables)
        newPixels[y][x] =
          typeof color === 'string' && palette.value.includes(color) ? color : emptyPixel
      }
    }
    pixels.value = newPixels
    return true
  }

  function getPixelData() {
    const usedPalette: string[] = []
    const matrix = pixels.value.map((row) =>
      row.map((color) => {
        const colorIndex = usedPalette.findIndex((c) => c === color)
        if (colorIndex === -1) {
          usedPalette.push(color)
          return usedPalette.length - 1
        }
        return colorIndex
      }),
    )
    return { palette: usedPalette, mat: matrix }
  }

  function renderToOffscreenCanvas() {
    const offscreenCtx = offscreenCanvas.getContext('2d')!
    offscreenCtx.clearRect(0, 0, offscreenCtx.canvas.width, offscreenCtx.canvas.height)
    const resolution = pixels.value.length
    const coloredPixelCount = renderArtwork(pixels.value, offscreenCtx, 0, 0, 64 / resolution)
    isFilledEnough.value = coloredPixelCount >= (resolution * resolution) / 8
  }

  return {
    selectedColor,
    pixels,
    tool,
    expression,
    context: readonly(context),
    isFilledEnough,
    setPixel,
    clearCanvas,
    applyFunction,
    getPixelData,
    saveState,
    canUndo,
    canRedo,
    undo,
    redo,
    offscreenCanvas,
    renderToOffscreenCanvas,
    setConfig,
  }
})
