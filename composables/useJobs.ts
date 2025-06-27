import { $fetch } from "ofetch"

export const useJobs = () => {
  const createJob = async (jobData: any) => {
    try {
      const response = await $fetch("/api/jobs/create", {
        method: "POST",
        body: jobData,
      })

      return {
        success: true,
        data: response,
        error: null,
      }
    } catch (error: any) {
      console.error("Job creation failed:", error)

      return {
        success: false,
        data: null,
        error: {
          statusCode: error.statusCode || 500,
          message: error.statusMessage || "Failed to create job",
        },
      }
    }
  }

  return {
    createJob,
  }
}
