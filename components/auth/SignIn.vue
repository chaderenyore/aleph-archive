<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="space-y-2">
      <Label for="login">Username or Email</Label>
      <Input
        id="login"
        v-model="form.login"
        type="text"
        placeholder="Enter your username or email"
        required
        :disabled="authStore.isLoading"
        autocomplete="username"
      />
    </div>
    
    <div class="space-y-2">
      <Label for="password">Password</Label>
      <Input
        id="password"
        v-model="form.password"
        type="password"
        placeholder="Enter your password"
        required
        :disabled="authStore.isLoading"
        autocomplete="current-password"
      />
    </div>

    <!-- Error Message -->
    <div v-if="authStore.authError" class="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
      {{ authStore.authError }}
    </div>

    <Button 
      type="submit" 
      class="w-full" 
      :disabled="authStore.isLoading || !form.login || !form.password"
    >
      <Loader2 v-if="authStore.isLoading" class="mr-2 h-4 w-4 animate-spin" />
      {{ authStore.isLoading ? 'Signing in...' : 'Sign in' }}
    </Button>
  </form>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { toast } from 'vue-sonner'
import { Loader2 } from 'lucide-vue-next'
import { reactive, onMounted, watch } from 'vue'

const authStore = useAuthStore()
const route = useRoute()

const form = reactive({
  login: '',
  password: ''
})

// Clear any previous errors when component mounts
onMounted(() => {
  authStore.clearError()
})

// Clear error when user starts typing
watch(() => [form.login, form.password], () => {
  if (authStore.authError) {
    authStore.clearError()
  }
})

const handleSubmit = async () => {
  try {
    await authStore.login({
      login: form.login,
      password: form.password
    })

    // Success - redirect to intended page or home
    const redirectTo = route.query.redirect as string || '/'
    toast.success('Welcome back!')
    await navigateTo(redirectTo)
    
  } catch (error: any) {
    // Error is already handled in the store
    console.error('Login failed:', error)
  }
}
</script>
