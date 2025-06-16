// Store for caching data and managing intervals
let cachedData: any = null
let lastFetch: number = 0
let refreshInterval: NodeJS.Timeout | null = null

// Function to fetch fresh data
async function fetchTerminatedJobs(sidCookie: string) {
  const baseUrl = process.env.NUXT_PUBLIC_API_URL?.replace(/\/$/, '')
  
  const jobsData = await $fetch(`${baseUrl}/terminated`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `sid=${sidCookie}`
    },
    timeout: 10000,
    ignoreHTTPSErrors: true,
    body: {
      from: 0,
      size: 10
    }
  })
  
  return jobsData
}

// Function to start auto-refresh
function startAutoRefresh(sidCookie: string) {
  // Clear existing interval if any
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  
  // Set up new interval for 30 seconds
  refreshInterval = setInterval(async () => {
    try {
      console.log('Auto-refreshing terminated jobs data...')
      cachedData = await fetchTerminatedJobs(sidCookie)
      lastFetch = Date.now()
    } catch (error) {
      console.error('Error during auto-refresh:', error)
    }
  }, 30000) // 30 seconds
}

export default defineEventHandler(async (event) => {
  try {
    const sidCookie = getCookie(event, 'sid')

    if (!sidCookie) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No session found'
      })
    }

    // Check if we have recent cached data (within 30 seconds)
    const now = Date.now()
    const cacheValid = cachedData && (now - lastFetch) < 30000

    if (!cacheValid) {
      // Fetch fresh data
      cachedData = await fetchTerminatedJobs(sidCookie)
      lastFetch = now
      
      // Start auto-refresh if not already running
      if (!refreshInterval) {
        startAutoRefresh(sidCookie)
      }
    }

    return cachedData
  } catch (err: any) {
    console.error('Error in terminated jobs handler:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Internal Server Error'
    })
  }
})

// Clean up interval when process exits
process.on('exit', () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

process.on('SIGINT', () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  process.exit(0)
})

process.on('SIGTERM', () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  process.exit(0)
})