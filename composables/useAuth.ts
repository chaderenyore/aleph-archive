export const useAuth = () => {
  const user = useState<any>('auth.user', () => null)
  const loading = useState('auth.loading', () => false)
  const error = useState<string | null>('auth.error', () => null)

  let refreshInterval: NodeJS.Timeout | null = null

  const login = async (credentials: { login: string; password: any }) => {
    try {
      loading.value = true
      error.value = null

      const { data } = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials
      })

      // Store user data
      user.value = data.user
      
      // Start background refresh
      startBackgroundRefresh()
      
      // Redirect to intended page or dashboard
      await navigateTo('/')
      
      return data
    } catch (err: any) {
      error.value = err.data?.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      loading.value = true
      
      // Stop background refresh
      stopBackgroundRefresh()
      
      await $fetch('/api/auth/logout', {
        method: 'POST'
      })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
      loading.value = false
      await navigateTo('/login')
    }
  }

  const fetchUser = async () => {
    try {
      const userData = await $fetch('/api/auth/user_profile', {
        method: 'POST'
      })
      
      user.value = userData
      return userData
    } catch (err: any) {
      if (err.status === 401) {
        user.value = null
        stopBackgroundRefresh()
        // Redirect to login if session expired
        await navigateTo('/login')
      }
      throw err
    }
  }

  const checkAuth = async () => {
    // Check if we have a session cookie
    const sidCookie = useCookie('sid')
    
    if (!sidCookie.value) {
      user.value = null
      return false
    }

    // If we already have user data, return true (no API call)
    if (user.value) {
      return true
    }

    // Only fetch user if we don't have data yet
    try {
      await fetchUser()
      return true
    } catch (err) {
      user.value = null
      return false
    }
  }

  const startBackgroundRefresh = () => {
    // Clear any existing interval
    stopBackgroundRefresh()
    
    // Set up interval to refresh user data every 2 minutes
    refreshInterval = setInterval(async () => {
      try {
        await fetchUser()
      } catch (err) {
        console.error('Background user refresh failed:', err)
        // If refresh fails, user will be redirected to login by fetchUser
      }
    }, 2 * 60 * 1000) // 2 minutes
  }

  const stopBackgroundRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    login,
    logout,
    fetchUser,
    checkAuth,
    startBackgroundRefresh,
    stopBackgroundRefresh
  }
}

