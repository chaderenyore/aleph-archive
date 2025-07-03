<!-- <script setup lang="ts">
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
    server: true,
    default: () => null
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
</script> -->

<template>
  <div class="container mx-auto p-6 space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Terminated Jobs</h1>
        <p class="text-muted-foreground">Manage and monitor completed job executions</p>
      </div>
      <Button @click="handleRefresh" :disabled="pending" variant="outline">
        <RefreshCw :class="{ 'animate-spin': pending }" class="w-4 h-4 mr-2" />
        {{ refreshSuccess ? 'Updated!' : 'Refresh' }}
      </Button>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center space-x-2">
            <div class="p-2 bg-green-100 rounded-lg">
              <CheckCircle class="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">Terminated</p>
              <p class="text-2xl font-bold">{{ terminatedJobs?.count?.terminated || 0 }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center space-x-2">
            <div class="p-2 bg-blue-100 rounded-lg">
              <Play class="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">Running</p>
              <p class="text-2xl font-bold">{{ terminatedJobs?.count?.running || 0 }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center space-x-2">
            <div class="p-2 bg-yellow-100 rounded-lg">
              <Clock class="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">Pending</p>
              <p class="text-2xl font-bold">{{ terminatedJobs?.count?.pending || 0 }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Error Display -->
    <Alert v-if="error" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Failed to load terminated jobs data. Please check your connection and try again.
      </AlertDescription>
    </Alert>

    <!-- Filter Section -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="flex items-center gap-2">
            <Filter class="w-5 h-5" />
            Filters
          </CardTitle>
          <Button @click="toggleFilters" variant="ghost" size="sm">
            <ChevronDown :class="{ 'rotate-180': showFilters }" class="w-4 h-4 transition-transform" />
          </Button>
        </div>
      </CardHeader>
      <Collapsible v-model:open="showFilters">
        <CollapsibleContent>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <!-- Text Filter -->
              <div class="space-y-2">
                <Label for="filter-input">Filter by Name</Label>
                <Input
                  id="filter-input"
                  v-model="filters.filter"
                  placeholder="Enter job name..."
                  class="w-full"
                />
              </div>

              <!-- Start Date -->
              <div class="space-y-2">
                <Label for="start-date">Start Date</Label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      :class="{ 'text-muted-foreground': !filters.sdate }"
                      class="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon class="mr-2 h-4 w-4" />
                      {{ filters.sdate ? formatDate(filters.sdate) : 'Pick a date' }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0" align="start">
                    <Calendar
                      v-model="filters.sdate"
                      :max-date="filters.edate || undefined"
                      initial-focus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <!-- End Date -->
              <div class="space-y-2">
                <Label for="end-date">End Date</Label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      :class="{ 'text-muted-foreground': !filters.edate }"
                      class="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon class="mr-2 h-4 w-4" />
                      {{ filters.edate ? formatDate(filters.edate) : 'Pick a date' }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0" align="start">
                    <Calendar
                      v-model="filters.edate"
                      :min-date="filters.sdate || undefined"
                      initial-focus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <!-- Filter Actions -->
              <div class="space-y-2">
                <Label>&nbsp;</Label>
                <div class="flex gap-2">
                  <Button @click="applyFilters" class="flex-1">
                    <Search class="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button @click="resetFilters" variant="outline">
                    <X class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>

    <!-- Data Table -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle>Terminated Jobs</CardTitle>
          <div class="flex items-center gap-2">
            <Label for="page-size" class="text-sm">Show:</Label>
            <Select v-model="pagination.size" @update:model-value="onPageSizeChange">
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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Mass Action Bar -->
        <div v-if="selectedJobs.length > 0" class="mb-4 p-4 bg-muted rounded-lg">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">{{ selectedJobs.length }} job(s) selected</span>
            <Button @click="showMassDeleteDialog = true" variant="destructive" size="sm">
              <Trash2 class="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="pending" class="flex items-center justify-center py-8">
          <Loader2 class="w-6 h-6 animate-spin mr-2" />
          <span>Loading terminated jobs...</span>
        </div>

        <!-- Data Table -->
        <div v-else-if="terminatedJobs?.data" class="space-y-4">
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-12">
                    <Checkbox
                      :checked="isAllSelected"
                      @update:checked="toggleSelectAll"
                    />
                  </TableHead>
                  <TableHead class="cursor-pointer" @click="toggleSort('archive')">
                    <div class="flex items-center gap-2">
                      Name
                      <div class="flex flex-col">
                        <ChevronUp :class="getSortIconClass('archive', 'asc')" class="w-3 h-3" />
                        <ChevronDown :class="getSortIconClass('archive', 'desc')" class="w-3 h-3" />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead class="cursor-pointer" @click="toggleSort('agent')">
                    <div class="flex items-center gap-2">
                      Agent
                      <div class="flex flex-col">
                        <ChevronUp :class="getSortIconClass('agent', 'asc')" class="w-3 h-3" />
                        <ChevronDown :class="getSortIconClass('agent', 'desc')" class="w-3 h-3" />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead class="cursor-pointer" @click="toggleSort('start_ts')">
                    <div class="flex items-center gap-2">
                      At
                      <div class="flex flex-col">
                        <ChevronUp :class="getSortIconClass('start_ts', 'asc')" class="w-3 h-3" />
                        <ChevronDown :class="getSortIconClass('start_ts', 'desc')" class="w-3 h-3" />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead class="cursor-pointer" @click="toggleSort('stop_reason')">
                    <div class="flex items-center gap-2">
                      Due
                      <div class="flex flex-col">
                        <ChevronUp :class="getSortIconClass('stop_reason', 'asc')" class="w-3 h-3" />
                        <ChevronDown :class="getSortIconClass('stop_reason', 'desc')" class="w-3 h-3" />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead>Export</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="job in terminatedJobs.data" :key="job.uuid">
                  <TableCell>
                    <Checkbox
                      :checked="selectedJobs.includes(job.uuid)"
                      @update:checked="toggleJobSelection(job.uuid)"
                    />
                  </TableCell>
                  <TableCell class="font-medium">{{ job.name }}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{{ job.agent }}</Badge>
                  </TableCell>
                  <TableCell>{{ formatTimestamp(job.terminatedDate) }}</TableCell>
                  <TableCell>
                    <code class="text-xs bg-muted px-2 py-1 rounded">{{ job.uuid.substring(0, 8) }}...</code>
                  </TableCell>
                  <TableCell>{{ job.progress.total_data_size }}b</TableCell>
                  <TableCell>
                    <Badge :variant="getStopReasonVariant(job.stop_reason)">
                      {{ job.stop_reason }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="outline" size="sm">
                          <Download class="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem @click="handleExport(job.uuid, 'qa')">
                          <FileText class="w-4 h-4 mr-2" />
                          Download QA
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="handleExport(job.uuid, 'csv')">
                          <FileSpreadsheet class="w-4 h-4 mr-2" />
                          Download CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="handleExport(job.uuid, 'spec')">
                          <FileCode class="w-4 h-4 mr-2" />
                          Download SPEC
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="handleExport(job.uuid, 'kdb')">
                          <Database class="w-4 h-4 mr-2" />
                          Download KDB
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="handleExport(job.uuid, 'warc')">
                          <Archive class="w-4 h-4 mr-2" />
                          Download WARC
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        @click="showMetrics(job)"
                        title="View Metrics"
                      >
                        <BarChart3 class="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        @click="handleBackup(job.uuid)"
                        :disabled="!canBackup(job.uuid)"
                        :class="{ 'opacity-50': !canBackup(job.uuid) }"
                        title="Backup Job"
                      >
                        <HardDrive class="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        @click="showDeleteDialog(job.uuid)"
                        title="Delete Job"
                      >
                        <Trash2 class="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <!-- Pagination Info and Controls -->
          <div class="flex items-center justify-between">
            <div class="text-sm text-muted-foreground">
              {{ getShowingText() }}
            </div>
            
            <div class="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                @click="goToPage(1)"
                :disabled="pagination.currentPage === 1"
              >
                <ChevronsLeft class="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                @click="goToPage(pagination.currentPage - 1)"
                :disabled="pagination.currentPage === 1"
              >
                <ChevronLeft class="w-4 h-4" />
              </Button>
              
              <div class="flex items-center gap-1">
                <span class="text-sm">Page</span>
                <Input
                  v-model="pageInput"
                  @keyup.enter="goToPageInput"
                  class="w-16 text-center"
                  type="number"
                  :min="1"
                  :max="totalPages"
                />
                <span class="text-sm">of {{ totalPages }}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                @click="goToPage(pagination.currentPage + 1)"
                :disabled="pagination.currentPage === totalPages"
              >
                <ChevronRight class="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                @click="goToPage(totalPages)"
                :disabled="pagination.currentPage === totalPages"
              >
                <ChevronsRight class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-8">
          <FileX class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">No terminated jobs found</h3>
          <p class="text-muted-foreground">Try adjusting your filters or check back later.</p>
        </div>
      </CardContent>
    </Card>

    <!-- Metrics Modal -->
    <Dialog v-model:open="showMetricsModal">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Job Metrics</DialogTitle>
          <DialogDescription>
            Detailed metrics for {{ selectedJob?.name }}
          </DialogDescription>
        </DialogHeader>
        <div v-if="selectedJob" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Progress</Label>
              <div class="text-sm">{{ selectedJob.progress.total_done_urls }} / {{ selectedJob.progress.total_urls }}</div>
            </div>
            <div class="space-y-2">
              <Label>Discovered</Label>
              <div class="text-sm">{{ selectedJob.progress.total_urls }}</div>
            </div>
            <div class="space-y-2">
              <Label>Archived</Label>
              <div class="text-sm">{{ selectedJob.progress.total_done_urls }}</div>
            </div>
            <div class="space-y-2">
              <Label>Size</Label>
              <div class="text-sm">{{ selectedJob.progress.total_data_size }}b</div>
            </div>
            <div class="space-y-2">
              <Label>Depth</Label>
              <div class="text-sm">{{ selectedJob.depth.current_depth }} / {{ selectedJob.depth.max_depth }}</div>
            </div>
            <div class="space-y-2">
              <Label>Max. time</Label>
              <div class="text-sm">{{ formatDuration(selectedJob.max_time) }}</div>
            </div>
            <div class="space-y-2">
              <Label>Duration</Label>
              <div class="text-sm">{{ calculateDuration(selectedJob.running_time, selectedJob.terminatedDate) }}</div>
            </div>
            <div class="space-y-2">
              <Label>Started</Label>
              <div class="text-sm">{{ formatTimestamp(selectedJob.running_time) }}</div>
            </div>
            <div class="space-y-2">
              <Label>Ended</Label>
              <div class="text-sm">{{ formatTimestamp(selectedJob.terminatedDate) }}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="showDeleteConfirm">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete the(se) job(s)?</AlertDialogTitle>
          <AlertDialogDescription>
            Everything related to it(them) will be erased:<br>
            intermediate data, exported WARC, etc.<br><br>
            <strong>Advice: save your exports on disk before</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No</AlertDialogCancel>
          <AlertDialogAction @click="confirmDelete" class="bg-red-600 hover:bg-red-700">
            Yes, Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Mass Delete Confirmation Dialog -->
    <AlertDialog v-model:open="showMassDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete the(se) job(s)?</AlertDialogTitle>
          <AlertDialogDescription>
            Everything related to it(them) will be erased:<br>
            intermediate data, exported WARC, etc.<br><br>
            <strong>Advice: save your exports on disk before</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No</AlertDialogCancel>
          <AlertDialogAction @click="confirmMassDelete" class="bg-red-600 hover:bg-red-700">
            Yes, Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script lang="ts" setup>
const nuxtApp = useNuxtApp();
import { ref, reactive, computed, watch, watchEffect, nextTick, onBeforeMount } from 'vue'
import { format } from 'date-fns'
import { toast } from 'vue-sonner'
import {
  RefreshCw,
  AlertCircle,
  Filter,
  ChevronDown,
  CalendarIcon,
  Search,
  X,
  Loader2,
  FileX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  CheckCircle,
  Play,
  Clock,
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  Database,
  Archive,
  BarChart3,
  HardDrive,
  Trash2
} from 'lucide-vue-next'

// UI Components imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

// Fetch terminated jobs data
const { data: terminatedJobs, pending, error, refresh } = await useAsyncData(
  'terminated-jobs',
  () => $fetch('/api/jobs/terminated', {
    method: 'POST',
    body: buildPayload()
  }),
  {
    server: false,
    default: () => null,
    getCachedData(key) {
      return nuxtApp.payload.data[key] || nuxtApp.static.data[key]
    }
  }
)

// onBeforeMount(() => {
//   refresh();
// });


// Add this function in the utility functions section
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0B'
  
  const k = 1024
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + sizes[i]
}
// Reactive state for filters
const showFilters = ref(false)
const filters = reactive({
  filter: '',
  sdate: null as Date | null,
  edate: null as Date | null
})

// Pagination state
const pagination = reactive({
  currentPage: 1,
  size: '5',
  from: 0
})

// Sorting state
const sorting = reactive({
  field: '',
  direction: ''
})

// Selection state
const selectedJobs = ref<string[]>([])

// Modal states
const showMetricsModal = ref(false)
const showDeleteConfirm = ref(false)
const showMassDeleteDialog = ref(false)
const selectedJob = ref<any>(null)
const jobToDelete = ref<string>('')

// Export tracking
const exportedJobs = reactive<Record<string, string[]>>({})

const pageInput = ref(1)
const refreshSuccess = ref(false)

// Computed values
const totalPages = computed(() => {
  if (!terminatedJobs.value?.total) return 1
  return Math.ceil(terminatedJobs.value.total / parseInt(pagination.size))
})

const isAllSelected = computed(() => {
  if (!terminatedJobs.value?.data?.length) return false
  return terminatedJobs.value.data.every((job: any) => selectedJobs.value.includes(job.uuid))
})

// Build API payload based on current state
const buildPayload = () => {
  const payload: any = {
    from: pagination.from,
    size: parseInt(pagination.size)
  }

  // Add filters if they have values
  if (filters.filter) {
    payload.filter = filters.filter
  }

  if (filters.sdate) {
    payload.sdate = Math.floor(filters.sdate.getTime() / 1000)
  }

  if (filters.edate) {
    payload.edate = Math.floor(filters.edate.getTime() / 1000)
  }

  // Add sorting if active
  if (sorting.field && sorting.direction) {
    payload.sort_field = sorting.field
    payload.sort_dir = sorting.direction
  }

  return payload
}

// Enhanced refresh function with UI feedback
const handleRefresh = async () => {
  try {
    await refresh()
    refreshSuccess.value = true
    setTimeout(() => {
      refreshSuccess.value = false
    }, 2000)
  } catch (error) {
    console.error('Refresh failed:', error)
    toast.error('Failed to refresh data')
  }
}

// Filter functions
const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const applyFilters = async () => {
  pagination.currentPage = 1
  pagination.from = 0
  pageInput.value = 1
  await refresh()
}

const resetFilters = async () => {
  filters.filter = ''
  filters.sdate = null
  filters.edate = null
  sorting.field = ''
  sorting.direction = ''
  pagination.currentPage = 1
  pagination.from = 0
  pageInput.value = 1
  await refresh()
}

// Sorting functions
const toggleSort = async (field: string) => {
  if (sorting.field === field) {
    // Cycle through: asc -> desc -> none
    if (sorting.direction === 'asc') {
      sorting.direction = 'desc'
    } else if (sorting.direction === 'desc') {
      sorting.field = ''
      sorting.direction = ''
    } else {
      sorting.direction = 'asc'
    }
  } else {
    sorting.field = field
    sorting.direction = 'asc'
  }
  
  pagination.currentPage = 1
  pagination.from = 0
  pageInput.value = 1
  await refresh()
}

const getSortIconClass = (field: string, direction: string) => {
  if (sorting.field === field && sorting.direction === direction) {
    return 'text-primary'
  }
  return 'text-muted-foreground'
}

// Selection functions
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedJobs.value = []
  } else {
    selectedJobs.value = terminatedJobs.value?.data?.map((job: any) => job.uuid) || []
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

// Pagination functions
const onPageSizeChange = async () => {
  pagination.currentPage = 1
  pagination.from = 0
  pageInput.value = 1
  await refresh()
}

const goToPage = async (page: number) => {
  if (page < 1 || page > totalPages.value) return
  
  pagination.currentPage = page
  pagination.from = (page - 1) * parseInt(pagination.size)
  pageInput.value = page
  await refresh()
}

const goToPageInput = async () => {
  const page = parseInt(pageInput.value.toString())
  if (page >= 1 && page <= totalPages.value) {
    await goToPage(page)
  } else {
    pageInput.value = pagination.currentPage
  }
}

// Export functions
const handleExport = async (uuid: string, type: string) => {
  try {
    // Track exported types for this job
    if (!exportedJobs[uuid]) {
      exportedJobs[uuid] = []
    }
    if (!exportedJobs[uuid].includes(type)) {
      exportedJobs[uuid].push(type)
    }
    
    // Here you would implement the actual export logic
    toast.success(`${type.toUpperCase()} export started for job ${uuid.substring(0, 8)}...`)
  } catch (error) {
    toast.error(`Failed to export ${type.toUpperCase()}`)
  }
}

const canBackup = (uuid: string) => {
  const requiredExports = ['qa', 'csv', 'spec', 'kdb', 'warc']
  const jobExports = exportedJobs[uuid] || []
  return requiredExports.every(type => jobExports.includes(type))
}

// Action functions
const showMetrics = (job: any) => {
  selectedJob.value = job
  showMetricsModal.value = true
}

const handleBackup = async (uuid: string) => {
  if (!canBackup(uuid)) {
    toast.error('Please export all options first before backup')
    return
  }

  try {
    const confirmed = confirm('Are you sure you want to backup this job?')
    if (!confirmed) return

    await $fetch('/api/jobs/backup', {
      method: 'POST',
      body: { uuid }
    })
    
    toast.success('Job backup completed successfully')
  } catch (error) {
    toast.error('Failed to backup job')
  }
}

const showDeleteDialog = (uuid: string) => {
  jobToDelete.value = uuid
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  try {
    await $fetch('/api/jobs/delete', {
      method: 'POST',
      body: {
        state: 'terminated',
        uuids: [jobToDelete.value]
      }
    })
    
    toast.success('Job deleted successfully')
    showDeleteConfirm.value = false
    await refresh()
  } catch (error) {
    toast.error('Failed to delete job')
  }
}

const confirmMassDelete = async () => {
  try {
    await $fetch('/api/jobs/delete', {
      method: 'POST',
      body: {
        state: 'terminated',
        uuids: selectedJobs.value
      }
    })
    
    toast.success(`${selectedJobs.value.length} job(s) deleted successfully`)
    selectedJobs.value = []
    showMassDeleteDialog.value = false
    await refresh()
  } catch (error) {
    toast.error('Failed to delete jobs')
  }
}

// Utility functions
const formatTimestamp = (timestamp: number) => {
  return format(new Date(timestamp * 1000), 'MMM dd, yyyy HH:mm:ss')
}

const formatDate = (date: Date) => {
  return format(date, 'MMM dd, yyyy')
}

const formatDuration = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

const calculateDuration = (start: number, end: number) => {
  const duration = end - start
  return formatDuration(duration * 1000)
}

const getStopReasonVariant = (reason: string) => {
  switch (reason) {
    case 'max_time':
      return 'secondary'
    case 'completed':
      return 'default'
    case 'error':
      return 'destructive'
    default:
      return 'outline'
  }
}

const getShowingText = () => {
  if (!terminatedJobs.value?.data?.length) return 'No entries'
  
  const start = pagination.from + 1
  const end = Math.min(pagination.from + parseInt(pagination.size), terminatedJobs.value.total || 0)
  const total = terminatedJobs.value.total || 0
  
  return `Showing ${start} to ${end} of ${total} entries`
}

// Watch pagination changes to sync pageInput
watch(() => pagination.currentPage, (newPage) => {
  pageInput.value = newPage
})

// Watch for data changes and update UI
watchEffect(() => {
  if (terminatedJobs.value) {
    console.log('Terminated jobs data updated:', terminatedJobs.value)
  }
})

// Watch for errors
watch(error, (newError) => {
  if (newError) {
    console.error('Error fetching terminated jobs:', newError)
    toast.error('Failed to load terminated jobs data')
  }
})
</script>