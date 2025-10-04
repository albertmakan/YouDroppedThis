<template>
  <div class="fixed inset-0 flex items-center z-50 bg-black/50">
    <div class="max-h-screen overflow-y-auto w-full">
      <div
        class="bg-neutral-800 text-neutral-200 rounded-lg shadow-lg flex flex-col gap-4 items-center m-auto my-4 p-4 w-fit"
        @click.stop
      >
        <div class="flex w-full justify-end text-2xl">
          <button @click="closeModal" class="cursor-pointer size-6"><XMarkIcon /></button>
        </div>
        <label>
          Resolution:
          <select
            v-model.number="editorStore.resolution"
            @change="editorStore.saveState"
            class="bg-neutral-700 p-1 rounded-md cursor-pointer hover:bg-neutral-600 mx-2"
          >
            <option value="16">16 x 16</option>
            <option value="32">32 x 32</option>
            <option value="64">64 x 64</option>
          </select>
        </label>
        <div class="flex w-full justify-between">
          <button
            :class="[
              'size-8 p-1 rounded-md cursor-pointer',
              {
                'bg-neutral-700 hover:bg-neutral-600 text-neutral-200': editorStore.tool !== 'pen',
                'bg-neutral-200 text-neutral-700': editorStore.tool === 'pen',
              },
            ]"
            @click="editorStore.tool = 'pen'"
            title="Pen"
          >
            <DrawIcon />
          </button>
          <button
            :class="[
              'size-8 p-1 rounded-md cursor-pointer',
              {
                'bg-neutral-700 hover:bg-neutral-600 text-neutral-200':
                  editorStore.tool !== 'eraser',
                'bg-neutral-200 text-neutral-700': editorStore.tool === 'eraser',
              },
            ]"
            @click="editorStore.tool = 'eraser'"
            title="Eraser"
          >
            <EraseIcon />
          </button>
          <button
            :class="[
              'size-8 p-1 rounded-md cursor-pointer',
              {
                'bg-neutral-700 hover:bg-neutral-600 text-neutral-200': editorStore.tool !== 'fill',
                'bg-neutral-200 text-neutral-700': editorStore.tool === 'fill',
              },
            ]"
            @click="editorStore.tool = 'fill'"
            title="Fill"
          >
            <FillIcon />
          </button>
          <button
            :class="[
              'size-8 p-1 rounded-md cursor-pointer',
              {
                'bg-neutral-700 hover:bg-neutral-600 text-neutral-200': editorStore.tool !== 'code',
                'bg-neutral-200 text-neutral-700': editorStore.tool === 'code',
              },
            ]"
            @click="editorStore.tool = 'code'"
            title="Expression"
          >
            <SparkleIcon />
          </button>
          <button
            @click="clearCanvas"
            class="size-8 bg-neutral-700 p-1 rounded-md cursor-pointer hover:bg-neutral-600"
            title="Clear"
          >
            <XMarkIcon />
          </button>
          <button
            @click="editorStore.undo"
            :disabled="!editorStore.canUndo"
            class="size-8 bg-neutral-700 p-1 rounded-md cursor-pointer hover:bg-neutral-600 disabled:opacity-50"
            title="Undo"
          >
            <UndoIcon />
          </button>
          <button
            @click="editorStore.redo"
            :disabled="!editorStore.canRedo"
            class="size-8 bg-neutral-700 p-1 rounded-md cursor-pointer hover:bg-neutral-600 disabled:opacity-50"
            title="Redo"
          >
            <RedoIcon />
          </button>
          <label class="inline-flex rounded-md">
            <input v-model="showGrid" type="checkbox" class="size-0" />
            <div
              :class="[
                'size-8 p-1 rounded-md cursor-pointer',
                {
                  'bg-neutral-700 hover:bg-neutral-600 text-neutral-200': !showGrid,
                  'bg-neutral-200 text-neutral-700': showGrid,
                },
              ]"
            >
              <GridIcon />
            </div>
          </label>
        </div>
        <canvas
          ref="pixel-canvas"
          :width="320"
          :height="320"
          @mousedown="startDrawing"
          @mousemove="draw"
          @mouseup="stopDrawing"
          @mouseleave="stopDrawing"
          @touchstart.prevent="startDrawing"
          @touchmove.prevent="draw"
          @touchend.prevent="stopDrawing"
          @touchcancel.prevent="stopDrawing"
          @contextmenu.prevent
        />
        <div v-if="editorStore.tool === 'code'" class="w-full">
          <div class="flex justify-between p-1 font-semibold">
            <label for="expression-field">pixel(x,y) :=</label>
            <button
              @click="applyExpression"
              :disabled="!expr"
              class="cursor-pointer bg-neutral-700 hover:bg-neutral-600 py-1 px-2 text-xs rounded-md disabled:opacity-50 inline-flex gap-1"
            >
              <span class="size-4"><CheckmarkIcon /></span>
              Apply
            </button>
          </div>
          <div class="">
            <ExpressionEditor
              id="expression-field"
              :text="expr"
              @change="(newExpr) => (expr = newExpr)"
              :context="editorStore.context"
              placeholder="Type expression"
            />
          </div>
        </div>
        <div v-else class="flex gap-2 flex-wrap w-64">
          <div class="h-6 w-14">
            <input
              v-model="editorStore.selectedColor"
              type="color"
              class="size-full"
              title="Primary Color"
            />
          </div>
          <button
            v-for="color in editorStore.palette"
            :key="color"
            :class="[
              'w-6 h-6 rounded-md cursor-pointer',
              { 'ring-2': editorStore.selectedColor === color },
            ]"
            :style="{ backgroundColor: color }"
            @click="editorStore.selectedColor = color"
          ></button>
        </div>
        <button
          @click="done"
          :disabled="editorStore.tool === 'code'"
          class="text-xl border-current border-2 disabled:opacity-50 text-neutral-200 rounded-md px-2 py-1 hover:bg-neutral-700 cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { ref, onMounted, watch, computed, useTemplateRef } from 'vue'
