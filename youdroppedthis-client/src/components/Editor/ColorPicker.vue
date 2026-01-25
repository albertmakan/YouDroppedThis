<template>
  <div :style="{ background: `hsl(${hue}, ${saturation}%, ${lightness}%)` }">
    <div class="p-[1em]">
      <input
        type="text"
        :style="{
          color: `hsl(${hue}, ${saturation}%, ${lightness + (lightness > 50 ? -50 : 50)}%)`,
        }"
        :value="props.value + ` hsl(${hue}, ${saturation}%, ${lightness}%)`"
        disabled
        class="w-[30em] max-w-full p-[0.25em] font-semibold"
      />
    </div>
    <div class="p-[1.5em] flex flex-col gap-[1em] bg-black/80">
      <label for="hue" class="flex items-center">
        <abbr title="Hue: The color tint." class="w-[2em]">H</abbr>
        <input
          type="range"
          v-model="hue"
          id="hue"
          min="0"
          max="360"
          class="w-full h-[1em] appearance-none rounded-full accent-white"
          :style="{
            background: `linear-gradient(to right,
              hsl(0, ${saturation}%, ${lightness}%) 0%,
              hsl(60, ${saturation}%, ${lightness}%) 17%,
              hsl(120, ${saturation}%, ${lightness}%) 33%,
              hsl(180, ${saturation}%, ${lightness}%) 50%,
              hsl(240, ${saturation}%, ${lightness}%) 67%,
              hsl(300, ${saturation}%, ${lightness}%) 83%,
              hsl(360, ${saturation}%, ${lightness}%) 100%
            )`,
          }"
        />
      </label>
      <label for="saturation" class="flex items-center">
        <abbr title="Saturation: The amount of gray in the color." class="w-[2em]">S</abbr>
        <input
          type="range"
          v-model="saturation"
          id="saturation"
          min="0"
          max="100"
          class="w-full h-[1em] appearance-none rounded-full accent-white"
          :style="{
            background: `linear-gradient(to right,
              hsl(${hue}, 0%, ${lightness}%) 0%,
			        hsl(${hue}, 100%, ${lightness}%) 100%
            )`,
          }"
        />
      </label>
      <label for="lightness" class="flex items-center">
        <abbr title="Lightness: How light or dark the color is." class="w-[2em]">L</abbr>
        <input
          type="range"
          v-model="lightness"
          id="lightness"
          min="0"
          max="100"
          class="w-full h-[1em] appearance-none rounded-full accent-white"
          :style="{
            background: `linear-gradient(to right,
              hsl(${hue}, ${saturation}%, 0%) 0%,
              hsl(${hue}, ${saturation}%, 50%) 50%,
              hsl(${hue}, ${saturation}%, 100%) 100%
            )`,
          }"
        />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { colorToRGBA, hslToRGB, rgbToHSL } from '@/utils/color'
import { ref, watch } from 'vue'

const props = defineProps<{ value: string }>()
const emit = defineEmits<{ update: [value: string] }>()

const hue = ref(0)
const saturation = ref(0)
const lightness = ref(0)

watch([hue, saturation, lightness], () => {
  const [r, g, b] = hslToRGB(hue.value, saturation.value, lightness.value)
  emit(
    'update',
    `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
  )
})

watch(
  () => props.value,
  () => {
    const [r, g, b] = colorToRGBA(props.value)
    const [h, s, l] = rgbToHSL(r, g, b)
    hue.value = h
    saturation.value = s
    lightness.value = l
  },
  { immediate: true },
)
</script>
