import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { solvePostfix, tokenize, tokensToPostfix } from '@/utils/parser'

const emptyPixel = ''

export const useEditorStore = defineStore('editor', () => {
  const isOpen = ref(false)
  const location = ref<{ x: number; y: number } | null>(null)
  const isPlacing = ref(false)
  const selectedColor = ref('#ffffff')
  const pixels = ref(Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => emptyPixel)))
  const offscreenCanvas = new OffscreenCanvas(64, 64)
  const tool = ref<'pen' | 'eraser' | 'fill' | 'code' | null>('pen')
  const expression = ref('')

  const history = ref<{ pixels: string[][] }[]>([{ pixels: pixels.value.map((row) => [...row]) }])
  const historyStep = ref(0)
  const canUndo = computed(() => historyStep.value > 0)
  const canRedo = computed(() => historyStep.value < history.value.length - 1)

  const context = ref({
    x: 0,
    y: 0,
    pixel: (x: number, y: number) => pixels.value[y]?.[x] ?? emptyPixel,
    palette: ['#ffffff'],
  })

  const resolution = computed({
    get: () => pixels.value.length,
    set: (newResolution) => {
      const newPixels = Array.from({ length: newResolution }, () =>
        Array.from({ length: newResolution }, () => emptyPixel),
      )
      const r = newResolution / resolution.value
      for (let y = 0; y < newResolution; y++) {
        for (let x = 0; x < newResolution; x++) {
          newPixels[y][x] = pixels.value[Math.floor(y / r)][Math.floor(x / r)]
        }
      }
      pixels.value = newPixels
    },
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
  }

  function undo() {
    if (canUndo.value) {
      historyStep.value--
      pixels.value = history.value[historyStep.value].pixels.map((row) => [...row])
    }
  }

  function redo() {
    if (canRedo.value) {
      historyStep.value++
      pixels.value = history.value[historyStep.value].pixels.map((row) => [...row])
    }
  }

  function setPixel(x: number, y: number) {
    const color = tool.value === 'eraser' ? emptyPixel : selectedColor.value
    if (
      y < 0 ||
      y >= resolution.value ||
      x < 0 ||
      x >= resolution.value ||
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
        if (x < 0 || x >= resolution.value || y < 0 || y >= resolution.value) continue
        if (newPixels[y][x] !== originalColor || newPixels[y][x] === color) continue
        newPixels[y][x] = color
        stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 })
      }
      pixels.value = newPixels
    }
    return true
  }

  function setPalette(palette: string[]) {
    context.value.palette = palette
  }

  function clearCanvas() {
    pixels.value = Array.from({ length: resolution.value }, () =>
      Array.from({ length: resolution.value }, () => emptyPixel),
    )
  }

  function applyFunction() {
    const { tokens, errorFound } = tokenize(expression.value)
    if (errorFound) return
    const postfix = tokensToPostfix(tokens)
    const variables = { ...context.value }
    const newPixels = pixels.value.map((r) => [...r])
    for (let y = 0; y < resolution.value; y++) {
      for (let x = 0; x < resolution.value; x++) {
        variables.x = x
        variables.y = y
        const color = solvePostfix(postfix, variables)
        newPixels[y][x] =
          typeof color === 'string' && color.match(/^(#[0-9A-Fa-f]{6}|)$/) ? color : emptyPixel
      }
    }
    pixels.value = newPixels
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

  return {
    isOpen,
    location,
    isPlacing,
    resolution,
    selectedColor,
    pixels,
    tool,
    expression,
    context: readonly(context),
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
    setPalette,
  }
})
