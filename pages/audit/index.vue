<template>
  <div class="container mx-auto p-6 space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p class="text-muted-foreground">Monitor and track all system activities</p>
      </div>
      <Button @click="handleRefresh" :disabled="pending" variant="outline">
        <RefreshCw :class="{ 'animate-spin': pending }" class="w-4 h-4 mr-2" />
        {{ refreshSuccess ? 'Updated!' : 'Refresh' }}
      </Button>
    </div>

    <!-- Error Display -->
    <Alert v-if="error" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Failed to load audit data. Please check your connection and try again.
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
          <Button 
            @click="toggleFilters" 
            variant="ghost" 
            size="sm"
          >
            <ChevronDown :class="{ 'rotate-180': showFilters }" class="w-4 h-4 transition-transform" />
          </Button>
        </div>
      </CardHeader>
      <Collapsible v-model:open="showFilters">
        <CollapsibleContent>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <!-- Action Filter -->
              <div class="space-y-2">
                <Label for="action-filter">Action</Label>
                <Select v-model="filters.action">
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">All</SelectItem>
                    <SelectItem value="1">LOGIN</SelectItem>
                    <SelectItem value="2">LOGOUT</SelectItem>
                    <SelectItem value="3">CREATE PASSWORD</SelectItem>
                    <SelectItem value="4">CREATE JOB</SelectItem>
                    <SelectItem value="5">UPDATE JOB</SelectItem>
                    <SelectItem value="6">CLONE JOB</SelectItem>
                    <SelectItem value="7">DELETE JOB</SelectItem>
                    <SelectItem value="8">START JOB</SelectItem>
                    <SelectItem value="9">STOP JOB</SelectItem>
                    <SelectItem value="10">IMPORT JOB</SelectItem>
                    <SelectItem value="11">EXPORT JOB</SelectItem>
                    <SelectItem value="12">BACKUP JOB</SelectItem>
                    <SelectItem value="13">RESTORE JOB</SelectItem>
                    <SelectItem value="14">VIEW ARCHIVE</SelectItem>
                    <SelectItem value="15">DELETE ARCHIVE</SelectItem>
                    <SelectItem value="16">CREATE GUEST</SelectItem>
                    <SelectItem value="17">UPDATE GUEST</SelectItem>
                    <SelectItem value="18">DELETE GUEST</SelectItem>
                    <SelectItem value="19">SEARCH</SelectItem>
                    <SelectItem value="20">AUDIT BY DOWNLOAD</SelectItem>
                  </SelectContent>
                </Select>
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
          <CardTitle>Audit Entries</CardTitle>
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
        <!-- Loading State -->
        <div v-if="pending" class="flex items-center justify-center py-8">
          <Loader2 class="w-6 h-6 animate-spin mr-2" />
          <span>Loading audit data...</span>
        </div>

        <!-- Data Table -->
        <div v-else-if="terminatedJobs?.data" class="space-y-4">
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Filter</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in terminatedJobs.data" :key="item.id">
                  <TableCell>
                    {{ formatTimestamp(item.time) }}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{{ item.action_text }}</Badge>
                  </TableCell>
                  <TableCell>{{ item.email }}</TableCell>
                  <TableCell>
                    <code class="text-sm bg-muted px-2 py-1 rounded">{{ item.ip }}</code>
                  </TableCell>
                  <TableCell>
                    <div v-if="item.comment" class="space-y-1">
                      <div v-for="(value, key) in item.comment" :key="key" class="text-sm">
                        <span class="font-semibold">{{ key }}:</span> {{ value }}
                      </div>
                    </div>
                    <span v-else class="text-muted-foreground">-</span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <!-- Pagination Info and Controls -->
          <div class="flex items-center justify-between">
            <div class="text-sm text-muted-foreground">
              Showing {{ getShowingText() }}
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
          <h3 class="text-lg font-semibold mb-2">No audit data found</h3>
          <p class="text-muted-foreground">Try adjusting your filters or check back later.</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, watchEffect, nextTick } from 'vue'
import { format } from 'date-fns'
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
  ChevronsRight
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

// Declare useAsyncData and $fetch
const { data: terminatedJobs, pending, error, refresh } = await useAsyncData(
  'audit-jobs',
  () => $fetch('/api/jobs/audit', {
    method: 'POST',
    body: buildPayload()
  }),
  {
    server: true,
    default: () => null
  }
)

// Reactive state for filters
const showFilters = ref(false)
const filters = reactive({
  action: '',
  sdate: null as Date | null,
  edate: null as Date | null
})

// Pagination state
const pagination = reactive({
  currentPage: 1,
  size: '5',
  from: 0
})

const pageInput = ref(1)

// Computed values for pagination
const totalPages = computed(() => {
  if (!terminatedJobs.value?.total) return 1
  return Math.ceil(terminatedJobs.value.total / parseInt(pagination.size))
})

// Build API payload based on current state
const buildPayload = () => {
  const payload: any = {
    from: pagination.from,
    size: parseInt(pagination.size)
  }

  // Only add filters if they have values
  if (filters.action) {
    payload.action = parseInt(filters.action)
  }

  if (filters.sdate) {
    payload.sdate = Math.floor(filters.sdate.getTime() / 1000)
  }

  if (filters.edate) {
    payload.edate = Math.floor(filters.edate.getTime() / 1000)
  }

  // Note: sort_dir is now handled in the API route based on filter presence
  return payload
}

// Add a success state for better UX
const refreshSuccess = ref(false)

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
  }
}

// Watch for data changes and update UI
watchEffect(() => {
  if (terminatedJobs.value) {
    console.log('Audit data updated:', terminatedJobs.value)
    // Force UI reactivity by triggering a re-render
    nextTick(() => {
      // Any additional UI updates can go here
    })
  }
})

// Watch for errors
watch(error, (newError) => {
  if (newError) {
    console.error('Error fetching audit jobs:', newError)
  }
})

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
  filters.action = ''
  filters.sdate = null
  filters.edate = null
  pagination.currentPage = 1
  pagination.from = 0
  pageInput.value = 1
  await refresh()
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

// Utility functions
const formatTimestamp = (timestamp: number) => {
  return format(new Date(timestamp * 1000), 'MMM dd, yyyy HH:mm:ss')
}

const formatDate = (date: Date) => {
  return format(date, 'MMM dd, yyyy')
}

const getShowingText = () => {
  if (!terminatedJobs.value?.data?.length) return 'No entries'
  
  const start = pagination.from + 1
  const end = Math.min(pagination.from + parseInt(pagination.size), terminatedJobs.value.total || 0)
  const total = terminatedJobs.value.total || 0
  
  return `${start} to ${end} of ${total} entries`
}

// Watch pagination changes to sync pageInput
watch(() => pagination.currentPage, (newPage) => {
  pageInput.value = newPage
})
</script>
