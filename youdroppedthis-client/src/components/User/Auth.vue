<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ mode === 'login' ? 'Welcome Back!' : 'Join YouDroppedThis' }}</h2>
        <button @click="closeModal" class="close-btn">&times;</button>
      </div>

      <div class="auth-tabs">
        <button @click="setMode('login')" :class="['tab', { active: mode === 'login' }]">
          Login
        </button>
        <button @click="setMode('register')" :class="['tab', { active: mode === 'register' }]">
          Register
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- Registration fields -->
        <div v-if="mode === 'register'" class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            required
            placeholder="your@email.com"
            :disabled="isLoading"
          />
        </div>

        <!-- Common fields -->
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            required
            placeholder="Enter username"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            required
            :placeholder="mode === 'register' ? 'At least 6 characters' : 'Enter password'"
            :disabled="isLoading"
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="isLoading || !isFormValid">
          <span v-if="isLoading" class="spinner"></span>
          {{ isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account' }}
        </button>
      </form>

      <div class="auth-info">
        <p v-if="mode === 'register'" class="welcome-info">
          🎨 You'll start with <strong>100 coins</strong> to place your first artworks!
        </p>
        <p v-else class="demo-info">Demo accounts: Try username "demo" with any password</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Props
interface Props {
  isOpen: boolean
  initialMode?: 'login' | 'register'
}

const props = withDefaults(defineProps<Props>(), {
  initialMode: 'login',
})

// Emits
const emit = defineEmits<{
  close: []
  success: []
}>()

// Auth composable
const { login, register, isLoading, error, clearError } = useAuthStore()

// Component state
const mode = ref<'login' | 'register'>(props.initialMode)
const formData = ref({
  username: '',
  email: '',
  password: '',
})

// Computed
const isFormValid = computed(() => {
  if (mode.value === 'register') {
    return (
      formData.value.username.length > 0 &&
      formData.value.email.length > 0 &&
      formData.value.password.length >= 6
    )
  } else {
    return formData.value.username.length > 0 && formData.value.password.length > 0
  }
})

// Methods
function setMode(newMode: 'login' | 'register') {
  mode.value = newMode
  clearError()
  formData.value = { username: '', email: '', password: '' }
}

function closeModal() {
  emit('close')
  clearError()
  formData.value = { username: '', email: '', password: '' }
}

async function handleSubmit() {
  if (!isFormValid.value) return

  clearError()

  let success = false

  if (mode.value === 'register') {
    success = await register(formData.value.username, formData.value.email, formData.value.password)
  } else {
    success = await login(formData.value.username, formData.value.password)
  }

  if (success) {
    emit('success')
    closeModal()
  }
}

// Watch for modal open/close to reset form
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      mode.value = props.initialMode
      formData.value = { username: '', email: '', password: '' }
      clearError()
    }
  },
)
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 24px 24px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  color: #1f2937;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #6b7280;
}

.auth-tabs {
  display: flex;
  margin: 20px 24px 0;
  border-bottom: 1px solid #e5e7eb;
}

.tab {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab:hover {
  color: #374151;
}

.tab.active {
  color: #10b981;
  border-bottom-color: #10b981;
}

.auth-form {
  padding: 24px;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  border: 1px solid #fecaca;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.form-group input:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.submit-btn {
  width: 100%;
  padding: 12px 24px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
}

.submit-btn:hover:not(:disabled) {
  background: #059669;
}

.submit-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.auth-info {
  padding: 0 24px 24px;
  text-align: center;
}

.auth-info p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

.welcome-info {
  background: #f0fdf4;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.demo-info {
  font-style: italic;
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .modal-content {
    margin: 10px;
    border-radius: 8px;
  }

  .modal-header {
    padding: 20px 20px 0;
  }

  .modal-header h2 {
    font-size: 20px;
  }

  .auth-form {
    padding: 20px;
  }

  .auth-info {
    padding: 0 20px 20px;
  }
}
</style>
