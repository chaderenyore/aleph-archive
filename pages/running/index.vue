<template>
  <TooltipProvider>
    <div class="min-h-screen bg-background">
      <!-- Header Section -->
      <section class="bg-gradient-to-r from-sidebar to-sidebar/95 backdrop-blur-sm border-b border-border/50 shadow-sm mb-6">
        <div class="px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <!-- Page Title Section -->
            <div class="page-title space-y-1">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-primary/10 rounded-lg">
                  <Play class="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 class="text-xl sm:text-2xl font-bold text-sidebar-foreground tracking-tight">
                    Running Jobs
                  </h1>
                  <p class="text-xs sm:text-sm text-sidebar-foreground/70">
                    Monitor and manage currently running jobs
                  </p>
                </div>
              </div>
            </div>

            <!-- Stats Cards Section -->
            <div class="jobs-data">
              <div class="grid grid-cols-3 gap-2 sm:gap-3">
                <!-- Running Jobs -->
                <div class="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 rounded-lg p-2 sm:p-3 transition-all duration-200 hover:shadow-md hover:scale-105">
                  <div class="flex flex-col items-center text-center space-y-1">
                    <div class="p-1.5 bg-blue-500/10 rounded-md">
                      <Play class="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p class="text-sm sm:text-lg font-bold text-blue-700 dark:text-blue-300">
                        {{ runningJobs?.count?.running || 0 }}
                      </p>
                      <p class="text-[10px] sm:text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">
                        Running
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Terminated Jobs -->
                <div class="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30 border border-green-200/50 dark:border-green-800/50 rounded-lg p-2 sm:p-3 transition-all duration-200 hover:shadow-md hover:scale-105">
                  <div class="flex flex-col items-center text-center space-y-1">
                    <div class="p-1.5 bg-green-500/10 rounded-md">
                      <CircleCheckBig class="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p class="text-sm sm:text-lg font-bold text-green-700 dark:text-green-300">
                        {{ runningJobs?.count?.terminated || 0 }}
                      </p>
                      <p class="text-[10px] sm:text-xs text-green-600/80 dark:text-green-400/80 font-medium">
                        Completed
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Pending Jobs -->
                <div class="group relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 border border-amber-200/50 dark:border-amber-800/50 rounded-lg p-2 sm:p-3 transition-all duration-200 hover:shadow-md hover:scale-105">
                  <div class="flex flex-col items-center text-center space-y-1">
                    <div class="p-1.5 bg-amber-500/10 rounded-md">
                      <Clock class="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p class="text-sm sm:text-lg font-bold text-amber-700 dark:text-amber-300">
                        {{ runningJobs?.count?.pending || 0 }}
                      </p>
                      <p class="text-[10px] sm:text-xs text-amber-600/80 dark:text-amber-400/80 font-medium">
                        Pending
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Error State -->
      <div v-if="error" class="px-4 sm:px-6 lg:px-8 mb-6">
        <div class="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div class="flex items-center gap-2 text-destructive">
            <AlertCircle class="h-5 w-5" />
            <p class="font-medium">Error loading running jobs</p>
          </div>
          <p class="text-sm text-destructive/80 mt-1">{{ error.message || 'Failed to load data' }}</p>
          <Button @click="refresh" variant="outline" size="sm" class="mt-3">
            <RefreshCw class="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent class="p-8">
            <div class="flex items-center justify-center space-x-2">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p class="text-muted-foreground">Loading running jobs...</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Main Content -->
      <div v-else-if="runningJobs" class="px-4 sm:px-6 lg:px-8 pb-8">
        <!-- Refresh Button -->
        <div class="flex justify-start mb-6">
          <Button @click="refresh" variant="outline" size="sm" :disabled="pending">
            <RefreshCw class="h-4 w-4 mr-2" :class="{ 'animate-spin': pending }" />
            Refresh Data
          </Button>
        </div>

        <!-- Running Jobs Table -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Play class="h-5 w-5" />
              Currently Running Jobs
            </CardTitle>
            <CardDescription>
              Monitor progress and manage running jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <!-- Table Controls -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <!-- Rows per page selector -->
              <div class="flex items-center gap-2">
                <Label class="text-sm">Show</Label>
                <Select v-model="pageSize" @update:model-value="handlePageSizeChange">
                  <SelectTrigger class="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <Label class="text-sm">entries</Label>
              </div>

              <!-- Mass Actions -->
              <div v-if="selectedJobs.length > 0" class="flex items-center gap-2">
                <span class="text-sm text-muted-foreground">
                  {{ selectedJobs.length }} selected
                </span>
                <Button @click="showMassStopModal = true" variant="destructive" size="sm">
                  <Square class="h-4 w-4 mr-2" />
                  Stop Selected
                </Button>
              </div>
            </div>

            <!-- Data Table -->
            <div class="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="w-12">
                      <Checkbox 
                        :checked="isAllSelected" 
                        @update:checked="toggleSelectAll"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>At</TableHead>
                    <TableHead class="text-xs">ID</TableHead>
                    <TableHead class="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="job in runningJobs.data" :key="job.uuid">
                    <TableCell>
                      <Checkbox 
                        :checked="selectedJobs.includes(job.uuid)"
                        @update:checked="toggleJobSelection(job.uuid)"
                      />
                    </TableCell>
                    <TableCell class="font-medium">{{ job.name }}</TableCell>
                    <TableCell>{{ job.agent }}</TableCell>
                    <TableCell>{{ formatDate(job.created_date) }}</TableCell>
                    <TableCell class="text-xs font-mono">{{ job.uuid.substring(0, 8) }}...</TableCell>
                    <TableCell>
                      <div class="flex items-center gap-1">
                        <!-- Metrics Action -->
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              @click="showMetricsModal(job)" 
                              variant="ghost" 
                              size="sm"
                            >
                              <BarChart3 class="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Metrics</TooltipContent>
                        </Tooltip>

                        <!-- Stop Action -->
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              @click="showStopModal(job)" 
                              variant="ghost" 
                              size="sm"
                              class="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Square class="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Stop Job</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <!-- Table Footer -->
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
              <!-- Entries Info -->
              <div class="text-sm text-muted-foreground">
                Showing {{ getShowingText() }} entries
              </div>

              <!-- Pagination -->
              <div class="flex items-center gap-2">
                <Button 
                  @click="goToPage(1)" 
                  variant="outline" 
                  size="sm" 
                  :disabled="currentPage === 1"
                >
                  First
                </Button>
                <Button 
                  @click="goToPage(currentPage - 1)" 
                  variant="outline" 
                  size="sm" 
                  :disabled="currentPage === 1"
                >
                  <ChevronLeft class="h-4 w-4" />
                </Button>
                
                <div class="flex items-center gap-1">
                  <span class="text-sm">Page</span>
                  <Input 
                    v-model="currentPage" 
                    @change="goToPage(currentPage)"
                    class="w-16 text-center" 
                    type="number" 
                    :min="1" 
                    :max="totalPages"
                  />
                  <span class="text-sm">of {{ totalPages }}</span>
                </div>

                <Button 
                  @click="goToPage(currentPage + 1)" 
                  variant="outline" 
                  size="sm" 
                  :disabled="currentPage === totalPages"
                >
                  <ChevronRight class="h-4 w-4" />
                </Button>
                <Button 
                  @click="goToPage(totalPages)" 
                  variant="outline" 
                  size="sm" 
                  :disabled="currentPage === totalPages"
                >
                  Last
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Metrics Modal -->
      <Dialog v-model:open="metricsModalOpen">
        <DialogContent class="max-w-md">
          <DialogHeader>
            <DialogTitle>Metrics for job: {{ selectedJobForMetrics?.uuid?.substring(0, 8) }}...</DialogTitle>
          </DialogHeader>
          <div v-if="selectedJobForMetrics" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <p class="text-sm font-medium text-muted-foreground">Progress</p>
                <p class="text-lg font-semibold">{{ selectedJobForMetrics.progress?.total_done_urls || 0 }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-sm font-medium text-muted-foreground">Discovered</p>
                <p class="text-lg font-semibold">{{ selectedJobForMetrics.progress?.total_urls || 0 }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-sm font-medium text-muted-foreground">Archived</p>
                <p class="text-lg font-semibold">{{ selectedJobForMetrics.progress?.total_done_urls || 0 }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-sm font-medium text-muted-foreground">Queued</p>
                <p class="text-lg font-semibold">{{ selectedJobForMetrics.total || 0 }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-sm font-medium text-muted-foreground">Size</p>
                <p class="text-lg font-semibold">{{ formatBytes(selectedJobForMetrics.total_data_size || 0) }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-sm font-medium text-muted-foreground">Depth</p>
                <p class="text-lg font-semibold">{{ selectedJobForMetrics.depth?.current_depth || 0 }} / {{ selectedJobForMetrics.depth?.max_depth || 0 }}</p>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm font-medium text-muted-foreground">Max. time</span>
                <span class="text-sm font-semibold">{{ formatDuration(selectedJobForMetrics.max_time || 0) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm font-medium text-muted-foreground">ETA</span>
                <span class="text-sm font-semibold">{{ formatDuration(selectedJobForMetrics.remaining_time || 0) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm font-medium text-muted-foreground">Duration</span>
                <span class="text-sm font-semibold">{{ formatDuration(selectedJobForMetrics.running_time || 0) }}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button @click="metricsModalOpen = false" variant="outline">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Stop Job Modal -->
      <Dialog v-model:open="stopModalOpen">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop Job(s)</DialogTitle>
            <DialogDescription>
              Are you sure you want to stop the selected job(s)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button @click="stopModalOpen = false" variant="outline">Cancel</Button>
            <Button @click="confirmStopJob" variant="destructive" :disabled="isStopping">
              <span v-if="isStopping" class="flex items-center gap-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Stopping...
              </span>
              <span v-else>Stop Job</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Mass Stop Modal -->
      <Dialog v-model:open="showMassStopModal">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop Job(s)</DialogTitle>
            <DialogDescription>
              Are you sure you want to stop the selected {{ selectedJobs.length }} job(s)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button @click="showMassStopModal = false" variant="outline">Cancel</Button>
            <Button @click="confirmMassStop" variant="destructive" :disabled="isStopping">
              <span v-if="isStopping" class="flex items-center gap-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Stopping...
              </span>
              <span v-else>Stop Jobs</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Clock, Play, CircleCheckBig, BarChart3, Square,
  ChevronLeft, ChevronRight, AlertCircle, RefreshCw
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

// Reactive data
const pageSize = ref('5')
const currentPage = ref(1)
const selectedJobs = ref<string[]>([])

// Modal states
const metricsModalOpen = ref(false)
const stopModalOpen = ref(false)
const showMassStopModal = ref(false)
const selectedJobForAction = ref<any>(null)
const selectedJobForMetrics = ref<any>(null)

// Loading states
const isStopping = ref(false)

// Auto-refresh interval
let refreshInterval: NodeJS.Timeout | null = null

// Build request payload
const buildRequestPayload = () => {
  return {
    from: (currentPage.value - 1) * parseInt(pageSize.value),
    size: parseInt(pageSize.value)
  }
}

// Fetch running jobs data
const { data: runningJobs, pending, error, refresh } = await useAsyncData(
  'running-jobs',
  () => $fetch('/api/jobs/running', {
    method: 'POST',
    body: buildRequestPayload()
  }),
  {
    server: true,
    default: () => null
  }
)

// Set up auto-refresh every 5 seconds
onMounted(() => {
  refreshInterval = setInterval(() => {
    refresh()
  }, 5000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

// Computed properties
const totalPages = computed(() => {
  if (!runningJobs.value?.total) return 1
  return Math.ceil(runningJobs.value.total / parseInt(pageSize.value))
})

const isAllSelected = computed(() => {
  if (!runningJobs.value?.data?.length) return false
  return runningJobs.value.data.every((job: any) => selectedJobs.value.includes(job.uuid))
})

// Helper functions
const formatDate = (unixTimestamp: number) => {
  if (!unixTimestamp) return 'N/A'
  return new Date(unixTimestamp * 1000).toLocaleString()
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + sizes[i]
}

const formatDuration = (milliseconds: number) => {
  if (!milliseconds) return '0s'
  const seconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

const getShowingText = () => {
  if (!runningJobs.value?.data?.length) return '0 to 0 of 0'
  const start = (currentPage.value - 1) * parseInt(pageSize.value) + 1
  const end = Math.min(start + runningJobs.value.data.length - 1, runningJobs.value.total || 0)
  const total = runningJobs.value.total || 0
  return `${start} to ${end} of ${total}`
}

// Event handlers
const handlePageSizeChange = () => {
  currentPage.value = 1
  refresh()
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    refresh()
  }
}

const toggleSelectAll = (checked: boolean) => {
  if (checked) {
    selectedJobs.value = runningJobs.value?.data?.map((job: any) => job.uuid) || []
  } else {
    selectedJobs.value = []
  }
}

const toggleJobSelection = (uuid: string) => {
  const index = selectedJobs.value.indexOf(uuid)
  if (index > -1) {
    selectedJobs.value.splice(index, 1)
  } else {
    selectedJobs.value.push(uuid)
  }
}

// Action handlers
const showMetricsModal = (job: any) => {
  selectedJobForMetrics.value = job
  metricsModalOpen.value = true
}

const showStopModal = (job: any) => {
  selectedJobForAction.value = job
  stopModalOpen.value = true
}

const confirmStopJob = async () => {
  if (!selectedJobForAction.value) return
  
  try {
    isStopping.value = true
    await $fetch('/api/jobs/stop_job', {
      method: 'POST',
      body: { uuids: [selectedJobForAction.value.uuid] }
    })
    toast.success('Job stopped successfully!')
    stopModalOpen.value = false
    selectedJobForAction.value = null
    refresh()
  } catch (error: any) {
    toast.error(error.statusMessage || 'Failed to stop job')
  } finally {
    isStopping.value = false
  }
}

const confirmMassStop = async () => {
  if (selectedJobs.value.length === 0) return
  
  try {
    isStopping.value = true
    await $fetch('/api/jobs/stop_job', {
      method: 'POST',
      body: { uuids: selectedJobs.value }
    })
    toast.success(`${selectedJobs.value.length} jobs stopped successfully!`)
    showMassStopModal.value = false
    selectedJobs.value = []
    refresh()
  } catch (error: any) {
    toast.error(error.statusMessage || 'Failed to stop jobs')
  } finally {
    isStopping.value = false
  }
}

// Watch for page changes to refresh data
watch([currentPage, pageSize], () => {
  refresh()
})

// Watch for metrics modal close to stop auto-refresh when job terminates
watch(metricsModalOpen, (isOpen) => {
  if (!isOpen) {
    selectedJobForMetrics.value = null
  }
})
</script>