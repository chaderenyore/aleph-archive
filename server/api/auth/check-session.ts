export default defineEventHandler(async (event) => {
  try {
    const sidCookie = getCookie(event, "sid")

    if (!sidCookie) {
      throw createError({
        statusCode: 401,
        statusMessage: "No session found",
      })
    }

    // Just return success if cookie exists
    // The actual user validation will happen in user_profile
    return {
      success: true,
      data: { hasSession: true },
    }
  } catch (error: any) {
    throw createError({
      statusCode: 401,
      statusMessage: "No valid session",
    })
  }
})
