import { toast } from "vue-sonner"
import { defineStore } from 'pinia'

interface User {
  success: boolean
  login: string
  name: string
  nick: string
  conn_type: string
  role: string
}

interface LoginResponse {
  success: boolean
  data: {
    token: string
    user: User
  }
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  isInitialized: boolean
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    loading: false,
    error: null,
    isInitialized: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isLoading: (state) => state.loading,
    currentUser: (state) => state.user,
    authError: (state) => state.error,
  },

  actions: {
    setUser(user: User | null) {
      this.user = user
    },

    setLoading(loading: boolean) {
      this.loading = loading
    },

    setError(error: string | null) {
      this.error = error
    },

    setInitialized(initialized: boolean) {
      this.isInitialized = initialized
    },

    async login(credentials: { login: string; password: string }) {
      try {
        this.setLoading(true)
        this.setError(null)

        const response: LoginResponse = await $fetch("/api/auth/login", {
          method: "POST",
          body: credentials,
        })

        if (response.success && response.data.user) {
          this.setUser(response.data.user)
          this.setInitialized(true)
          return response
        } else {
          throw new Error("Invalid login response")
        }
      } catch (error: any) {
        const errorMessage = error.data?.message || error.message || "Login failed. Please try again."
        this.setError(errorMessage)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async logout() {
      try {
        this.setLoading(true)

        await $fetch("/api/auth/logout", {
          method: "POST",
        })
      } catch (error) {
        console.error("Logout error:", error)
      } finally {
        this.setUser(null)
        this.setLoading(false)
        this.setError(null)
        this.setInitialized(false)
        await navigateTo("/login")
      }
    },

    async fetchUser() {
      try {
        const userData = await $fetch("/api/auth/user_profile", {
          method: "POST",
        })

        this.setUser(userData)
        return userData
      } catch (error: any) {
        if (error.status === 401) {
          this.setUser(null)
          this.setInitialized(true)
          
          // Only show toast if we're on client and user was previously authenticated
          if (import.meta.client && this.user) {
            toast.error("Your session has expired. Please log in again.")
          }
          
          // Get current route for redirect
          const router = useRouter()
          const currentRoute = router.currentRoute.value
          
          // Only redirect if not already on login page
          if (currentRoute.path !== '/login') {
            const returnUrl = currentRoute.path !== '/login' ? currentRoute.fullPath : '/'
            await navigateTo(`/login?redirect=${encodeURIComponent(returnUrl)}`)
          }
        }
        throw error
      }
    },

    async initializeAuth() {
      // Prevent multiple simultaneous initializations
      if (this.isInitialized) return this.isAuthenticated

      // If we already have user data from persistence, validate it
      if (this.user) {
        try {
          await this.fetchUser()
          this.setInitialized(true)
          return true
        } catch (error) {
          // fetchUser handles session expiry and redirects
          return false
        }
      }

      try {
        this.setLoading(true)

        // Check if we have a session cookie without fetching user data yet
        const sessionCheck = await $fetch("/api/auth/check-session", {
          method: "GET",
        }).catch(() => ({ hasSession: false }))

        if (!sessionCheck.hasSession) {
          this.setUser(null)
          this.setInitialized(true)
          return false
        }

        // We have a session, now fetch user data
        await this.fetchUser()
        this.setInitialized(true)
        return true
      } catch (error) {
        this.setUser(null)
        this.setInitialized(true)
        return false
      } finally {
        this.setLoading(false)
      }
    },

    clearError() {
      this.setError(null)
    },
  },

  persist: {
    pick: ["user"], // Only persist user data, not loading states
  },
})