
export default defineEventHandler(async (event) => {
  try {
    const baseUrl = process.env.NUXT_PUBLIC_API_URL?.replace(/\/$/, '')
    const sidCookie = getCookie(event, 'sid')
    
    if (!sidCookie) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No session found'
      })
    }

    const userData = await $fetch(`${baseUrl}/user_profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sid=${sidCookie}`
      },
      timeout: 10000,
      ignoreHTTPSErrors: true,
    })

    return userData

  } catch (error: any) {
    if (error.response?.status === 401) {
      deleteCookie(event, 'sid')
    }
    
    throw createError({
      statusCode: error.response?.status || 401,
      statusMessage: 'Session invalid'
    })
  }
})