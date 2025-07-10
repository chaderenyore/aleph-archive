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
    if (!requestBody?.uuid) {
      throw createError({
        statusCode: 400,
        statusMessage: "UUID is required",
      })
    }

    console.log("Fetching crawl definition for UUID:", requestBody.uuid)

    const crawlDef = await $fetch(`${baseUrl}/get_crawlDef`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `sid=${sidCookie}`,
      },
      timeout: 15000,
      ignoreHTTPSErrors: true,
      body: { uuid: requestBody.uuid },
    })

    return crawlDef
  } catch (err: any) {
    console.error("Error in get_crawlDef handler:", err)
    
    if (err.statusCode && err.statusMessage) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch crawl definition",
    })
  }
})