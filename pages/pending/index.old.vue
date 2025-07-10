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
                  <Clock class="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 class="text-xl sm:text-2xl font-bold text-sidebar-foreground tracking-tight">
                    Pending Jobs
                  </h1>
                  <p class="text-xs sm:text-sm text-sidebar-foreground/70">
                    Manage jobs ready to run manually and scheduled jobs
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
                      <Archive class="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p class="text-sm sm:text-lg font-bold text-blue-700 dark:text-blue-300">
                        {{ pendingJobs?.count?.running || 0 }}
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
                        {{ pendingJobs?.count?.terminated || 0 }}
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
                        {{ pendingJobs?.count?.pending || 0 }}
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
            <p class="font-medium">Error loading pending jobs</p>
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
              <p class="text-muted-foreground">Loading pending jobs...</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Main Content -->
      <div v-else-if="pendingJobs" class="px-4 sm:px-6 lg:px-8 pb-8">
        <!-- Jobs Ready to Run Manually Table -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Briefcase class="h-5 w-5" />
              Jobs Ready to Run Manually
            </CardTitle>
            <CardDescription>
              Select and manage jobs that are ready for manual execution
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
                <Button @click="showMassDeleteModal = true" variant="destructive" size="sm">
                  <Trash2 class="h-4 w-4 mr-2" />
                  Delete Selected
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
                    <TableHead class="cursor-pointer" @click="handleSort('archive')">
                      <div class="flex items-center gap-1">
                        Name
                        <div class="flex flex-col">
                          <ChevronUp 
                            class="h-3 w-3" 
                            :class="getSortIconClass('archive', 'asc')"
                          />
                          <ChevronDown 
                            class="h-3 w-3 -mt-1" 
                            :class="getSortIconClass('archive', 'desc')"
                          />
                        </div>
                      </div>
                    </TableHead>
                    <TableHead class="cursor-pointer" @click="handleSort('agent')">
                      <div class="flex items-center gap-1">
                        Agent
                        <div class="flex flex-col">
                          <ChevronUp 
                            class="h-3 w-3" 
                            :class="getSortIconClass('agent', 'asc')"
                          />
                          <ChevronDown 
                            class="h-3 w-3 -mt-1" 
                            :class="getSortIconClass('agent', 'desc')"
                          />
                        </div>
                      </div>
                    </TableHead>
                    <TableHead class="cursor-pointer" @click="handleSort('creation_ts')">
                      <div class="flex items-center gap-1">
                        At
                        <div class="flex flex-col">
                          <ChevronUp 
                            class="h-3 w-3" 
                            :class="getSortIconClass('creation_ts', 'asc')"
                          />
                          <ChevronDown 
                            class="h-3 w-3 -mt-1" 
                            :class="getSortIconClass('creation_ts', 'desc')"
                          />
                        </div>
                      </div>
                    </TableHead>
                    <TableHead class="text-xs">ID</TableHead>
                    <TableHead>Starting URL</TableHead>
                    <TableHead class="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="job in pendingJobs.pending" :key="job.uuid">
                    <TableCell>
                      <Checkbox 
                        :checked="selectedJobs.includes(job.uuid)"
                        @update:checked="toggleJobSelection(job.uuid)"
                      />
                    </TableCell>
                    <TableCell class="font-medium">{{ job.name }}</TableCell>
                    <TableCell>{{ job.agent }}</TableCell>
                    <TableCell>{{ formatDate(job.creationDate) }}</TableCell>
                    <TableCell class="text-xs font-mono">{{ job.uuid.substring(0, 8) }}...</TableCell>
                    <TableCell class="max-w-xs truncate">{{ job.url }}</TableCell>
                    <TableCell>
                      <div class="flex items-center gap-1">
                        <!-- Edit Action -->
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              @click="handleEdit(job.uuid)" 
                              variant="ghost" 
                              size="sm"
                            >
                              <Edit class="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>

                        <!-- Run Action -->
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              @click="showRunModal(job)" 
                              variant="ghost" 
                              size="sm"
                            >
                              <Play class="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Run</TooltipContent>
                        </Tooltip>

                        <!-- Clone Action -->
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              @click="handleClone(job.uuid)" 
                              variant="ghost" 
                              size="sm"
                            >
                              <Copy class="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Clone</TooltipContent>
                        </Tooltip>

                        <!-- Export Action -->
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              @click="handleExport(job.uuid, job.name)" 
                              variant="ghost" 
                              size="sm"
                            >
                              <Download class="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Export</TooltipContent>
                        </Tooltip>

                        <!-- Delete Action -->
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              @click="showDeleteModal(job)" 
                              variant="ghost" 
                              size="sm"
                            >
                              <Trash2 class="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remove</TooltipContent>
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

      <!-- Run Job Modal -->
      <Dialog v-model:open="runModalOpen">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run Job(s)</DialogTitle>
            <DialogDescription>
              Are you sure you want to run the selected job(s)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button @click="runModalOpen = false" variant="outline">Cancel</Button>
            <Button @click="confirmRunJob" :disabled="isRunning">
              <span v-if="isRunning" class="flex items-center gap-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Running...
              </span>
              <span v-else>Run Job</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Delete Job Modal -->
      <Dialog v-model:open="deleteModalOpen">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job(s)</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the selected job(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button @click="deleteModalOpen = false" variant="outline">Cancel</Button>
            <Button @click="confirmDeleteJob" variant="destructive" :disabled="isDeleting">
              <span v-if="isDeleting" class="flex items-center gap-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Deleting...
              </span>
              <span v-else>Delete Job</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Mass Delete Modal -->
      <Dialog v-model:open="showMassDeleteModal">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job(s)</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the selected {{ selectedJobs.length }} job(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button @click="showMassDeleteModal = false" variant="outline">Cancel</Button>
            <Button @click="confirmMassDelete" variant="destructive" :disabled="isDeleting">
              <span v-if="isDeleting" class="flex items-center gap-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Deleting...
              </span>
              <span v-else>Delete Jobs</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { navigateTo } from '#app'
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
  Clock, Archive, CircleCheckBig, Briefcase, Edit, Play, Copy, Download, Trash2,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, AlertCircle, RefreshCw
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

// Reactive data
const pageSize = ref('5')
const currentPage = ref(1)
const selectedJobs = ref<string[]>([])
const sortField = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc' | null>(null)

// Modal states
const runModalOpen = ref(false)
const deleteModalOpen = ref(false)
const showMassDeleteModal = ref(false)
const selectedJobForAction = ref<any>(null)

// Loading states
const isRunning = ref(false)
const isDeleting = ref(false)

// Fetch pending jobs data
const { data: pendingJobs, pending, error, refresh } = await useAsyncData(
  'pending-jobs',
  () => $fetch('/api/jobs/pending', {
    method: 'POST',
    body: {
      pending_limit: { 
        from: (currentPage.value - 1) * parseInt(pageSize.value), 
        size: parseInt(pageSize.value) 
      },
      scheduled_limit: { from: 0, size: 5 },
      ...(sortField.value && sortDirection.value ? {
        pending_sort_field: sortField.value,
        pending_sort_dir: sortDirection.value
      } : {})
    }
  }),
  {
    server: true,
    default: () => null
  }
)

// Computed properties
const totalPages = computed(() => {
  if (!pendingJobs.value?.total_pending) return 1
  return Math.ceil(pendingJobs.value.total_pending / parseInt(pageSize.value))
})

const isAllSelected = computed(() => {
  if (!pendingJobs.value?.pending?.length) return false
  return pendingJobs.value.pending.every((job: any) => selectedJobs.value.includes(job.uuid))
})

// Helper functions
const formatDate = (unixTimestamp: number) => {
  return new Date(unixTimestamp * 1000).toLocaleString()
}

const getShowingText = () => {
  if (!pendingJobs.value?.pending?.length) return '0 to 0 of 0'
  const start = (currentPage.value - 1) * parseInt(pageSize.value) + 1
  const end = Math.min(start + pendingJobs.value.pending.length - 1, pendingJobs.value.total_pending || 0)
  const total = pendingJobs.value.total_pending || 0
  return `${start} to ${end} of ${total}`
}

const getSortIconClass = (field: string, direction: 'asc' | 'desc') => {
  if (sortField.value === field && sortDirection.value === direction) {
    return 'text-primary'
  }
  return 'text-muted-foreground'
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

const handleSort = (field: string) => {
  if (sortField.value === field) {
    if (sortDirection.value === 'asc') {
      sortDirection.value = 'desc'
    } else if (sortDirection.value === 'desc') {
      // Reset to no sorting
      sortField.value = null
      sortDirection.value = null
    } else {
      sortDirection.value = 'asc'
    }
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
  refresh()
}

const toggleSelectAll = (checked: boolean) => {
  if (checked) {
    selectedJobs.value = pendingJobs.value?.pending?.map((job: any) => job.uuid) || []
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
const handleEdit = async (uuid: string) => {
  await navigateTo(`/new?id=${uuid}`)
}

const showRunModal = (job: any) => {
  selectedJobForAction.value = job
  runModalOpen.value = true
}

const confirmRunJob = async () => {
  if (!selectedJobForAction.value) return
  
  try {
    isRunning.value = true
    await $fetch('/api/jobs/run_job', {
      method: 'POST',
      body: { uuids: [selectedJobForAction.value.uuid] }
    })
    toast.success('Job started successfully!')
    runModalOpen.value = false
    selectedJobForAction.value = null
    refresh()
  } catch (error: any) {
    toast.error(error.statusMessage || 'Failed to run job')
  } finally {
    isRunning.value = false
  }
}

const handleClone = async (uuid: string) => {
  try {
    await $fetch('/api/jobs/clone_job', {
      method: 'POST',
      body: { uuid }
    })
    toast.success('Job cloned successfully!')
    refresh()
  } catch (error: any) {
    toast.error(error.statusMessage || 'Failed to clone job')
  }
}

const handleExport = async (uuid: string, jobName: string) => {
  try {
    const response = await fetch(`/api/jobs/export_job?uuid=${uuid}`)
    if (!response.ok) throw new Error('Export failed')
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${jobName}.ken`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    toast.success('Job exported successfully!')
  } catch (error: any) {
    toast.error('Failed to export job')
  }
}

const showDeleteModal = (job: any) => {
  selectedJobForAction.value = job
  deleteModalOpen.value = true
}

const confirmDeleteJob = async () => {
  if (!selectedJobForAction.value) return
  
  try {
    isDeleting.value = true
    await $fetch('/api/jobs/delete', {
      method: 'POST',
      body: { 
        state: 'pending',
        uuids: [selectedJobForAction.value.uuid] 
      }
    })
    toast.success('Job deleted successfully!')
    deleteModalOpen.value = false
    selectedJobForAction.value = null
    refresh()
  } catch (error: any) {
    toast.error(error.statusMessage || 'Failed to delete job')
  } finally {
    isDeleting.value = false
  }
}

const confirmMassDelete = async () => {
  if (selectedJobs.value.length === 0) return
  
  try {
    isDeleting.value = true
    await $fetch('/api/jobs/delete', {
      method: 'POST',
      body: { 
        state: 'pending',
        uuids: selectedJobs.value 
      }
    })
    toast.success(`${selectedJobs.value.length} jobs deleted successfully!`)
    showMassDeleteModal.value = false
    selectedJobs.value = []
    refresh()
  } catch (error: any) {
    toast.error(error.statusMessage || 'Failed to delete jobs')
  } finally {
    isDeleting.value = false
  }
}

// Watch for page changes to refresh data
watch([currentPage, pageSize], () => {
  refresh()
})
</script>