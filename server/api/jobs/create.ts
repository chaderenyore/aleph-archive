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
      console.warn("Job creation attempted without valid session")
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

    // Basic validation of required fields (adjust based on your API requirements)
    if (!requestBody || typeof requestBody !== "object") {
      throw createError({
        statusCode: 400,
        statusMessage: "Request body is required and must be a valid object.",
      })
    }

    console.log("Creating new job with payload:", JSON.stringify(requestBody, null, 2))

    // Make API request with improved error handling
    const newJob = await $fetch(`${baseUrl}/save_run_job`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `sid=${sidCookie}`,
      },
      timeout: 15000, // Increased timeout for job creation
      ignoreHTTPSErrors: true,
      body: requestBody,
    }).catch((fetchError) => {
      console.error("API request failed:", fetchError)

      // Handle different types of fetch errors
      if (fetchError.response) {
        const status = fetchError.response.status
        const statusText = fetchError.response.statusText || "Unknown error"

        switch (status) {
          case 400:
            throw createError({
              statusCode: 400,
              statusMessage: "Invalid job data. Please check your input and try again.",
            })
          case 401:
            throw createError({
              statusCode: 401,
              statusMessage: "Session expired. Please log in again.",
            })
          case 403:
            throw createError({
              statusCode: 403,
              statusMessage: "You don't have permission to create jobs.",
            })
          case 404:
            throw createError({
              statusCode: 404,
              statusMessage: "Job creation endpoint not found. Please contact support.",
            })
          case 409:
            throw createError({
              statusCode: 409,
              statusMessage: "A job with similar parameters already exists.",
            })
          case 422:
            throw createError({
              statusCode: 422,
              statusMessage: "Job data validation failed. Please check your input.",
            })
          case 429:
            throw createError({
              statusCode: 429,
              statusMessage: "Too many requests. Please wait before creating another job.",
            })
          case 500:
            throw createError({
              statusCode: 500,
              statusMessage: "Server error occurred while creating the job. Please try again later.",
            })
          case 503:
            throw createError({
              statusCode: 503,
              statusMessage: "Job creation service is temporarily unavailable. Please try again later.",
            })
          default:
            throw createError({
              statusCode: status,
              statusMessage: `Job creation failed: ${statusText}`,
            })
        }
      } else if (fetchError.code === "TIMEOUT") {
        throw createError({
          statusCode: 408,
          statusMessage: "Job creation request timed out. The job may still be processing.",
        })
      } else if (fetchError.code === "NETWORK_ERROR" || fetchError.code === "ECONNREFUSED") {
        throw createError({
          statusCode: 503,
          statusMessage: "Unable to connect to job creation service. Please try again later.",
        })
      } else {
        throw createError({
          statusCode: 500,
          statusMessage: "An unexpected error occurred while creating the job.",
        })
      }
    })

    // Validate response
    if (!newJob) {
      console.error("API returned empty response")
      throw createError({
        statusCode: 500,
        statusMessage: "Job creation completed but no data was returned.",
      })
    }

    console.log("Job created successfully:", newJob.uuid || "Unknown ID")
    return newJob
  } catch (err: any) {
    // Log the full error for debugging
    console.error("Error in job creation handler:", {
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
