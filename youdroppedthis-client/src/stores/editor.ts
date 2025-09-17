import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { DEFAULT_PALETTE } from '@/shared/types'

const emptyPixel = ''

export const useEditorStore = defineStore('editor', () => {
  const isOpen = ref(false)
  const selectedColor = ref('#ffffff')
  const pixels = ref(Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => emptyPixel)))
  const tool = ref<'pen' | 'eraser' | 'fill'>('pen')
  const palette = ref(DEFAULT_PALETTE)

  const history = ref<{ pixels: string[][] }[]>([{ pixels: pixels.value.map((row) => [...row]) }])
  const historyStep = ref(0)
  const canUndo = computed(() => historyStep.value > 0)
  const canRedo = computed(() => historyStep.value < history.value.length - 1)

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
  const pixelCount = computed(() => resolution.value * resolution.value)

  function saveState() {
    // Remove any states after current step (for redo functionality)
    // if (history.value.length > historyStep.value)
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
    if (y < 0 || y >= resolution.value || x < 0 || x >= resolution.value) return
    if (tool.value === 'pen') {
      pixels.value[y][x] = selectedColor.value
    } else if (tool.value === 'eraser') {
      pixels.value[y][x] = emptyPixel
    } else if (tool.value === 'fill') {
      const originalColor = pixels.value[y][x]
      if (originalColor === selectedColor.value) return
      const newPixels = pixels.value.map((r) => [...r])
      const stack = [{ x, y }]
      while (stack.length > 0) {
        const { x, y } = stack.pop()!
        if (x < 0 || x >= resolution.value || y < 0 || y >= resolution.value) continue
        if (newPixels[y][x] !== originalColor || newPixels[y][x] === selectedColor.value) continue
        newPixels[y][x] = selectedColor.value
        stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 })
      }
      pixels.value = newPixels
    }
  }

  function getPixel(x: number, y: number) {
    return pixels.value[y][x]
  }

  function clearCanvas() {
    pixels.value = Array.from({ length: resolution.value }, () =>
      Array.from({ length: resolution.value }, () => emptyPixel),
    )
  }

  function openEditor() {
    isOpen.value = true
  }

  function closeEditor(clear?: boolean) {
    isOpen.value = false
    if (clear) clearCanvas()
  }

  function getPixelData() {
    return JSON.stringify(pixels.value)
  }

  function loadPixelData(data: string) {
    try {
      const parsedData = JSON.parse(data)
      if (Array.isArray(parsedData) && parsedData.length === pixelCount.value) {
        pixels.value = parsedData
      }
    } catch (error) {
      console.error('Failed to load pixel data:', error)
    }
  }

  return {
    isOpen: readonly(isOpen),
    resolution,
    selectedColor,
    pixels,
    tool,
    palette,
    setPixel,
    getPixel,
    clearCanvas,
    openEditor,
    closeEditor,
    getPixelData,
    loadPixelData,
    saveState,
    canUndo,
    canRedo,
    undo,
    redo,
  }
})
