<template>
  <Header />
  <div class="max-w-2xl mx-auto p-6">
    <div
      v-if="!authStore.isAuthenticated"
      class="backdrop-blur-xl border border-secondary p-3 rounded-lg text-center mb-8"
    >
      Please sign in to host a moment
    </div>
    <!-- Review Screen -->
    <template v-if="showReview">
      <div class="mb-8">
        <h1 class="text-2xl font-bold mb-2">Review your moment</h1>
        <p class="text-neutral-400 text-sm">Once hosted, the palette and size cannot be changed.</p>
      </div>

      <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
        <div>
          <div class="text-sm text-neutral-500 mb-1">Canvas name</div>
          <div class="text-lg font-semibold">{{ formData.name }}</div>
        </div>

        <div>
          <div class="text-sm text-neutral-500 mb-1">Description</div>
          <div class="text-neutral-300 whitespace-pre-wrap text-sm">{{ formData.description }}</div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-sm text-neutral-500 mb-1">Moment size</div>
            <div class="font-medium">
              {{ canvasSizes[formData.canvasSize].label }} —
              {{ canvasSizes[formData.canvasSize].subtitle }}
            </div>
          </div>
          <div>
            <div class="text-sm text-neutral-500 mb-1">Artwork resolution</div>
            <div class="font-medium">{{ formData.artworkSize }} × {{ formData.artworkSize }}</div>
          </div>
        </div>

        <div>
          <div class="text-sm text-neutral-500 mb-2">Palette</div>
          <div class="flex gap-2 flex-wrap">
            <div
              v-for="(color, i) in formData.palette"
              :key="i"
              class="w-10 h-10 rounded-lg border border-neutral-700"
              :style="{ backgroundColor: color }"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-sm text-neutral-500 mb-1">Placement fee</div>
            <div class="font-medium">{{ formData.placementFee }} coins</div>
          </div>
          <div>
            <div class="text-sm text-neutral-500 mb-1">Artwork lifetime</div>
            <div class="font-medium">
              {{ lifetimeOptions.find((o) => o.value === formData.artworkLifetime)?.label }}
            </div>
          </div>
        </div>

        <div>
          <div class="text-sm text-neutral-500 mb-1">Min. visibility</div>
          <div class="font-medium">
            {{ allMinVisibilityOptions.find((o) => o.value === formData.minVisibility)?.label }}
          </div>
        </div>

        <div class="pt-4 border-t border-neutral-800">
          <div class="text-sm text-neutral-500 mb-1">Hosting cost</div>
          <div class="text-2xl font-bold text-primary">
            {{ canvasSizes[formData.canvasSize].fee }} coins
          </div>
          <p class="text-xs text-neutral-500 mt-1">This helps keep moments intentional.</p>
        </div>
      </div>

      <div class="flex gap-3 mt-8">
        <button
          @click="showReview = false"
          class="px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 font-semibold transition-colors"
        >
          Change
        </button>
        <button
          @click="hostMoment"
          class="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-teal-600 hover:from-teal-600 hover:to-teal-700 font-semibold transition-all"
        >
          Host moment
        </button>
      </div>

      <button
        @click="cancel"
        class="w-full text-center text-neutral-500 hover:text-neutral-400 mt-4 text-sm"
      >
        Cancel
      </button>
    </template>

    <!-- Form -->
    <template v-else>
      <div class="mb-8">
        <h1 class="text-2xl font-bold mb-2">Host a moment</h1>
        <p class="text-neutral-400 text-sm">
          You're setting the conditions for a shared moment.<br />
          Others will bring the art.
        </p>
      </div>

      <div class="space-y-8">
        <!-- Canvas Basics -->
        <section class="space-y-6">
          <div>
            <label class="block text-sm font-medium mb-2">Canvas name</label>
            <input
              v-model="formData.name"
              type="text"
              maxlength="60"
              placeholder="e.g. Falling leaves"
              class="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2"> Description </label>
            <textarea
              v-model="formData.description"
              maxlength="500"
              placeholder="A quiet prompt, a mood, or an idea."
              rows="3"
              class="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors resize-y"
            />
            <p class="text-xs text-neutral-500 mt-1">This sets the tone or the rules.</p>
          </div>
        </section>

        <!-- Moment Scope -->
        <section class="space-y-4">
          <h3 class="text-lg font-semibold">Moment size</h3>

          <div class="space-y-3">
            <label
              v-for="(config, key) in canvasSizes"
              :key="key"
              :class="[
                'block p-4 rounded-lg border-2 cursor-pointer transition-all',
                formData.canvasSize === key
                  ? 'border-primary bg-primary/10'
                  : 'border-neutral-800 hover:border-neutral-700',
              ]"
            >
              <div class="flex items-start gap-3">
                <div class="flex items-center h-6">
                  <div
                    :class="[
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      formData.canvasSize === key ? 'border-primary' : 'border-neutral-600',
                    ]"
                  >
                    <div
                      v-if="formData.canvasSize === key"
                      class="w-2.5 h-2.5 rounded-full bg-primary"
                    />
                  </div>
                </div>
                <div class="flex-1">
                  <div class="font-semibold">{{ config.label }} — {{ config.subtitle }}</div>
                  <p class="text-sm text-neutral-400 mt-1">{{ config.helperText }}</p>
                </div>
              </div>
              <input
                type="radio"
                name="canvasSize"
                :value="key"
                v-model="formData.canvasSize"
                class="sr-only"
              />
            </label>
          </div>
        </section>

        <!-- Artwork Rules -->
        <section class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold mb-1">Artwork resolution</h3>
            <p class="text-sm text-neutral-400">Everyone uses the same size on this canvas.</p>
          </div>

          <div class="space-y-3">
            <label
              v-for="size in [8, 16, 32, 64] as const"
              :key="size"
              :class="[
                'block p-4 rounded-lg border-2 cursor-pointer transition-all',
                formData.artworkSize === size
                  ? 'border-primary bg-primary/10'
                  : 'border-neutral-800 hover:border-neutral-700',
              ]"
            >
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    formData.artworkSize === size ? 'border-primary' : 'border-neutral-600',
                  ]"
                >
                  <div
                    v-if="formData.artworkSize === size"
                    class="w-2.5 h-2.5 rounded-full bg-primary"
                  />
                </div>
                <div>
                  <div class="font-semibold">{{ artworkSizes[size].label }}</div>
                  <div class="text-sm text-neutral-400">{{ artworkSizes[size].subtitle }}</div>
                </div>
              </div>
              <input
                type="radio"
                name="artworkSize"
                :value="size"
                v-model.number="formData.artworkSize"
                class="sr-only"
              />
            </label>
          </div>
        </section>

        <!-- Artwork Lifetime -->
        <section class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold mb-1">Artwork lifetime</h3>
            <p class="text-sm text-neutral-400">How long art stays visible before fading.</p>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <label
              v-for="option in lifetimeOptions"
              :key="option.value"
              :class="[
                'flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all text-center',
                formData.artworkLifetime === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-neutral-800 hover:border-neutral-700',
              ]"
            >
              <span class="font-semibold text-sm">{{ option.label }}</span>
              <input
                type="radio"
                name="artworkLifetime"
                :value="option.value"
                v-model.number="formData.artworkLifetime"
                class="sr-only"
              />
            </label>
          </div>
        </section>

        <!-- Min Visibility -->
        <section class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold mb-1">Minimum visibility</h3>
            <p class="text-sm text-neutral-400">
              How long art must stay before it can be collected.
            </p>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <label
              v-for="option in minVisibilityOptions"
              :key="option.value"
              :class="[
                'flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all text-center',
                formData.minVisibility === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-neutral-800 hover:border-neutral-700',
              ]"
            >
              <span class="font-semibold text-sm">{{ option.label }}</span>
              <input
                type="radio"
                name="minVisibility"
                :value="option.value"
                v-model.number="formData.minVisibility"
                class="sr-only"
              />
            </label>
          </div>
        </section>

        <!-- Palette -->
        <section class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold mb-1">Palette</h3>
            <p class="text-sm text-neutral-400">Choose the colors others can use here.</p>
          </div>

          <PaletteEditor v-model="formData.palette" :min-colors="2" :max-colors="32" />

          <p class="text-xs text-neutral-500">
            The palette can't be changed once the moment begins.
          </p>
        </section>

        <!-- Economy & Limits -->
        <section class="space-y-4">
          <h3 class="text-lg font-semibold">Participation</h3>

          <div class="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-4">
            <div>
              <div class="flex justify-between items-start mb-2">
                <div>
                  <div class="font-medium">Cost to place an artwork</div>
                </div>
                <div class="text-primary font-semibold">
                  <span v-if="formData.allowAnonymousPlacement">0 coins (anonymous)</span>
                  <span v-else>{{ formData.placementFee }} coins</span>
                </div>
              </div>

              <input
                v-if="!formData.allowAnonymousPlacement"
                type="range"
                v-model.number="formData.placementFee"
                min="8"
                max="20"
                class="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-primary"
              />

              <p class="text-sm text-neutral-400 mt-2">
                <span v-if="formData.allowAnonymousPlacement">
                  Anonymous canvases are free to place on and do not generate rewards for
                  placements.
                </span>
                <span v-else> Higher fees slow things down. Lower fees invite exploration. </span>
              </p>
            </div>

            <div class="border-t border-neutral-800 pt-4 mt-2 space-y-2">
              <label class="flex items-start gap-3 cursor-pointer">
                <input
                  v-model="formData.allowAnonymousPlacement"
                  type="checkbox"
                  class="mt-1 w-4 h-4 rounded border-neutral-600 bg-neutral-900 text-primary focus:ring-primary"
                />
                <div>
                  <div class="font-medium">Allow anonymous (no-login) placements</div>
                  <p class="text-sm text-neutral-400">
                    Anyone can drop art here without signing in. Placements are free and do not earn
                    rewards.
                  </p>
                </div>
              </label>
            </div>

            <div class="flex justify-between items-start">
              <div>
                <div class="font-medium">Placement pace</div>
                <p class="text-sm text-neutral-400 mt-0.5">Slower pacing keeps moments readable.</p>
              </div>
              <div class="text-neutral-300 font-semibold">5 / user / hour</div>
            </div>
          </div>
        </section>

        <!-- Visuals -->
        <section class="space-y-4">
          <label class="block text-sm font-medium mb-2">Background</label>
          <div class="text-sm">
            <ColorPicker
              :value="formData.backgroundColor"
              @update="(newColor) => (formData.backgroundColor = newColor)"
            />
          </div>
          <span class="text-sm text-neutral-400"> A neutral background works best. </span>
        </section>

        <!-- Submit -->
        <div class="pt-6">
          <button
            v-if="authStore.isAuthenticated"
            @click="showReview = true"
            :disabled="!canSubmit"
            class="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-primary to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-600 font-semibold transition-all text-lg disabled:cursor-not-allowed"
          >
            Review and host
          </button>

          <button
            @click="cancel"
            class="w-full text-center text-neutral-500 hover:text-neutral-400 mt-4 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth'
