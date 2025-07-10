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
      console.warn("Stop job request attempted without valid session")
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

    // Validate required fields
    if (!requestBody || !requestBody.uuids || !Array.isArray(requestBody.uuids)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid request body. Expected { uuids: string[] }",
      })
    }

    if (requestBody.uuids.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "At least one UUID is required to stop jobs.",
      })
    }

    // Validate UUIDs format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    for (const uuid of requestBody.uuids) {
      if (typeof uuid !== 'string' || !uuidRegex.test(uuid)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Invalid UUID format: ${uuid}`,
        })
      }
    }

    const payload = {
      uuids: requestBody.uuids,
    }

    console.log("Stopping jobs with payload:", JSON.stringify(payload, null, 2))

    // Make API request to stop jobs
    const stopResponse = await $fetch(`${baseUrl}/stop_job`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `sid=${sidCookie}`,
      },
      timeout: 15000,
      ignoreHTTPSErrors: true,
      body: payload,
    }).catch((fetchError) => {
      console.error("Stop job API request failed:", fetchError)
      
      // Handle different types of fetch errors
      if (fetchError.response) {
        const status = fetchError.response.status
        const statusText = fetchError.response.statusText || "Unknown error"
        
        switch (status) {
          case 400:
            throw createError({
              statusCode: 400,
              statusMessage: "Invalid request parameters. Please check the job UUIDs and try again.",
            })
          case 401:
            throw createError({
              statusCode: 401,
              statusMessage: "Session expired. Please log in again.",
            })
          case 403:
            throw createError({
              statusCode: 403,
              statusMessage: "You don't have permission to stop these jobs.",
            })
          case 404:
            throw createError({
              statusCode: 404,
              statusMessage: "One or more jobs not found. They may have already completed or been stopped.",
            })
          case 422:
            throw createError({
              statusCode: 422,
              statusMessage: "Request validation failed. Please check the job UUIDs.",
            })
          case 429:
            throw createError({
              statusCode: 429,
              statusMessage: "Too many requests. Please wait before trying again.",
            })
          case 500:
            throw createError({
              statusCode: 500,
              statusMessage: "Server error occurred while stopping jobs. Please try again later.",
            })
          case 503:
            throw createError({
              statusCode: 503,
              statusMessage: "Service temporarily unavailable. Please try again later.",
            })
          default:
            throw createError({
              statusCode: status,
              statusMessage: `Failed to stop jobs: ${statusText}`,
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
          statusMessage: "An unexpected error occurred while stopping jobs.",
        })
      }
    })

    // Validate response
    if (!stopResponse) {
      console.error("API returned empty response")
      throw createError({
        statusCode: 500,
        statusMessage: "No response received from the server.",
      })
    }

    // Validate response structure
    if (!stopResponse.hasOwnProperty("success")) {
      console.warn("API response missing success field")
    }

    // Log successful operation
    const stoppedCount = requestBody.uuids.length
    console.log(`Successfully stopped ${stoppedCount} job(s)`)

    // Return success response with additional metadata
    return {
      success: true,
      message: `Successfully stopped ${stoppedCount} job(s)`,
      stopped_jobs: requestBody.uuids,
      timestamp: new Date().toISOString(),
      ...stopResponse
    }

  } catch (err: any) {
    // Log the full error for debugging
    console.error("Error in stop job handler:", {
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
      statusMessage: "An unexpected error occurred while stopping jobs. Please try again later.",
    })
  }
})