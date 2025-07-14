import { defineEventHandler, createError, getCookie, getQuery, setHeader } from "h3"

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const uuid = query.uuid as string
  const type = query.type as string

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "UUID is required",
    })
  }

  if (!type) {
    throw createError({
      statusCode: 400,
      statusMessage: "Type is required",
    })
  }

  // Validate type parameter
  const validTypes = ["xlsx", "csv", "spc", "sql"]
  if (!validTypes.includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
    })
  }

  const token = getCookie(event, "auth-token")

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    })
  }

  const apiUrl = process.env.API_URL
  const endpoint = `${apiUrl}/download?uuid=${uuid}&type=${type}`

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      console.error("API Response Error:", response.status, response.statusText)
      try {
        const errorBody = await response.json()
        console.error("API Error Body:", errorBody)
      } catch (jsonError) {
        console.error("Error parsing JSON error body:", jsonError)
      }

      throw createError({
        statusCode: response.status,
        statusMessage: `Failed to download file: ${response.statusText}`,
      })
    }

    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Set appropriate content type based on file type
    const contentTypes = {
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      csv: "text/csv",
      spc: "application/octet-stream",
      sql: "application/x-sqlite3",
    }

    const contentType = contentTypes[type as keyof typeof contentTypes] || "application/octet-stream"
    setHeader(event, "Content-Type", contentType)

    // Set appropriate file extension for download
    const extensions = {
      xlsx: "xlsx",
      csv: "csv",
      spc: "spc",
      sql: "sqlite3",
    }

    const extension = extensions[type as keyof typeof extensions]
    const filename = `job-${uuid.substring(0, 8)}.${extension}`

    setHeader(event, "Content-Disposition", `attachment; filename="${filename}"`)
    setHeader(event, "Content-Length", buffer.length.toString())

    return buffer
  } catch (error: any) {
    console.error("Error during file download:", error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to download file: ${error.message}`,
    })
  }
})