import PaletteEditor from '@/components/Editor/PaletteEditor.vue'
import ColorPicker from '@/components/Editor/ColorPicker.vue'
import { useCreateCanvas } from '@/composables/useCanvases'
import Header from '@/components/Layout/Header.vue'
import { useToast } from '@/composables/useToast'

const { mutate: mutateCreateCanvas } = useCreateCanvas()

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const canvasSizes = {
  sm: {
    label: 'Small',
    subtitle: '16 × 16 cells',
    grid: 16,
    fee: 150,
    helperText: 'Best for tight prompts and strong coherence.',
  },
  md: {
    label: 'Medium',
    subtitle: '32 × 32 cells',
    grid: 32,
    fee: 250,
    helperText: 'A balanced space for shared exploration.',
  },
  lg: {
    label: 'Large',
    subtitle: '48 × 48 cells',
    grid: 48,
    fee: 400,
    helperText: 'Larger moments need care. Expect slower pacing.',
  },
}

const artworkSizes = {
  8: { label: '8 × 8', subtitle: 'Fast, loose drops' },
  16: { label: '16 × 16', subtitle: 'Balanced detail' },
  32: { label: '32 × 32', subtitle: 'Slow, deliberate pieces' },
  64: { label: '64 × 64', subtitle: 'High detail' },
}

