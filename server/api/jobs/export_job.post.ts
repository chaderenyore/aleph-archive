import { defineEventHandler, createError, getCookie, getQuery, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const jobId = getQuery(event).jobId as string

  if (!jobId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Job ID is required',
    })
  }

  const token = getCookie(event, 'auth-token')

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const apiUrl = process.env.API_URL
  const endpoint = `${apiUrl}/jobs/${jobId}/export`

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      console.error('API Response Error:', response.status, response.statusText)
      try {
        const errorBody = await response.json()
        console.error('API Error Body:', errorBody)
      } catch (jsonError) {
        console.error('Error parsing JSON error body:', jsonError)
      }

      throw createError({
        statusCode: response.status,
        statusMessage: `Failed to fetch job export: ${response.statusText}`,
      })
    }

    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    setHeader(event, 'Content-Type', 'application/octet-stream')
    const contentDisposition = response.headers.get('Content-Disposition') || 'attachment; filename="job-export.ken"'
    setHeader(event, 'Content-Disposition', contentDisposition)
    setHeader(event, 'Content-Length', buffer.length.toString())

    return buffer
  } catch (error: any) {
    console.error('Error during job export:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to export job: ${error.message}`,
    })
  }
})