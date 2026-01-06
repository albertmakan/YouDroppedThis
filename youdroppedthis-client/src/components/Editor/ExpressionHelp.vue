<template>
  <div class="space-y-3 text-sm">
    <p class="font-semibold">Write code to generate patterns!</p>

    <p>Your expression runs for each pixel and returns a color.</p>

    <div class="bg-neutral-900 border border-neutral-800 rounded-lg p-3 space-y-2">
      <p class="text-neutral-100 font-medium text-xs uppercase tracking-wide">Quick Start</p>
      <div class="space-y-1.5">
        <div>
          <code><span class="text-code-var">x</span>, <span class="text-code-var">y</span></code>
          <span class="text-neutral-400"> — pixel coordinates (0,0 = top-left)</span>
        </div>
        <div>
          <code>
            <span class="text-code-fun">palette</span>
            <span class="text-code-bracket-1">(</span>
            <span class="text-code-num">0</span>
            <span class="text-code-bracket-1">)</span>
          </code>
          <span class="text-neutral-400"> — first color (wraps around if out of bounds)</span>
        </div>
        <div>
          <code>
            <span class="text-code-fun">pixel</span>
            <span class="text-code-bracket-1">(</span>
            <span class="text-code-num">2</span>
            <span class="text-code-bracket-1">, </span>
            <span class="text-code-num">3</span>
            <span class="text-code-bracket-1">)</span>
          </code>
          <span class="text-neutral-400"> — get color at position (2,3)</span>
        </div>
      </div>
    </div>

    <div class="bg-neutral-900 border border-neutral-800 rounded-lg p-3 space-y-2">
      <p class="text-neutral-100 font-medium text-xs uppercase tracking-wide">Examples</p>
      <div class="space-y-2 text-xs">
        <div v-for="{ description, expression } in examples">
          <div class="text-neutral-400">// {{ description }}</div>
          <code>
            <HighlightedExpression
              :expr="expression"
              :tokens="tokenize(expression).tokens"
              :variables="context"
              :noTooltip="true"
            />
          </code>
        </div>
      </div>
    </div>

    <details class="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
      <summary class="cursor-pointer text-neutral-100 font-medium text-xs uppercase tracking-wide">
        Available Functions
      </summary>
      <div class="mt-2 space-y-1 text-xs">
        <div>
          <code>
            <span class="text-code-fun">palette</span>
            <span class="text-code-bracket-1">(</span>
            <span class="text-code-num">n</span>
            <span class="text-code-bracket-1">)</span>
          </code>
          <span class="text-neutral-400"> — get color at index n (wraps around)</span>
        </div>
        <div>
          <code>
            <span class="text-code-fun">pixel</span>
            <span class="text-code-bracket-1">(</span>
            <span class="text-code-num">i</span>
            <span class="text-code-bracket-1">, </span>
            <span class="text-code-num">j</span>
            <span class="text-code-bracket-1">)</span>
          </code>
          <span class="text-neutral-400"> — get current color at (i,j)</span>
        </div>
        <div>
          <code>
            <span class="text-code-fun">ifelse</span>
            <span class="text-code-bracket-1">(</span>
            <span class="text-code-var">condition</span>
            <span class="text-code-bracket-1">, </span>
            <span class="text-code-var">if_true</span>
            <span class="text-code-bracket-1">, </span>
            <span class="text-code-var">if_false</span>
            <span class="text-code-bracket-1">)</span>
          </code>
        </div>
        <div>
          <code>
            <span class="text-code-fun">random</span>
            <span class="text-code-bracket-1">()</span>
          </code>
          <span class="text-neutral-400"> — 0 to 1</span>
        </div>
        <div>
          <code>
            <span class="text-code-fun">floor</span>
            <span class="text-code-bracket-1">(</span>
            <span class="text-code-num">n</span>
            <span class="text-code-bracket-1">)</span>,
            <span class="text-code-fun">ceil</span>
            <span class="text-code-bracket-1">(</span>
            <span class="text-code-num">n</span>
            <span class="text-code-bracket-1">)</span>,
            <span class="text-code-fun">round</span>
            <span class="text-code-bracket-1">(</span>
            <span class="text-code-num">n</span>
            <span class="text-code-bracket-1">)</span>
          </code>
        </div>
        <div>
          <code>
            <span class="text-code-fun">abs</span>
            <span class="text-code-bracket-1">(</span>
            <span class="text-code-num">n</span>
            <span class="text-code-bracket-1">)</span>,
            <span class="text-code-fun">min</span>
            <span class="text-code-bracket-1">(</span>
            <span class="text-code-num">a</span>
            <span class="text-code-bracket-1">, </span>
            <span class="text-code-num">b</span>
            <span class="text-code-bracket-1">)</span>,
            <span class="text-code-fun">max</span>
            <span class="text-code-bracket-1">(</span>
            <span class="text-code-num">a</span>
            <span class="text-code-bracket-1">, </span>
            <span class="text-code-num">b</span>
            <span class="text-code-bracket-1">)</span>
          </code>
        </div>
        <div>
          <code>
            <span class="text-code-fun">mod</span>
            <span class="text-code-bracket-1">(</span>
            <span class="text-code-num">n</span>
            <span class="text-code-bracket-1">, </span>
            <span class="text-code-num">m</span>
            <span class="text-code-bracket-1">)</span>
          </code>
          <span class="text-neutral-400"> — modulo that works with negatives</span>
        </div>
        <div>
          <code>
            <span class="text-code-fun">not</span>
            <span class="text-code-bracket-1">(</span>
            <span class="text-code-num">a</span>
            <span class="text-code-bracket-1">)</span>
          </code>
          <span class="text-neutral-400"> — logical NOT</span>
        </div>
      </div>
    </details>

    <details class="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
      <summary class="cursor-pointer text-neutral-100 font-medium text-xs uppercase tracking-wide">
        Operators
      </summary>
      <div class="mt-2 -grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
        <div>
          <code class="text-code-operator">+ - * / % ^</code>
          <span class="text-neutral-400"> — math</span>
        </div>
        <div>
          <code class="text-code-operator">= != &gt; &lt; &gt;= &lt;=</code>
          <span class="text-neutral-400"> — compare</span>
        </div>
        <div>
          <code class="text-code-operator">&amp;</code>
          <span class="text-neutral-400"> — AND</span>
        </div>
        <div>
          <code class="text-code-operator">|</code>
          <span class="text-neutral-400"> — OR</span>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { tokenize } from '@/utils/parser'
import HighlightedExpression from './HighlightedExpression'

const examples = [
  {
    description: 'Checkerboard pattern',
    expression: 'ifelse(mod(x + y, 2) = 0, palette(0), palette(1))',
  },
  {
    description: 'Diagonal stripes',
    expression: 'palette(x + y)',
  },
  {
    description: 'Random noise',
    expression: 'palette(floor(random() * 6))',
  },
  {
    description: 'Circle from center',
    expression: 'ifelse(abs(x - 8) + abs(y - 8) < 5, palette(2), palette(0))',
  },
  {
    description: 'Vertical gradient',
    expression: 'palette(floor(y / 4))',
  },
  {
    description: 'Copy from another position',
    expression: 'pixel(15 - x, 15 - y)',
  },
]
const context = {
  x: 0,
  y: 0,
  palette: (i: number) => '',
  pixel: (x: number, y: number) => '',
}
</script>
