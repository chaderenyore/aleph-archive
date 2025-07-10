export default defineEventHandler(async (event) => {
  const baseUrl = process.env.NUXT_PUBLIC_API_URL?.replace(/\/$/, "")

  // Validate environment configuration
  if (!baseUrl) {
    console.error("NUXT_PUBLIC_API_URL environment variable is not configured")
    throw createError({
      statusCode: 500,
      statusMessage: "Server configuration error",
    })
  }

  try {
    // Validate HTTP method
    if (event.method !== "POST") {
      throw createError({
        statusCode: 405,
        statusMessage: "Method not allowed. Only POST requests are accepted.",
      })
    }

    // Get and validate session cookie
    const sidCookie = getCookie(event, "sid")
    if (!sidCookie) {
      console.warn("Running jobs request attempted without valid session")
      throw createError({
        statusCode: 401,
        statusMessage: "Authentication required. Please log in to continue.",
      })
    }

    // Read and validate request body
    let requestBody
    try {
      requestBody = await readBody(event)
    } catch (bodyError) {
      console.error("Failed to parse request body:", bodyError)
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid request body. Please check your data format.",
      })
    }

    // Set default values if not provided
    const payload = {
      ...requestBody,
    }

    console.log("Fetching Running jobs with payload:", JSON.stringify(payload, null, 2))

    // Make API request to get Running jobs
    const runningJobs = await $fetch(`${baseUrl}/running`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `sid=${sidCookie}`,
      },
      timeout: 15000,
      ignoreHTTPSErrors: true,
      body: payload,
    }).catch((fetchError) => {
      console.error("Running jobs API request failed:", fetchError)

      // Handle different types of fetch errors
      if (fetchError.response) {
        const status = fetchError.response.status
        const statusText = fetchError.response.statusText || "Unknown error"

        switch (status) {
          case 400:
            throw createError({
              statusCode: 400,
              statusMessage: "Invalid request parameters. Please check your filters and try again.",
            })
          case 401:
            throw createError({
              statusCode: 401,
              statusMessage: "Session expired. Please log in again.",
            })
          case 403:
            throw createError({
              statusCode: 403,
              statusMessage: "You don't have permission to view Running jobs.",
            })
          case 404:
            throw createError({
              statusCode: 404,
              statusMessage: "Running jobs endpoint not found. Please contact support.",
            })
          case 422:
            throw createError({
              statusCode: 422,
              statusMessage: "Request validation failed. Please check your parameters.",
            })
          case 429:
            throw createError({
              statusCode: 429,
              statusMessage: "Too many requests. Please wait before trying again.",
            })
          case 500:
            throw createError({
              statusCode: 500,
              statusMessage: "Server error occurred while fetching jobs. Please try again later.",
            })
          case 503:
            throw createError({
              statusCode: 503,
              statusMessage: "Service temporarily unavailable. Please try again later.",
            })
          default:
            throw createError({
              statusCode: status,
              statusMessage: `Failed to fetch running jobs: ${statusText}`,
            })
        }
      } else if (fetchError.code === "TIMEOUT") {
        throw createError({
          statusCode: 408,
          statusMessage: "Request timed out. Please try again.",
        })
      } else if (fetchError.code === "NETWORK_ERROR" || fetchError.code === "ECONNREFUSED") {
        throw createError({
          statusCode: 503,
          statusMessage: "Unable to connect to the service. Please check your connection and try again.",
        })
      } else {
        throw createError({
          statusCode: 500,
          statusMessage: "An unexpected error occurred while fetching running jobs.",
        })
      }
    })

    // Validate response
    if (!runningJobs) {
      console.error("API returned empty response")
      throw createError({
        statusCode: 500,
        statusMessage: "No data received from the server.",
      })
    }

    // Validate response structure
    if (!runningJobs.hasOwnProperty("success")) {
      console.warn("API response missing success field")
    }

    if (!runningJobs.pending || !Array.isArray(runningJobs.pending)) {
      console.warn("API response missing or invalid pending array")
      runningJobs.pending = []
    }

    if (!runningJobs.count) {
      console.warn("API response missing count information")
      runningJobs.count = { terminated: 0, running: 0, pending: 0 }
    }

    console.log(`Successfully fetched ${runningJobs.pending.length} pending jobs`)
    return runningJobs
  } catch (err: any) {
    // Log the full error for debugging
    console.error("Error in Running jobs handler:", {
      message: err.message,
      statusCode: err.statusCode,
      statusMessage: err.statusMessage,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    })

    // If it's already a createError, re-throw it
    if (err.statusCode && err.statusMessage) {
      throw err
    }

    // Handle unexpected errors
    throw createError({
      statusCode: 500,
      statusMessage: "An unexpected error occurred. Please try again later.",
    })
  }
})