import DrawIcon from '../Icons/DrawIcon.vue'
import FillIcon from '../Icons/FillIcon.vue'
import EraseIcon from '../Icons/EraseIcon.vue'
import XMarkIcon from '../Icons/XMarkIcon.vue'
import UndoIcon from '../Icons/UndoIcon.vue'
import RedoIcon from '../Icons/RedoIcon.vue'
import GridIcon from '../Icons/GridIcon.vue'
import SparkleIcon from '../Icons/SparkleIcon.vue'
import { useCanvasStore } from '@/stores/canvas'
import ExpressionEditor from '../Editor/ExpressionEditor.vue'
import CheckmarkIcon from '../Icons/CheckmarkIcon.vue'

const pixelCanvas = useTemplateRef<HTMLCanvasElement>('pixel-canvas')

const editorStore = useEditorStore()
const canvasStore = useCanvasStore()

// Emits
const emit = defineEmits<{
  close: []
  success: [pixelData: string, resolution: number]
}>()

function closeModal() {
  emit('close')
}

function done() {
  emit('success', editorStore.getPixelData(), editorStore.resolution)
}

const showGrid = ref(true)
// Drawing state
const isDrawing = ref(false)
const pixelSize = computed(() => 320 / editorStore.resolution)

const expr = ref('')

editorStore.$subscribe((mutation, state) => {
  drawCanvas()
})

onMounted(() => {
  drawCanvas()
})

function drawCanvas() {
  if (!pixelCanvas.value) return

  const ctx = pixelCanvas.value.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, pixelCanvas.value.width, pixelCanvas.value.height)
  // Draw pixels
  for (let y = 0; y < editorStore.resolution; y++) {
    for (let x = 0; x < editorStore.resolution; x++) {
      ctx.fillStyle = editorStore.pixels[y][x] || 'transparent'
      ctx.fillRect(x * pixelSize.value, y * pixelSize.value, pixelSize.value, pixelSize.value)
    }
  }

  // Draw grid
  if (showGrid.value) {
    ctx.strokeStyle = '#cccccc'
    ctx.lineWidth = 1
    // Vertical lines
    for (let x = 0; x <= editorStore.resolution; x++) {
      ctx.beginPath()
      ctx.moveTo(x * pixelSize.value, 0)
      ctx.lineTo(x * pixelSize.value, editorStore.resolution * pixelSize.value)
      ctx.stroke()
    }
    // Horizontal lines
    for (let y = 0; y <= editorStore.resolution; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * pixelSize.value)
      ctx.lineTo(editorStore.resolution * pixelSize.value, y * pixelSize.value)
      ctx.stroke()
    }
  }
}

function getPixelCoordinates(event: MouseEvent | TouchEvent) {
  if (!pixelCanvas.value) return { x: -1, y: -1 }
  const rect = pixelCanvas.value.getBoundingClientRect()
  const { clientX, clientY } = 'touches' in event ? event.touches[0] : event
  const x = Math.floor((clientX - rect.left) / pixelSize.value)
  const y = Math.floor((clientY - rect.top) / pixelSize.value)
  return { x, y }
}

function startDrawing(event: MouseEvent | TouchEvent) {
  isDrawing.value = true
  draw(event)
}

function draw(event: MouseEvent | TouchEvent) {
  if (!isDrawing.value) return
  const { x, y } = getPixelCoordinates(event)
  editorStore.setPixel(x, y)
}

function stopDrawing() {
  if (isDrawing.value) {
    isDrawing.value = false
    editorStore.saveState()
  }
}

function clearCanvas() {
  editorStore.clearCanvas()
  editorStore.saveState()
}

function applyExpression() {
  editorStore.applyFunction(expr.value)
  editorStore.saveState()
}

watch(showGrid, () => {
  drawCanvas()
})
</script>
