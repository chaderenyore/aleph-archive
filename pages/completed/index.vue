<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {watchEffect, watch, onMounted, onUnmounted } from "vue";

// Fetch data using useAsyncData with auto-refresh
const { data: terminatedJobs, pending, error, refresh } = await useAsyncData(
  'terminated-jobs', 
  () => $fetch('/api/jobs/terminated'),
  {
    // Refresh data every 30 seconds on client side
    server: true,
    client: true,
    default: () => null,
    refreshCookie: 'sid' // Refresh when session cookie changes
  }
)

// Log data to console whenever it changes
watchEffect(() => {
  if (terminatedJobs.value) {
    console.log('Terminated jobs data updated:', terminatedJobs.value)
  }
})

// Set up client-side auto-refresh interval
let refreshIntervalId: NodeJS.Timeout | null = null

onMounted(() => {
  // Set up client-side refresh every 30 seconds
  refreshIntervalId = setInterval(async () => {
    console.log('Client-side refresh triggered')
    await refresh()
  }, 30000)
})

onUnmounted(() => {
  // Clean up interval when component is unmounted
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId)
  }
})

// Watch for data changes and handle errors
watch(error, (newError) => {
  if (newError) {
    console.error('Error fetching terminated jobs:', newError)
  }
})

// Watch for pending state changes
watch(pending, (isPending) => {
  console.log('Loading state:', isPending ? 'Loading...' : 'Loaded')
})

// Manual refresh function (you can call this from UI if needed)
const manualRefresh = async () => {
  console.log('Manual refresh triggered')
  await refresh()
}

// Reactive computed property to process the data
const processedJobs = computed(() => {
  if (!terminatedJobs.value) return []
  
  // Your API returns: { count: {...}, data: [...], success: true, total: 3 }
  // We need to extract the 'data' array and format it for the table
  const jobsArray = terminatedJobs.value.data || []
  
  return jobsArray.map(job => ({
    // Use UUID as unique identifier
    id: job.uuid,
    
    // Format job name as "invoice" (or you could use uuid)
    invoice: job.name || `JOB-${job.uuid?.slice(0, 8)}`,
    
    // Status based on stop_reason and other indicators
    status: job.stop_reason === 'normal' ? 'Completed' : 
            job.stop_reason ? job.stop_reason.toUpperCase() : 'Unknown',
    
    // Method could be based on template or agent
    method: job.template === 0 ? 'Standard Template' : `Template ${job.template}`,
    
    // Amount could be based on data size, URLs processed, etc.
    amount: `${job.progress?.total_done_urls || 0} URLs`,
    
    // Additional useful data for display
    agent: job.agent,
    url: job.url,
    createdDate: new Date(job.created_date * 1000).toLocaleDateString(),
    terminatedDate: job.terminatedDate ? new Date(job.terminatedDate * 1000).toLocaleDateString() : 'N/A',
    totalUrls: job.progress?.total_urls || 0,
    completedUrls: job.progress?.total_done_urls || 0,
    dataSize: job.progress?.total_data_size ? `${(job.progress.total_data_size / 1024 / 1024).toFixed(2)} MB` : 'N/A',
    maxDepth: job.depth?.max_depth || 0,
    currentDepth: job.depth?.current_depth || 0,
    runningTime: job.running_time ? new Date(job.running_time * 1000).toLocaleString() : 'N/A'
  }))
})
</script>

<template>
  <div class="-m-4 lg:-m-6">
    <!-- Loading indicator -->
    <div v-if="pending" class="p-4 text-center">
      Loading terminated jobs...
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="p-4 text-center text-red-500">
      Error loading data: {{ error }}
      <button @click="manualRefresh" class="ml-2 px-3 py-1 bg-blue-500 text-white rounded">
        Retry
      </button>
    </div>
    
    <!-- Data table -->
    <div v-else>
      <Table>
        <TableCaption>
          Successfully Terminated Web Archiving Jobs
          <span class="text-sm text-gray-500">
            ({{ processedJobs.length }} jobs, auto-refreshes every 30s)
          </span>
          <div class="text-xs text-gray-400 mt-1" v-if="terminatedJobs?.total">
            Total in system: {{ terminatedJobs.total }} | 
            Terminated: {{ terminatedJobs.count?.terminated || 0 }} | 
            Running: {{ terminatedJobs.count?.running || 0 }} | 
            Pending: {{ terminatedJobs.count?.pending || 0 }}
          </div>
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[200px]">
              Job Name
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>URLs Processed</TableHead>
            <TableHead>Data Size</TableHead>
            <TableHead>Terminated Date</TableHead>
            <TableHead class="w-[300px]">
              URL
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- No jobs found -->
          <TableRow v-if="processedJobs.length === 0">
            <TableCell colspan="7" class="text-center text-gray-500">
              No terminated jobs found
            </TableCell>
          </TableRow>
          
          <!-- Actual job data -->
          <TableRow v-for="job in processedJobs" :key="job.id">
            <TableCell class="font-medium">
              <div>
                <div class="font-semibold">{{ job.invoice }}</div>
                <div class="text-sm text-gray-500">{{ job.id?.slice(0, 8) }}...</div>
              </div>
            </TableCell>
            <TableCell>
              <span 
                :class="{
                  'bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm': job.status === 'Completed',
                  'bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm': job.status !== 'Completed'
                }"
              >
                {{ job.status }}
              </span>
            </TableCell>
            <TableCell>{{ job.agent }}</TableCell>
            <TableCell>
              <div>
                <div>{{ job.completedUrls }} / {{ job.totalUrls }}</div>
                <div class="text-sm text-gray-500">
                  Depth: {{ job.currentDepth }}/{{ job.maxDepth }}
                </div>
              </div>
            </TableCell>
            <TableCell>{{ job.dataSize }}</TableCell>
            <TableCell>{{ job.terminatedDate }}</TableCell>
            <TableCell class="max-w-[300px]">
              <a 
                :href="job.url" 
                target="_blank" 
                class="text-blue-600 hover:text-blue-800 underline truncate block"
              >
                {{ job.url }}
              </a>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      
      <!-- Manual refresh button for testing -->
      <div class="mt-4 text-center">
        <button 
          @click="manualRefresh" 
          :disabled="pending"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {{ pending ? 'Refreshing...' : 'Manual Refresh' }}
        </button>
      </div>
    </div>
  </div>
</template>