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
      console.warn("Job backup attempted without valid session")
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
    if (!requestBody || !requestBody.uuid) {
      throw createError({
        statusCode: 400,
        statusMessage: "UUID is required for job backup.",
      })
    }

    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(requestBody.uuid)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid UUID format provided.",
      })
    }

    console.log("Initiating backup for job UUID:", requestBody.uuid)

    // Make API request for job backup
    const backupResult = await $fetch(`${baseUrl}/backup_job`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `sid=${sidCookie}`,
      },
      timeout: 60000, // Extended timeout for backup operations (60 seconds)
      ignoreHTTPSErrors: true,
      body: {
        uuid: requestBody.uuid,
      },
    }).catch((fetchError) => {
      console.error("Backup API request failed:", fetchError)

      // Handle different types of fetch errors
      if (fetchError.response) {
        const status = fetchError.response.status
        const statusText = fetchError.response.statusText || "Unknown error"

        switch (status) {
          case 400:
            throw createError({
              statusCode: 400,
              statusMessage: "Invalid backup request. Please check the job UUID and try again.",
            })
          case 401:
            throw createError({
              statusCode: 401,
              statusMessage: "Session expired. Please log in again.",
            })
          case 403:
            throw createError({
              statusCode: 403,
              statusMessage: "You don't have permission to backup jobs.",
            })
          case 404:
            throw createError({
              statusCode: 404,
              statusMessage: "Job not found or backup service unavailable.",
            })
          case 409:
            throw createError({
              statusCode: 409,
              statusMessage: "Job backup is already in progress or completed.",
            })
          case 422:
            throw createError({
              statusCode: 422,
              statusMessage: "Job cannot be backed up in its current state. Ensure all exports are completed first.",
            })
          case 429:
            throw createError({
              statusCode: 429,
              statusMessage: "Too many backup requests. Please wait before trying again.",
            })
          case 500:
            throw createError({
              statusCode: 500,
              statusMessage: "Server error occurred during backup. Please try again later.",
            })
          case 503:
            throw createError({
              statusCode: 503,
              statusMessage: "Backup service is temporarily unavailable. Please try again later.",
            })
          default:
            throw createError({
              statusCode: status,
              statusMessage: `Job backup failed: ${statusText}`,
            })
        }
      } else if (fetchError.code === "TIMEOUT") {
        throw createError({
          statusCode: 408,
          statusMessage: "Backup request timed out. The backup process may still be running in the background.",
        })
      } else if (fetchError.code === "NETWORK_ERROR" || fetchError.code === "ECONNREFUSED") {
        throw createError({
          statusCode: 503,
          statusMessage: "Unable to connect to backup service. Please check your connection and try again later.",
        })
      } else {
        throw createError({
          statusCode: 500,
          statusMessage: "An unexpected error occurred during backup operation.",
        })
      }
    })

    // Validate response
    if (!backupResult) {
      console.error("Backup API returned empty response")
      throw createError({
        statusCode: 500,
        statusMessage: "Backup operation completed but no confirmation was returned.",
      })
    }

    // Log successful backup
    console.log("Job backup completed successfully:", {
      uuid: requestBody.uuid,
      timestamp: new Date().toISOString(),
      result: backupResult,
    })

    return {
      success: true,
      message: "Job backup completed successfully",
      uuid: requestBody.uuid,
      result: backupResult,
    }
  } catch (err: any) {
    // Log the full error for debugging
    console.error("Error in job backup handler:", {
      message: err.message,
      statusCode: err.statusCode,
      statusMessage: err.statusMessage,
      uuid: event.context.requestBody?.uuid,
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
      statusMessage: "An unexpected error occurred during backup. Please try again later.",
    })
  }
})