const lifetimeOptions = [
  { value: 60, label: '1 hour' },
  { value: 180, label: '3 hours' },
  { value: 360, label: '6 hours' },
  { value: 720, label: '12 hours' },
  { value: 1440, label: '1 day' },
  { value: 2880, label: '2 days' },
]

const allMinVisibilityOptions = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 180, label: '3 hours' },
  { value: 360, label: '6 hours' },
  { value: 720, label: '12 hours' },
]

const minVisibilityOptions = computed(() =>
  allMinVisibilityOptions.filter((o) => o.value < formData.value.artworkLifetime),
)

const formData = ref({
  name: '',
  description: '',
  canvasSize: 'sm' as keyof typeof canvasSizes,
  artworkSize: 8,
  palette: ['#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6'],
  backgroundColor: '#1c1717',
  placementFee: 10,
  allowAnonymousPlacement: false,
  artworkLifetime: 720,
  minVisibility: 180,
})

watch(
  () => formData.value.artworkLifetime,
  (newLifetime) => {
    if (formData.value.minVisibility >= newLifetime) {
      const valid = allMinVisibilityOptions.filter((o) => o.value < newLifetime)
      formData.value.minVisibility = valid[valid.length - 1]?.value ?? 15
    }
  },
)

const showReview = ref(false)

const canSubmit = computed(() => {
  return formData.value.name.length >= 3 && formData.value.palette.length >= 4
})

function hostMoment() {
  mutateCreateCanvas(formData.value, {
    onSuccess: (response) => {
      authStore.setProfileInfo(response.userProfile)
      router.push(`/c/${response.canvas.id}`)
    },
    onError: (error) => {
      toast.error(
        'Failed to create canvas: ' + JSON.stringify((error as AxiosError).response?.data, null, 4),
      )
    },
  })
}

function cancel() {
  router.back()
}
</script>
