export default defineNuxtRouteMiddleware(async (to) => {
  const { user, checkAuth } = useAuth()
  
  // Public routes that don't require auth
  const publicRoutes = ['/login']
  
  // If user is authenticated and trying to access login page, redirect to home
  if (user.value && publicRoutes.includes(to.path)) {
    return navigateTo('/')
  }

  // For protected routes, check authentication (fast - no API call if user exists)
  if (!publicRoutes.includes(to.path)) {
    // Fast check - only calls API if no user data exists
    const isAuthenticated = await checkAuth()
    
    if (!isAuthenticated) {
      return navigateTo('/login')
    }
  }
})