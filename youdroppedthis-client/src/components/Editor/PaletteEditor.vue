<template>
  <div class="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
    <!-- Color Swatches -->
    <div class="flex flex-wrap gap-3 mb-3">
      <button
        v-for="(color, index) in palette"
        :key="index"
        @click="selectColor(index)"
        :class="[
          'relative w-12 h-12 rounded-lg transition-all',
          selectedColorIndex === index
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-neutral-900 scale-110'
            : 'hover:scale-105',
        ]"
        :style="{ backgroundColor: color }"
      >
        <!-- Duplicate indicator -->
        <div
          v-if="isDuplicate(color, index)"
          class="absolute -top-1 -right-1 w-4 h-4 bg-code-warn rounded-full flex items-center justify-center text-[10px] font-bold text-neutral-800"
          title="Duplicate color"
        >
          !
        </div>
      </button>

      <!-- Add color button -->
      <button
        v-if="palette.length < maxColors"
        @click="addColor"
        class="w-12 h-12 p-2 text-neutral-600 rounded-lg border-2 border-dashed border-neutral-700 hover:border-primary flex items-center justify-center transition-colors"
      >
        <PlusIcon />
      </button>
    </div>

    <!-- Status text -->
    <p v-if="palette.length < minColors" class="text-xs text-neutral-500">
      Add at least {{ minColors }} colors.
    </p>
    <p v-else-if="palette.length >= maxColors" class="text-xs text-neutral-500">Palette is full.</p>
    <p v-else-if="hasDuplicates" class="text-xs text-code-warn">
      Some colors are duplicated. Consider using unique colors for variety.
    </p>

    <!-- Custom Color Picker (shown when a color is selected) -->
    <div v-if="selectedColorIndex !== null" class="mt-4 pt-4 border-t border-neutral-800">
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm font-medium">Edit color {{ selectedColorIndex + 1 }}</div>
        <div class="flex gap-2">
          <!-- Remove button - touch friendly -->
          <button
            v-if="palette.length > minColors"
            @click="removeColor(selectedColorIndex)"
            class="px-3 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <span class="size-5"><XMarkIcon /></span>
            Remove
          </button>

          <!-- Close picker -->
          <button
            @click="selectedColorIndex = null"
            class="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
      <div class="text-sm">
        <ColorPicker
          :value="palette[selectedColorIndex]"
          @update="(newColor) => updateColor(selectedColorIndex!, newColor)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PlusIcon from '@/assets/icons/plus.svg'
import XMarkIcon from '@/assets/icons/xmark.svg'
import ColorPicker from './ColorPicker.vue'

const props = defineProps<{ modelValue: string[]; minColors: number; maxColors: number }>()

const emit = defineEmits(['update:modelValue'])

const palette = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const selectedColorIndex = ref<number | null>(null)

const hasDuplicates = computed(() => {
  return palette.value.length !== new Set(palette.value).size
})

function isDuplicate(color: string, index: number) {
  // Check if this color appears elsewhere in the palette
  return palette.value.indexOf(color) !== index || palette.value.lastIndexOf(color) !== index
}

function selectColor(index: number) {
  selectedColorIndex.value = selectedColorIndex.value === index ? null : index
}

function addColor() {
  if (palette.value.length < props.maxColors) {
    const newPalette = [
      ...palette.value,
      selectedColorIndex.value === null ? '#ffffff' : palette.value[selectedColorIndex.value],
    ]
    palette.value = newPalette
    // Auto-select the new color for editing
    selectedColorIndex.value = newPalette.length - 1
  }
}

function removeColor(index: number) {
  if (palette.value.length > props.minColors) {
    const newPalette = palette.value.filter((_, i) => i !== index)
    palette.value = newPalette
    selectedColorIndex.value = null
  }
}

function updateColor(index: number, newColor: string) {
  const newPalette = [...palette.value]
  newPalette[index] = newColor
  palette.value = newPalette
}
</script>
