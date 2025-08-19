export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const baseUrl = process.env.NUXT_PUBLIC_API_URL?.replace(/\/$/, '')
    const sidCookie = getCookie(event, 'sid')
    
    if (sidCookie) {
      await $fetch(`${baseUrl}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `sid=${sidCookie}`
        },
        timeout: 10000,
        body,
        ignoreHTTPSErrors: true,
      })
    }

    deleteCookie(event, 'sid')
    
    return { success: true }

  } catch (error: any) {
    deleteCookie(event, 'sid')
    return { success: true }
  }
})