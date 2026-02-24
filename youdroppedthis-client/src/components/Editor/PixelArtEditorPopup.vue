<template>
  <div
    class="w-fit h-fit fixed text-neutral-200 border border-dashed pointer-events-none box-border"
    :style="{ left: `${left}px`, top: `${top}px`, borderColor: gridColor }"
  >
    <div class="relative min-w-full">
      <div
        class="absolute p-4 bg-black/90 backdrop-blur-xl rounded-lg min-w-full box-content border border-neutral-600 text-center space-y-3"
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
          <button @click="emit('close')" class="cursor-pointer size-6 pointer-events-auto">
            <XMarkIcon />
          </button>
        </div>
        <slot name="header" />
        <div
          class="flex justify-center gap-2 *:pointer-events-auto *:size-8 *:p-1 *:rounded-md *:cursor-pointer"
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
    <div v-if="isCode" class="relative w-full">
      <div class="absolute inset-0 backdrop-blur-xl bg-black/30" :style="{ height: `${size}px` }" />
      <div
        class="absolute p-4 inset-0 w-full overflow-y-auto overflow-x-hidden pointer-events-auto"
        :style="{ height: `${size}px` }"
      >
        <div class="flex px-1 items-center mb-1 gap-2 text-xs">
          <label for="expression-field">pixel(x,y) :=</label>
          <button
            @click="isExpressionHelpOpen = !isExpressionHelpOpen"
            class="ml-auto size-5 rounded-full cursor-pointer bg-neutral-900 hover:bg-neutral-800"
          >
            <XMarkIcon v-if="isExpressionHelpOpen" />
            <InfoIcon v-else />
          </button>
        </div>
        <template v-if="isExpressionHelpOpen">
          <div
            class="bg-neutral-900 border border-neutral-600 rounded-md rounded-tr-none w-full p-2"
          >
            <ExpressionHelp />
          </div>
          <div class="flex justify-center gap-x-4 gap-y-2 mt-2 flex-wrap">
            <button
              @click="isExpressionHelpOpen = false"
              class="cursor-pointer bg-neutral-900 hover:bg-neutral-800 py-1 px-2 text-xs rounded-md inline-flex gap-1"
            >
              <span class="size-4"><XMarkIcon /></span>
              Close
            </button>
          </div>
        </template>
        <template v-else>
          <ExpressionEditor
            id="expression-field"
            :text="editorStore.expression"
            @change="(newExpr) => (editorStore.expression = newExpr)"
            :context="editorStore.context"
          />
          <div class="flex justify-center gap-x-4 gap-y-2 mt-2 flex-wrap">
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
        </template>
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
      @wheel.prevent="(e) => emit('wheel', e)"
      :class="{ 'pointer-events-none': !editorStore.tool, 'pointer-events-auto': editorStore.tool }"
      style="image-rendering: pixelated"
    />
    <div class="relative min-w-full">
      <div
        class="absolute p-4 bg-black/90 backdrop-blur-xl rounded-lg min-w-full box-content border border-neutral-600 text-center space-y-3"
        :class="{
          'top-0 left-1/2 -translate-x-1/2': editorLayout === 'v',
          'left-full bottom-0': editorLayout === 'h',
        }"
      >
        <div class="flex gap-2 flex-wrap min-w-64 m-auto mb-4 *:pointer-events-auto">
          <div class="h-6 w-14" :style="{ background: editorStore.selectedColor }"></div>
          <button
            v-for="(color, i) in canvasInfo.palette ?? DEFAULT_PALETTE"
            :key="color"
            :class="[
              'w-6 h-6 rounded-md cursor-pointer',
              { 'ring-2': editorStore.selectedColor === color },
            ]"
            :style="{ backgroundColor: color }"
            @click="editorStore.selectedColor = color"
          >
            <div v-if="isCode" class="text-xs text-white">{{ i }}</div>
          </button>
        </div>
        <slot name="drop" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, useTemplateRef, nextTick, type DeepReadonly } from 'vue'
