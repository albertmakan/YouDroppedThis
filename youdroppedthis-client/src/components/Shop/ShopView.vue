<template>
  <div class="min-h-screen bg-gradient-to-b from-teal-50 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-6xl mx-auto px-4 py-6">
        <div class="flex items-center space-x-3 mb-2">
          <button @click="$router.back()" class="text-gray-600 hover:text-gray-900">← Back</button>
          <h1 class="text-3xl font-bold text-gray-900">🪙 Coin Shop</h1>
        </div>
        <p class="text-gray-600">Buy coins to place more artwork and unlock premium features</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-6xl mx-auto px-4 py-12">
      <!-- Authentication Required -->
      <div v-if="!authStore.isAuthenticated" class="text-center py-12">
        <div class="bg-blue-50 rounded-lg p-8 mb-6">
          <p class="text-lg text-gray-700 mb-4">Login to purchase coins</p>
          <div class="flex gap-4 justify-center">
            <router-link to="/login" class="btn btn-primary"> Login </router-link>
            <router-link to="/register" class="btn btn-secondary"> Sign Up </router-link>
          </div>
        </div>
      </div>

      <!-- Current Balance -->
      <div v-else class="mb-8">
        <div class="bg-white rounded-lg p-6 border border-gray-200 mb-8">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm mb-1">Current Balance</p>
              <p class="text-4xl font-bold text-teal-600">{{ authStore.user?.balance || 0 }} 🪙</p>
            </div>
            <div class="text-right">
              <p class="text-gray-600 text-sm mb-1">Daily Bonus Available</p>
              <button
                @click="claimBonus"
                :disabled="bonusLoading || !canClaimBonus"
                class="btn text-sm"
                :class="canClaimBonus ? 'btn-primary' : 'opacity-50 cursor-not-allowed'"
              >
                {{ bonusLoading ? 'Claiming...' : '🎁 Claim Now' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Coin Packages Grid -->
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Coin Packages</h2>
          <p class="text-gray-600 mb-8">Choose a package to get started. All prices are in USD.</p>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <CoinPackage
              v-for="pkg in standardPackages"
              :key="pkg.id"
              :package="pkg"
              :is-loading="purchasingId === pkg.id"
              @purchase="handlePurchase(pkg)"
            />
          </div>
        </div>

        <!-- Subscription Tiers -->
        <div class="mt-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Monthly Subscriptions</h2>
          <p class="text-gray-600 mb-8">Get recurring coins and exclusive benefits</p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SubscriptionTier
              v-for="tier in subscriptionTiers"
              :key="tier.id"
              :tier="tier"
              :is-loading="purchasingId === tier.id"
              @purchase="handlePurchase(tier)"
            />
          </div>
        </div>

        <!-- FAQ Section -->
        <div class="mt-12 bg-white rounded-lg p-8 border border-gray-200">
          <h3 class="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>

          <div class="space-y-6">
            <div>
              <h4 class="font-semibold text-gray-900 mb-2">What can I do with coins?</h4>
              <p class="text-gray-600">
                Coins are used to place artwork on the canvas. Each artwork costs 10 coins to place.
                You can also use coins to access premium placement zones and features.
              </p>
            </div>

            <div>
              <h4 class="font-semibold text-gray-900 mb-2">
                How often can I claim the daily bonus?
              </h4>
              <p class="text-gray-600">
                You can claim 10 free coins once every 24 hours. Make sure to come back every day to
                maximize your free earnings!
              </p>
            </div>

            <div>
              <h4 class="font-semibold text-gray-900 mb-2">Do coins expire?</h4>
              <p class="text-gray-600">
                No, your coins never expire. They stay in your account until you use them to place
                artwork.
              </p>
            </div>

            <div>
              <h4 class="font-semibold text-gray-900 mb-2">Can I get a refund?</h4>
              <p class="text-gray-600">
                Coins are non-refundable once purchased, but you can always use them to create more
                artwork. If you encounter any issues, contact our support team.
              </p>
            </div>

            <div>
              <h4 class="font-semibold text-gray-900 mb-2">What are subscriptions?</h4>
              <p class="text-gray-600">
                Subscriptions give you recurring monthly coins plus exclusive benefits like premium
                placement access and analytics. You can cancel anytime.
              </p>
            </div>
          </div>
        </div>

        <!-- Purchase Confirmation Modal -->
        <PurchaseModal
          v-if="showPurchaseModal"
          :package="selectedPackage"
          :is-loading="confirmLoading"
          @confirm="confirmPurchase"
          @cancel="showPurchaseModal = false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { userApi } from '@/services/api'
import CoinPackage from './CoinPackage.vue'
import SubscriptionTier from './SubscriptionTier.vue'
import PurchaseModal from './PurchaseModal.vue'

const authStore = useAuthStore()

const bonusLoading = ref(false)
const purchasingId = ref<string | null>(null)
const showPurchaseModal = ref(false)
const confirmLoading = ref(false)
const selectedPackage = ref<any>(null)
const lastBonusTime = ref<string | null>(localStorage.getItem('last_bonus_claim'))

const canClaimBonus = computed(() => {
  if (!lastBonusTime.value) return true

  const lastClaim = new Date(lastBonusTime.value)
  const now = new Date()
  const daysPassed = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24)

  return daysPassed >= 1
})

const standardPackages = [
  {
    id: 'starter',
    coins: 100,
    price: 0.99,
    bonus: 0,
    bestFor: 'Try it out',
  },
  {
    id: 'basic',
    coins: 500,
    price: 3.99,
    bonus: 50,
    bestFor: 'Regular player',
    featured: false,
  },
  {
    id: 'pro',
    coins: 1500,
    price: 9.99,
    bonus: 250,
    bestFor: 'Serious creator',
    featured: true,
  },
  {
    id: 'mega',
    coins: 5000,
    price: 24.99,
    bonus: 1000,
    bestFor: 'Collector',
    featured: false,
  },
]

const subscriptionTiers = [
  {
    id: 'sub-basic',
    name: 'Basic',
    price: 4.99,
    coins: 500,
    features: [
      '500 coins per month',
      '20% discount on purchases',
      'Extended expiry (36 hours)',
      'Priority placement queue',
    ],
  },
  {
    id: 'sub-pro',
    name: 'Pro',
    price: 14.99,
    coins: 2000,
    features: [
      '2000 coins per month',
      'Premium zone access',
      '48-hour expiry time',
      'Advanced editor tools',
      'Analytics dashboard',
    ],
    featured: true,
  },
  {
    id: 'sub-artist',
    name: 'Artist',
    price: 29.99,
    coins: 5000,
    features: [
      '5000 coins per month',
      'Personal gallery space',
      'NFT minting tools',
      'Revenue sharing (10%)',
      'Collaboration features',
      'Priority support',
    ],
  },
]

async function claimBonus() {
  try {
    bonusLoading.value = true
    const result = await userApi.claimDailyBonus()

    if (result.success && result.newBalance) {
      authStore.updateBalance(result.newBalance)
      lastBonusTime.value = new Date().toISOString()
      localStorage.setItem('last_bonus_claim', lastBonusTime.value)
      alert(`🎁 ${result.message}`)
    }
  } catch (error: any) {
    alert(error.response?.data?.error || 'Failed to claim bonus')
  } finally {
    bonusLoading.value = false
  }
}

function handlePurchase(pkg: any) {
  selectedPackage.value = pkg
  showPurchaseModal.value = true
}

async function confirmPurchase() {
  // For now, this is a free version - just add coins
  // In production, you'd integrate with Stripe/PayPal here

  try {
    confirmLoading.value = true

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Add coins to user
    const newBalance = (authStore.user?.balance || 0) + selectedPackage.value.coins
    authStore.updateBalance(newBalance)

    showPurchaseModal.value = false
    alert(`✅ Successfully added ${selectedPackage.value.coins} coins to your account!`)
  } catch (error) {
    alert('Failed to complete purchase')
  } finally {
    confirmLoading.value = false
  }
}
</script>
