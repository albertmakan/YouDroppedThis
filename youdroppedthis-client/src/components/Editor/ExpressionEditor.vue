<template>
  <div class="relative w-full rounded-md" ref="container">
    <div
      class="absolute left-0 top-0 w-full whitespace-pre-wrap break-words rounded-md bg-code-editor border border-neutral-600 px-3 py-2 font-mono font-semibold caret-white"
      ref="highlight"
    >
      <code>
        <HighlightedExpression
          :expr="text"
          :tokens="expressionData.tokens"
          :variables="context"
          :namespace="namespace"
          @token-click="onTokenClick"
        />
      </code>
    </div>
    <div
      className="absolute left-0 top-0 w-full whitespace-pre-wrap break-words px-3 py-2 font-mono text-transparent"
    >
      <Suggestions
        ref="suggestions"
        :text="text"
        :context="context"
        :namespace="namespace"
        @insert="onInsert"
        @mousedown="suggestionClicked = true"
      />
    </div>
    <textarea
      :id="id"
      class="absolute left-0 top-0 w-full resize-none rounded-md bg-transparent px-3 py-2 font-mono font-semibold placeholder-shown:text-current text-transparent caret-neutral-200 outline-none focus:outline-secondary"
      v-model="text"
      @blur="onBlur"
      tabIndex="0"
      spellCheck="false"
      ref="textarea"
      :placeholder="placeholder"
      @keydown="onKeyDown"
      @mousedown="closeInserted = undefined"
      @keyup="onKeyUp"
    />
  </div>
</template>

<script setup lang="ts">
import { createExpressionCache } from '@/utils/parser'
import { computed, onMounted, onScopeDispose, ref, useTemplateRef, watch } from 'vue'
import HighlightedExpression from './HighlightedExpression'
import { insert, wrap } from '@/utils/suggestions'
import Suggestions from './Suggestions.vue'

const {
  text: initText,
  context,
  placeholder,
  id,
  namespace,
} = defineProps<{
  text: string
  context: Record<string, any>
  placeholder?: string
  id?: string
  namespace?: string
}>()

const emit = defineEmits<{
  change: [text: string]
}>()

const text = ref(initText)
const expressionData = computed(() => createExpressionCache(text.value))
const highlightRef = useTemplateRef<HTMLDivElement>('highlight')
const textareaRef = useTemplateRef<HTMLTextAreaElement>('textarea')
const containerRef = useTemplateRef<HTMLDivElement>('container')
const suggestionsRef = useTemplateRef<InstanceType<typeof Suggestions>>('suggestions')

let suggestionClicked = false
let closeInserted: ')' | '"' | undefined = undefined

function onKeyDown(e: KeyboardEvent) {
  const { key } = e
  if (key === 'Shift' || key === 'Control' || key === 'CapsLock') return
  if (key === 'Backspace' && closeInserted) {
    e.preventDefault()
    const { selectionStart: start } = textareaRef.value!
    const newText = insert(textareaRef.value!.value, start - 1, start + 1, '')
    textareaRef.value!.value = newText
    text.value = newText
    textareaRef.value?.setSelectionRange(start - 1, start - 1, 'forward')
    return
  }
  if (key === closeInserted) {
    e.preventDefault()
    const { selectionStart: start } = textareaRef.value!
    textareaRef.value?.setSelectionRange(start + 1, start + 1, 'forward')
    closeInserted = undefined
    return
  }
  closeInserted = undefined
  const closing = (key === '(' && ')') || (key === '"' && '"')
  if (closing) {
    e.preventDefault()
    const { selectionStart: start, selectionEnd: end } = textareaRef.value!
    const newText = wrap(textareaRef.value!.value, start, end, key, closing)
    textareaRef.value!.value = newText
    text.value = newText
    textareaRef.value?.setSelectionRange(start + 1, end + 1, 'forward')
    closeInserted = start === end ? closing : undefined
    return
  }
  if (key === 'Enter') e.preventDefault()
  if (suggestionsRef.value?.handleKey(key)) e.preventDefault()
}

function onKeyUp() {
  if (suggestionsRef.value) {
    suggestionsRef.value.position = textareaRef.value?.selectionStart ?? 0
  }
}

function onBlur() {
  if (suggestionClicked) {
    textareaRef.value?.focus()
    suggestionClicked = false
  } else {
    if (suggestionsRef.value) suggestionsRef.value.position = 0
    if (text.value !== initText) emit('change', text.value)
  }
  closeInserted = undefined
}

function onTokenClick(s: number, e: number) {
  textareaRef.value?.focus()
  textareaRef.value?.setSelectionRange(s, e)
}

function onInsert(start: number, value: string) {
  const { selectionEnd: end } = textareaRef.value!
  const newText = insert(textareaRef.value!.value, start, end, value)
  textareaRef.value!.value = newText
  text.value = newText
  const newPos = start + value.length
  textareaRef.value?.setSelectionRange(newPos, newPos, 'forward')
}

function resize() {
  const codeEl = highlightRef.value
  const textEl = textareaRef.value
  const containerEl = containerRef.value
  if (!codeEl || !textEl || !containerEl) return
  textEl.style.height = '0px'
  const h = (textEl.scrollHeight || 32) + 2
  textEl.style.height = h + 'px'
  codeEl.style.height = textEl.style.height
  containerEl.style.height = textEl.style.height
}

watch(text, resize)
let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  if (!textareaRef.value) return
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(textareaRef.value)
})
onScopeDispose(() => {
  resizeObserver?.disconnect()
})
</script>
