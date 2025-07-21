// export default defineNuxtRouteMiddleware(async (to) => {
//   const { user, checkAuth } = useAuth()
  
//   // Public routes that don't require auth
//   const publicRoutes = ['/login']
  
//   // If user is authenticated and trying to access login page, redirect to home
//   if (user.value && publicRoutes.includes(to.path)) {
//     return navigateTo('/')
//   }

//   // For protected routes, check authentication (fast - no API call if user exists)
//   if (!publicRoutes.includes(to.path)) {
//     // Fast check - only calls API if no user data exists
//     const isAuthenticated = await checkAuth()
    
//     if (!isAuthenticated) {
//       return navigateTo('/login')
//     }
//   }
// })


export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware on server-side rendering
  if (import.meta.client) return;

  const authStore = useAuthStore()

  // Public routes that don't require authentication
  const publicRoutes = ["/login"]
  const isPublicRoute = publicRoutes.includes(to.path)

  // Wait for auth initialization if not already done
  if (!authStore.isInitialized) {
    await authStore.initializeAuth()
  }

  // If user is authenticated and trying to access login page, redirect to home
  if (authStore.isAuthenticated && isPublicRoute) {
    return navigateTo("/")
  }

  // If user is not authenticated and trying to access protected route
  if (!authStore.isAuthenticated && !isPublicRoute) {
    // Save the intended destination
    const redirectQuery = to.path !== "/" ? `?redirect=${encodeURIComponent(to.fullPath)}` : ""
    return navigateTo(`/login${redirectQuery}`)
  }
})
