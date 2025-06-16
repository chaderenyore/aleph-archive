export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    const baseUrl = process.env.NUXT_PUBLIC_API_URL?.replace(/\/$/, '')
    if (!baseUrl) {
      throw createError({
        statusCode: 500,
        message: 'API URL not configured'
      })
    }

    const response = await $fetch.raw(`${baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      timeout: 10000,
      ignoreHTTPSErrors: true,
    })

    // Extract token from Set-Cookie header
    const setCookieHeader = response.headers.get('set-cookie')
    let token = null
    
    if (setCookieHeader) {
      const sidCookie = setCookieHeader.split(';')[0]
      if (sidCookie.startsWith('sid=')) {
        token = sidCookie.split('=')[1]
      }
    }

    if (!token) {
      throw createError({
        statusCode: 401,
        message: 'No authentication token received'
      })
    }

    // Set cookie
    setCookie(event, 'sid', token, {
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    // Get user data
    const userData = await $fetch(`${baseUrl}/user_profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sid=${token}`
      },
      timeout: 10000,
      ignoreHTTPSErrors: true,
    })

    return {
      success: true,
      data: {
        token,
        user: userData
      }
    }

  } catch (error: any) {
    console.error('Login API Error:', error)
    
    throw createError({
      statusCode: error.response?.status || 500,
      statusMessage: error.response?.statusText || 'Authentication failed'
    })
  }
})
