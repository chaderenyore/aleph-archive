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
      console.warn("Job deletion attempted without valid session")
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
    if (!requestBody || !requestBody.state || !requestBody.uuids || !Array.isArray(requestBody.uuids)) {
      throw createError({
        statusCode: 400,
        statusMessage: "State and UUIDs array are required for job deletion.",
      })
    }

    if (requestBody.uuids.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "At least one job UUID must be provided for deletion.",
      })
    }

    console.log("Deleting jobs:", {
      state: requestBody.state,
      count: requestBody.uuids.length,
      uuids: requestBody.uuids
    })

    // Make API request for job deletion
    const deleteResult = await $fetch(`${baseUrl}/remove_job`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `sid=${sidCookie}`,
      },
      timeout: 30000, // Extended timeout for delete operations
      ignoreHTTPSErrors: true,
      body: requestBody,
    }).catch((fetchError) => {
      console.error("Delete API request failed:", fetchError)

      // Handle different types of fetch errors
      if (fetchError.response) {
        const status = fetchError.response.status
        const statusText = fetchError.response.statusText || "Unknown error"

        switch (status) {
          case 400:
            throw createError({
              statusCode: 400,
              statusMessage: "Invalid delete request. Please check the job UUIDs and state.",
            })
          case 401:
            throw createError({
              statusCode: 401,
              statusMessage: "Session expired. Please log in again.",
            })
          case 403:
            throw createError({
              statusCode: 403,
              statusMessage: "You don't have permission to delete jobs.",
            })
          case 404:
            throw createError({
              statusCode: 404,
              statusMessage: "One or more jobs not found or delete endpoint unavailable.",
            })
          case 409:
            throw createError({
              statusCode: 409,
              statusMessage: "Some jobs cannot be deleted in their current state.",
            })
          case 422:
            throw createError({
              statusCode: 422,
              statusMessage: "Job deletion validation failed. Please check your selection.",
            })
          case 500:
            throw createError({
              statusCode: 500,
              statusMessage: "Server error occurred during deletion. Please try again later.",
            })
          case 503:
            throw createError({
              statusCode: 503,
              statusMessage: "Delete service is temporarily unavailable. Please try again later.",
            })
          default:
            throw createError({
              statusCode: status,
              statusMessage: `Job deletion failed: ${statusText}`,
            })
        }
      } else if (fetchError.code === "TIMEOUT") {
        throw createError({
          statusCode: 408,
          statusMessage: "Delete request timed out. Some jobs may have been deleted.",
        })
      } else if (fetchError.code === "NETWORK_ERROR" || fetchError.code === "ECONNREFUSED") {
        throw createError({
          statusCode: 503,
          statusMessage: "Unable to connect to delete service. Please try again later.",
        })
      } else {
        throw createError({
          statusCode: 500,
          statusMessage: "An unexpected error occurred during deletion.",
        })
      }
    })

    // Validate response
    if (!deleteResult) {
      console.error("Delete API returned empty response")
      throw createError({
        statusCode: 500,
        statusMessage: "Deletion completed but no confirmation was returned.",
      })
    }

    console.log("Jobs deleted successfully:", {
      count: requestBody.uuids.length,
      result: deleteResult
    })
    
    return deleteResult
  } catch (err: any) {
    // Log the full error for debugging
    console.error("Error in job deletion handler:", {
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
      statusMessage: "An unexpected error occurred during deletion. Please try again later.",
    })
  }
})
