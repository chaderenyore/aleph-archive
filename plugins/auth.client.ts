// plugins/auth.client.ts
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  
  // Only run on client-side
  if (import.meta.client) {
    // If we have persisted user data but haven't validated session yet, do it in background
    if (authStore.user && !authStore.isInitialized) {
      // Don't block page load - validate in background
      authStore.initializeAuth().catch(() => {
        // Error handling is done in the store
      })
    } else if (!authStore.user && !authStore.isInitialized) {
      // If no persisted user, quickly check session without blocking
      authStore.initializeAuth().catch(() => {
        // Error handling is done in the store
      })
    }
  }
})