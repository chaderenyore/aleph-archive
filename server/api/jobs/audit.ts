const DEFAULT_PAYLOAD = {
  from: 0,
  size: 5,
}

// Function to fetch fresh data with dynamic payload
async function fetchAuditJobs(sidCookie: string, payload: any) {
  const baseUrl = process.env.NUXT_PUBLIC_API_URL?.replace(/\/$/, "")

  const jobsData = await $fetch(`${baseUrl}/audit/read`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `sid=${sidCookie}`,
    },
    timeout: 10000,
    ignoreHTTPSErrors: true,
    body: payload,
  })

  return jobsData
}

// Function to build payload with conditional sort_dir
function buildPayload(requestBody: any = {}) {
  const payload = { ...DEFAULT_PAYLOAD, ...requestBody }

  // Ensure numeric values are properly typed
  if (payload.from) payload.from = Number.parseInt(payload.from)
  if (payload.size) payload.size = Number.parseInt(payload.size)
  if (payload.action) payload.action = Number.parseInt(payload.action)
  if (payload.sdate) payload.sdate = Number.parseInt(payload.sdate)
  if (payload.edate) payload.edate = Number.parseInt(payload.edate)

  // Only add sort_dir when filters are present
  const hasFilters = payload.action || payload.sdate || payload.edate
  if (hasFilters) {
    payload.sort_dir = "desc"
  }

  return payload
}

export default defineEventHandler(async (event) => {
  try {
    // Get session cookie
    const sidCookie = getCookie(event, "sid")
    if (!sidCookie) {
      throw createError({
        statusCode: 401,
        statusMessage: "No session found",
      })
    }

    // Read and build payload from request body
    const requestBody = event.method === "POST" ? await readBody(event) : {}
    const payload = buildPayload(requestBody)

    // Fetch fresh data
    const jobsData = await fetchAuditJobs(sidCookie, payload)

    return jobsData
  } catch (err: any) {
    console.error("Error in audit jobs handler:", err)
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || "Internal Server Error",
    })
  }
})