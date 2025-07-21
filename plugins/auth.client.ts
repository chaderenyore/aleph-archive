// export default defineNuxtPlugin(async () => {
//   const { checkAuth, startBackgroundRefresh } = useAuth()
  
//   // Check authentication status on app start
//   const isAuthenticated = await checkAuth()
  
//   // Start background refresh if user is authenticated
//   if (isAuthenticated) {
//     startBackgroundRefresh()
//   }
  
//   // Clean up on app unmount
//     window.addEventListener('beforeunload', () => {
//       const { stopBackgroundRefresh } = useAuth()
//       stopBackgroundRefresh()
//     })
// })


import { navigateTo } from "#app"
import { watch } from "vue"

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  // Initialize authentication on app start
  await authStore.initializeAuth()

  // Set up periodic session validation (every 5 minutes)
  let sessionCheckInterval: NodeJS.Timeout | null = null

  const startSessionCheck = () => {
    sessionCheckInterval = setInterval(
      async () => {
        if (authStore.isAuthenticated) {
          try {
            await authStore.fetchUser()
          } catch (error: any) {
            if (error.status === 401) {
              // Session expired, redirect to login
              if (sessionCheckInterval) {
                clearInterval(sessionCheckInterval)
                sessionCheckInterval = null
              }
              await navigateTo("/login")
            }
          }
        }
      },
      5 * 60 * 1000,
    ) // 5 minutes
  }

  // Start session checking if user is authenticated
  if (authStore.isAuthenticated) {
    startSessionCheck()
  }

  // Watch for authentication changes
  watch(
    () => authStore.isAuthenticated,
    (isAuth) => {
      if (isAuth) {
        startSessionCheck()
      } else if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval)
        sessionCheckInterval = null
      }
    },
  )

  // Clean up on app unmount
  if (import.meta.client) {
    window.addEventListener("beforeunload", () => {
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval)
      }
    })
  }
})
