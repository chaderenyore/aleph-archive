export default defineEventHandler(async (event) => {
  const baseUrl = process.env.NUXT_PUBLIC_API_URL?.replace(/\/$/, "")

  if (!baseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "Server configuration error",
    })
  }

  try {
    if (event.method !== "POST") {
      throw createError({
        statusCode: 405,
        statusMessage: "Method not allowed. Only POST requests are accepted.",
      })
    }

    const sidCookie = getCookie(event, "sid")
    if (!sidCookie) {
      throw createError({
        statusCode: 401,
        statusMessage: "Authentication required. Please log in to continue.",
      })
    }

    const requestBody = await readBody(event)
    console.log("Editing job with payload:", JSON.stringify(requestBody, null, 2))

    const result = await $fetch(`${baseUrl}/edit_job`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `sid=${sidCookie}`,
      },
      timeout: 15000,
      ignoreHTTPSErrors: true,
      body: requestBody,
    })

    return result
  } catch (err: any) {
    console.error("Error in edit_job handler:", err)
    
    if (err.statusCode && err.statusMessage) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to edit job",
    })
  }
})