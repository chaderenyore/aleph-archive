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
      console.warn("Clone job request attempted without valid session")
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

    // Validate required UUID field
    if (!requestBody?.uuid) {
      throw createError({
        statusCode: 400,
        statusMessage: "UUID is required to clone a job.",
      })
    }

    console.log("Cloning job with UUID:", requestBody.uuid)

    // Make API request to clone the job
    const result = await $fetch(`${baseUrl}/clone_job`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `sid=${sidCookie}`,
      },
      timeout: 15000,
      ignoreHTTPSErrors: true,
      body: { uuid: requestBody.uuid },
    }).catch((fetchError) => {
      console.error("Clone job API request failed:", fetchError)

      // Handle different types of fetch errors
      if (fetchError.response) {
        const status = fetchError.response.status
        const statusText = fetchError.response.statusText || "Unknown error"

        switch (status) {
          case 400:
            throw createError({
              statusCode: 400,
              statusMessage: "Invalid job UUID or job cannot be cloned.",
            })
          case 401:
            throw createError({
              statusCode: 401,
              statusMessage: "Session expired. Please log in again.",
            })
          case 403:
            throw createError({
              statusCode: 403,
              statusMessage: "You don't have permission to clone this job.",
            })
          case 404:
            throw createError({
              statusCode: 404,
              statusMessage: "Job not found. It may have been deleted.",
            })
          case 409:
            throw createError({
              statusCode: 409,
              statusMessage: "A job with similar configuration already exists.",
            })
          case 422:
            throw createError({
              statusCode: 422,
              statusMessage: "Job validation failed. Cannot clone this job.",
            })
          case 429:
            throw createError({
              statusCode: 429,
              statusMessage: "Too many requests. Please wait before trying again.",
            })
          case 500:
            throw createError({
              statusCode: 500,
              statusMessage: "Server error occurred while cloning the job. Please try again later.",
            })
          case 503:
            throw createError({
              statusCode: 503,
              statusMessage: "Job service is temporarily unavailable. Please try again later.",
            })
          default:
            throw createError({
              statusCode: status,
              statusMessage: `Failed to clone job: ${statusText}`,
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
          statusMessage: "Unable to connect to the job service. Please check your connection and try again.",
        })
      } else {
        throw createError({
          statusCode: 500,
          statusMessage: "An unexpected error occurred while cloning the job.",
        })
      }
    })

    // Validate response
    if (!result) {
      console.error("API returned empty response")
      throw createError({
        statusCode: 500,
        statusMessage: "No response received from the job service.",
      })
    }

    console.log(`Successfully cloned job with UUID: ${requestBody.uuid}`)
    return result
  } catch (err: any) {
    // Log the full error for debugging
    console.error("Error in clone job handler:", {
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