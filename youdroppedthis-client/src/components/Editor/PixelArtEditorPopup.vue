<template>
  <div
    class="w-fit h-fit fixed text-neutral-200 border border-neutral-600 border-dashed pointer-events-none box-border"
    :style="{ left: `${left}px`, top: `${top}px` }"
  >
    <div class="relative min-w-full">
      <div
        class="absolute p-4 bg-black/90 backdrop-blur-xl rounded-lg min-w-full box-content border border-neutral-600 text-center"
        :class="{
          'bottom-0 left-1/2 -translate-x-1/2': editorLayout === 'v',
          'right-full top-0': editorLayout === 'h',
        }"
      >
        <div class="flex justify-between">
          <button
            @click="editorLayout = editorLayout === 'v' ? 'h' : 'v'"
            class="cursor-pointer pointer-events-auto"
          >
            {{ editorLayout === 'h' ? '=' : '- -' }}
          </button>
          <button @click="closeModal" class="cursor-pointer size-6 pointer-events-auto">
            <XMarkIcon />
          </button>
        </div>
        <label>
          Resolution:
          <select
            v-model.number="editorStore.resolution"
            @change="editorStore.saveState"
            class="bg-neutral-900 p-1 rounded-md cursor-pointer hover:bg-neutral-800 mx-2 pointer-events-auto"
          >
            <option value="16">16 x 16</option>
            <option value="32">32 x 32</option>
            <option value="64">64 x 64</option>
          </select>
        </label>
        <div
          class="flex justify-center gap-2 mt-4 *:pointer-events-auto *:size-8 *:p-1 *:rounded-md *:cursor-pointer"
        >
          <button
            v-for="tool in tools"
            :class="{
              'bg-neutral-900 hover:bg-neutral-800 text-neutral-200':
                editorStore.tool !== tool.name,
              'bg-neutral-200 text-neutral-700': editorStore.tool === tool.name,
            }"
            @click="editorStore.tool = editorStore.tool === tool.name ? null : tool.name"
            :title="tool.name"
          >
            <component :is="tool.icon" />
          </button>
          <button @click="clearCanvas" class="bg-neutral-900 hover:bg-neutral-800" title="Clear">
            <XMarkIcon />
          </button>
          <button
            @click="editorStore.undo"
            :disabled="!editorStore.canUndo"
            class="size-8 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50"
            title="Undo"
          >
            <UndoIcon />
          </button>
          <button
            @click="editorStore.redo"
            :disabled="!editorStore.canRedo"
            class="size-8 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50"
            title="Redo"
          >
            <RedoIcon />
          </button>
          <button
            :class="{
              'bg-neutral-900 hover:bg-neutral-800 text-neutral-200': !showGrid,
              'bg-neutral-200 text-neutral-700': showGrid,
            }"
            @click="showGrid = !showGrid"
            title="Grid"
          >
            <GridIcon />
          </button>
        </div>
      </div>
    </div>
    <div v-if="editorStore.tool === 'code'" class="relative w-full">
      <div class="absolute inset-0 backdrop-blur-xl" :style="{ height: `${size}px` }" />
      <div
        class="absolute p-4 inset-0 w-full overflow-y-auto overflow-x-hidden pointer-events-auto"
        :style="{ height: `${size}px` }"
      >
        <ExpressionEditor
          id="expression-field"
          :text="editorStore.expression"
          @change="(newExpr) => (editorStore.expression = newExpr)"
          :context="editorStore.context"
          placeholder="pixel(x,y) :="
        />
        <div class="flex justify-center gap-4 mt-2">
          <button
            @click="editorStore.tool = 'pen'"
            class="cursor-pointer bg-neutral-900 hover:bg-neutral-800 py-1 px-2 text-xs rounded-md inline-flex gap-1"
          >
            <span class="size-4"><XMarkIcon /></span>
            Cancel
          </button>

          <button
            @click="applyExpression"
            class="cursor-pointer bg-neutral-900 hover:bg-neutral-800 py-1 px-2 text-xs rounded-md inline-flex gap-1"
          >
            <span class="size-4"><CheckmarkIcon /></span>
            Apply
          </button>
        </div>
      </div>
    </div>
    <canvas
      ref="pixel-canvas"
      :width="size"
      :height="size"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
      @touchstart.passive="startDrawing"
      @touchmove.prevent="draw"
      @touchend.prevent="stopDrawing"
      @touchcancel.prevent="stopDrawing"
      @contextmenu.prevent
      @wheel.prevent="handleWheel"
      :class="{ 'pointer-events-none': !editorStore.tool, 'pointer-events-auto': editorStore.tool }"
    />
    <div class="relative min-w-full">
      <div
        class="absolute p-4 bg-black/90 backdrop-blur-xl rounded-lg min-w-full box-content border border-neutral-600"
        :class="{
          'top-0 left-1/2 -translate-x-1/2': editorLayout === 'v',
          'left-full bottom-0': editorLayout === 'h',
        }"
      >
        <div class="flex gap-2 flex-wrap min-w-64 m-auto mb-4 *:pointer-events-auto">
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
        <div class="flex justify-center gap-4">
          <button
            @click="done"
            :disabled="editorStore.tool === 'code'"
            class="border-current border disabled:opacity-50 rounded-md px-2 py-1 cursor-pointer pointer-events-auto text-primary uppercase"
          >
            Drop
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { ref, onMounted, watch, computed, useTemplateRef, nextTick } from 'vue'
import DrawIcon from '../Icons/DrawIcon.vue'
import FillIcon from '../Icons/FillIcon.vue'
import EraseIcon from '../Icons/EraseIcon.vue'
import XMarkIcon from '../Icons/XMarkIcon.vue'
import UndoIcon from '../Icons/UndoIcon.vue'
import RedoIcon from '../Icons/RedoIcon.vue'
import GridIcon from '../Icons/GridIcon.vue'
import SparkleIcon from '../Icons/SparkleIcon.vue'
import ExpressionEditor from '../Editor/ExpressionEditor.vue'
import CheckmarkIcon from '../Icons/CheckmarkIcon.vue'
import { renderArtwork } from '../Artwork/renderArtwork'
import { GRID_COLOR } from '@/stores/canvas'

