<template>
  <template v-if="current.suggestions.length">
    {{ text.substring(0, position) }}
    <span class="relative">
      <div
        ref="caret"
        class="absolute left-0 top-full z-30 max-h-20 overflow-auto bg-neutral-700 text-neutral-200 shadow-lg border"
      >
        <button
          v-for="(s, i) in current.suggestions"
          @click="insert(s)"
          @mousedown="emit('mousedown')"
          @mouseup.stop
          class="block w-full border-0 bg-opacity-60 px-1 text-left text-sm hover:bg-neutral-500 text-nowrap h-5"
          :class="{ 'bg-neutral-500': i === index }"
        >
          <span className="text-code-var">{{ current.lastPart }}</span
          >{{ s.substring(current.lastPart.length) }}
        </button>
      </div>
    </span>
    {{ text.substring(position) }}
  </template>
</template>

<script setup lang="ts">
import { getSuggestions } from '@/utils/suggestions'
import { computed, ref, useTemplateRef, watch } from 'vue'
const VAR_RE = /(\w|\.)/

const { text, context, namespace } = defineProps<{
  text: string
  context: Record<string, any>
  namespace?: string
}>()

const emit = defineEmits<{
  insert: [start: number, value: string]
  mousedown: []
}>()

const position = ref(0)
const caretRef = useTemplateRef<HTMLDivElement>('caret')
const index = ref(0)
watch(position, () => (index.value = 0))

const current = computed(() => {
  let pos = position.value - 1
  let lastPartStart: number
  while (pos >= 0) {
    const ch = text[pos]
    if (!ch?.match(VAR_RE)) break
    if (ch === '.') lastPartStart ??= pos + 1
    pos--
  }
  const wordStartIndex = pos + 1
  lastPartStart ??= wordStartIndex
  const currentWord = text.substring(wordStartIndex, position.value)
  const lastPart = text.substring(lastPartStart, position.value) ?? ''
  const suggestions = getSuggestions(context, currentWord, namespace)
  return { lastPartStart, lastPart, suggestions }
})

function moveIndex(isNext: boolean) {
  const i = index.value
  if (isNext) index.value = i >= current.value.suggestions.length - 1 ? 0 : i + 1
  else index.value = i <= 0 ? current.value.suggestions.length - 1 : i - 1
  caretRef.value?.scrollTo({ top: index.value * 20, behavior: 'smooth' })
}

function insert(part: string) {
  emit('insert', current.value.lastPartStart, part)
}

function handleKey(key: string) {
  if (current.value.suggestions.length === 0) return false
  if (key === 'ArrowDown') {
    moveIndex(true)
    return true
  }
  if (key === 'ArrowUp') {
    moveIndex(false)
    return true
  }
  if (key === 'Enter' || key === 'Tab') {
    insert(current.value.suggestions[index.value] ?? current.value.lastPart)
    return true
  }
  return false
}

defineExpose({ position, handleKey })
</script>
