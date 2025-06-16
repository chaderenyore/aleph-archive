export default defineNuxtPlugin(async () => {
  const { checkAuth, startBackgroundRefresh } = useAuth()
  
  // Check authentication status on app start
  const isAuthenticated = await checkAuth()
  
  // Start background refresh if user is authenticated
  if (isAuthenticated) {
    startBackgroundRefresh()
  }
  
  // Clean up on app unmount
    window.addEventListener('beforeunload', () => {
      const { stopBackgroundRefresh } = useAuth()
      stopBackgroundRefresh()
    })
})