const pixelCanvas = useTemplateRef<HTMLCanvasElement>('pixel-canvas')

const editorStore = useEditorStore()
const tools = [
  { name: 'pen', icon: DrawIcon },
  { name: 'eraser', icon: EraseIcon },
  { name: 'fill', icon: FillIcon },
  { name: 'code', icon: SparkleIcon },
] as const

const { top, left, size } = defineProps<{ top: number; left: number; size: number }>()
const emit = defineEmits<{
  close: []
  done: []
  wheel: [event: WheelEvent]
}>()

function closeModal() {
  emit('close')
}

function done() {
  emit('done')
}

function handleWheel(event: WheelEvent) {
  emit('wheel', event)
}

const editorLayout = ref<'h' | 'v'>('v')
const showGrid = ref(true)
// Drawing state
const isDrawing = ref(false)
const pixelSize = computed(() => size / editorStore.resolution)

function drawCanvas() {
  if (!pixelCanvas.value) return
  const ctx = pixelCanvas.value.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, pixelCanvas.value.width, pixelCanvas.value.height)
  // Draw pixels
  const resolution = editorStore.resolution
  renderArtwork(editorStore.pixels, ctx, 0, 0, resolution, resolution, pixelSize.value)
  // Draw grid
  if (showGrid.value) {
    ctx.strokeStyle = GRID_COLOR
    ctx.lineWidth = 1
    // Vertical lines
    for (let x = 0; x <= resolution; x++) {
      ctx.beginPath()
      ctx.moveTo(x * pixelSize.value, 0)
      ctx.lineTo(x * pixelSize.value, resolution * pixelSize.value)
      ctx.stroke()
    }
    // Horizontal lines
    for (let y = 0; y <= resolution; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * pixelSize.value)
      ctx.lineTo(resolution * pixelSize.value, y * pixelSize.value)
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
  if ('touches' in event && event.touches.length !== 1) return
  isDrawing.value = true
  draw(event)
}

function draw(event: MouseEvent | TouchEvent) {
  if ('touches' in event && event.touches.length !== 1) return
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
  editorStore.applyFunction()
  editorStore.saveState()
  editorStore.tool = 'pen'
}

onMounted(drawCanvas)
watch([showGrid, pixelSize], () => nextTick(drawCanvas))
editorStore.$subscribe(drawCanvas)
</script>
