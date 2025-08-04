// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware during SSR to prevent hydration mismatches
  if (import.meta.server) return

  const authStore = useAuthStore()

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/forgot-password"]
  const isPublicRoute = publicRoutes.includes(to.path)

  // For client-side navigation, check if we have persisted user data first
  if (import.meta.client) {
    // If we have persisted user data and going to public route, redirect immediately
    if (authStore.user && isPublicRoute) {
      const redirectTo = to.query.redirect as string
      return navigateTo(redirectTo || "/")
    }

    // If no persisted user data and going to protected route, we need to initialize
    if (!authStore.user && !isPublicRoute) {
      // Initialize auth to check server session
      if (!authStore.isInitialized) {
        await authStore.initializeAuth()
      }

      // After initialization, if still not authenticated, redirect to login
      if (!authStore.isAuthenticated) {
        const redirectQuery = to.path !== "/" ? `?redirect=${encodeURIComponent(to.fullPath)}` : ""
        return navigateTo(`/login${redirectQuery}`)
      }
    }

    // If we have persisted user but haven't initialized server state yet, do it in background
    if (authStore.user && !authStore.isInitialized) {
      // Don't await this - let the user navigate and validate in background
      authStore.initializeAuth().catch(() => {
        // If background validation fails, user will be redirected by the store
      })
    }
  }
})