import { useEditorStore } from '@/stores/editor'
import DrawIcon from '@/assets/icons/draw.svg'
import FillIcon from '@/assets/icons/fill.svg'
import EraseIcon from '@/assets/icons/erase.svg'
import XMarkIcon from '@/assets/icons/xmark.svg'
import UndoIcon from '@/assets/icons/undo.svg'
import RedoIcon from '@/assets/icons/redo.svg'
import GridIcon from '@/assets/icons/grid.svg'
import FunctionIcon from '@/assets/icons/function.svg'
import CheckmarkIcon from '@/assets/icons/checkmark.svg'
import InfoIcon from '@/assets/icons/info.svg'
import ExpressionEditor from '@/components/Editor/ExpressionEditor.vue'
import ExpressionHelp from './ExpressionHelp.vue'
import type { CanvasInfo } from '@/shared/types'

const DEFAULT_PALETTE = [
  '#000000',
  '#FFFFFF',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#808080',
  '#800000',
  '#808000',
  '#008000',
  '#800080',
  '#008080',
  '#000080',
]

const pixelCanvas = useTemplateRef<HTMLCanvasElement>('pixel-canvas')

const editorStore = useEditorStore()
const tools = [
  { name: 'pen', icon: DrawIcon },
  { name: 'eraser', icon: EraseIcon },
  { name: 'fill', icon: FillIcon },
  { name: 'code', icon: FunctionIcon },
] as const

const { top, left, size, canvasInfo, gridColor } = defineProps<{
  top: number
  left: number
  size: number
  canvasInfo: DeepReadonly<CanvasInfo>
  gridColor: string
}>()

const emit = defineEmits<{
  close: []
  wheel: [event: WheelEvent]
}>()

const editorLayout = ref<'h' | 'v'>('v')
const isExpressionHelpOpen = ref(false)
const showGrid = ref(true)
let drawingButton: number | null = null
let isPen = true
const isCode = computed(() => editorStore.tool === 'code')
const pixelSize = computed(() => size / canvasInfo.artwork_resolution)

function drawCanvas() {
  if (!pixelCanvas.value) return
  const ctx = pixelCanvas.value.getContext('2d')
  if (!ctx) return
  const resolution = canvasInfo.artwork_resolution
  editorStore.renderToOffscreenCanvas()
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(editorStore.offscreenCanvas, 0, 0, ctx.canvas.width, ctx.canvas.height)
  if (showGrid.value) {
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 0.5
    for (let x = 0; x <= resolution; x++) {
      ctx.beginPath()
      ctx.moveTo(x * pixelSize.value, 0)
      ctx.lineTo(x * pixelSize.value, size)
      ctx.stroke()
    }
    for (let y = 0; y <= resolution; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * pixelSize.value)
      ctx.lineTo(size, y * pixelSize.value)
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
  isPen = editorStore.tool === 'pen'
  drawingButton = 'button' in event ? event.button : 0
  if (drawingButton === 1) editorStore.tool = null
  else if (drawingButton === 2 && isPen) editorStore.tool = 'eraser'
  draw(event)
}

function draw(event: MouseEvent | TouchEvent) {
  if ('touches' in event && event.touches.length !== 1) return
  if (drawingButton === null) return
  const { x, y } = getPixelCoordinates(event)
  editorStore.setPixel(x, y)
}

function stopDrawing() {
  if (drawingButton !== null) {
    if (drawingButton === 2 && isPen) {
      editorStore.tool = 'pen'
    }
    drawingButton = null
    editorStore.saveState()
  }
}

function clearCanvas() {
  editorStore.clearCanvas()
  editorStore.saveState()
}

function applyExpression() {
  const applied = editorStore.applyFunction()
  if (applied) {
    editorStore.saveState()
    editorStore.tool = 'pen'
  }
}

onMounted(drawCanvas)
watch([showGrid, pixelSize], () => nextTick(drawCanvas))
watch(
  () => canvasInfo,
  () => {
    editorStore.setConfig({
      canvasId: canvasInfo.id,
      palette: [...(canvasInfo.palette ?? DEFAULT_PALETTE)],
      resolution: canvasInfo.artwork_resolution,
    })
  },
  { immediate: true },
)

editorStore.$subscribe(drawCanvas)
</script>
