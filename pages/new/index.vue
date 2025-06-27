<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useAsyncData } from '#app'
import { navigateTo } from '#app'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Calendar, Clock, Globe, Archive, Settings, Info, Plus, MoreHorizontal, Edit, Trash2, X, CircleCheckBig } from 'lucide-vue-next';
import { toast } from 'vue-sonner'

const { user, fetchUser } = useAuth()
const { data: jobsData } = await useAsyncData(
  'jobs',
  () => $fetch('/api/jobs/terminated'),
  {
    server: true,
    default: () => null
  }
);

const pendingData = jobsData.value?.count.pending;
const terminatedData = jobsData.value?.count.terminated;
const runningData = jobsData.value?.count.running;

// Form reactive data
const formData = ref({
  starting_url: '',
  name: '',
  agent: user.value.name,
  schedule_date: '',
  schedule_time: '',
  follow_robots: false,
  more_options: false
})

// More options data
const moreOptionsData = ref({
  // Fine grained scoping
  rules: [],
  
  // Ending conditions
  max_urls: 12,
  max_time: 21,
  depth: 21,
  
  // Actions
  automatic_warc_export: true,
  proxy: false,
  compress: false,
  stop_after: 10,
  agent: 'Aleph',
  
  // Behaviour
  user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
  max_workers: '',
  page_load: '',
  queue_weight: '',
  update_existing_resources: true,
  follow_redirects: false,
  png_snapshots: false,
  pdf_snapshots: false,
  ignore_ssl_errors: true,
  
  // Behaviour per page
  enable_scroll: false,
  view_height: 400,
  resources_pause_time: 100,
  velocity: 0,
  
  // Audio/Video
  video_transcode: false,
  compatible_codec_brand: false,
  
  // Hot links
  hot_links: '',
  
  // Advanced options
  sanitizer_rules: '',
  harmonizer_scripts: '',
  link_discoverer: '',
  cookies_filters: '',
  cookies_seeds: '',
  custom_viewport: false,
  custom_viewport_value: '',
  viewport_mobile: false,
  viewport_phablet: false,
  viewport_tablet: false,
  viewport_desktop: false,
  viewport_height: ''
})

const isSubmitting = ref(false)

// Modal states
const showRuleModal = ref(false)
const showInfoModal = ref(false)
const editingRuleIndex = ref(-1)

// Rule form data
const ruleForm = ref({
  url: '',
  type: 'primary',
  scope: 'Domain'
})

// Add or edit rule
const saveRule = () => {
  if (editingRuleIndex.value >= 0) {
    moreOptionsData.value.rules[editingRuleIndex.value] = { ...ruleForm.value, id: Date.now() }
  } else {
    moreOptionsData.value.rules.push({ ...ruleForm.value, id: Date.now() })
  }
  resetRuleForm()
  showRuleModal.value = false
}

const editRule = (index) => {
  editingRuleIndex.value = index
  ruleForm.value = { ...moreOptionsData.value.rules[index] }
  showRuleModal.value = true
}

const deleteRule = (index) => {
  moreOptionsData.value.rules.splice(index, 1)
}

const clearAllRules = () => {
  moreOptionsData.value.rules = []
}

const resetRuleForm = () => {
  ruleForm.value = {
    url: '',
    type: 'primary',
    scope: 'Domain'
  }
  editingRuleIndex.value = -1
}

const clearHotLinks = () => {
  moreOptionsData.value.hot_links = ''
}

// Replace the entire handleSubmit function with this corrected version:
const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    
    // Prepare payload with only required backend fields
    const payload = {
      agent: user.value.name,
      name: formData.value.name,
        starting_url: formData.value.starting_url
            .split(',')
            .map(url => url.trim()) // Remove whitespace
            .filter(url => url.length > 0) // Remove empty strings
    }

    console.log('Creating archive with payload:', payload)

    const response = await $fetch('/api/jobs/create', {
      method: 'POST',
      body: payload
    })

    console.log('Archive created successfully:', response)
    
    // Show success message using vue-sonner
    toast.success('Archive created successfully!')
    
    // Reset form after successful submission
    formData.value = {
      starting_url: '',
      name: '',
      agent: user.value.name,
      schedule_date: '',
      schedule_time: '',
      follow_robots: false,
      more_options: false
    }
    
    // Reset more options data
    moreOptionsData.value = {
      rules: [],
      max_urls: 12,
      max_time: 21,
      depth: 21,
      automatic_warc_export: true,
      proxy: false,
      compress: false,
      stop_after: 10,
      agent: 'Aleph',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
      max_workers: '',
      page_load: '',
      queue_weight: '',
      update_existing_resources: true,
      follow_redirects: false,
      png_snapshots: false,
      pdf_snapshots: false,
      ignore_ssl_errors: true,
      enable_scroll: false,
      view_height: 400,
      resources_pause_time: 100,
      velocity: 0,
      video_transcode: false,
      compatible_codec_brand: false,
      hot_links: '',
      sanitizer_rules: '',
      harmonizer_scripts: '',
      link_discoverer: '',
      cookies_filters: '',
      cookies_seeds: '',
      custom_viewport: false,
      custom_viewport_value: '',
      viewport_mobile: false,
      viewport_phablet: false,
      viewport_tablet: false,
      viewport_desktop: false,
      viewport_height: ''
    }
    
    // Redirect to completed page
    await navigateTo('/completed')
    
  } catch (error) {
    console.error('Error creating archive:', error)
    
    // Handle different types of errors with user-friendly messages using vue-sonner
    if (error.statusCode) {
      switch (error.statusCode) {
        case 400:
          toast.error('Invalid archive data. Please check your input and try again.')
          break
        case 401:
          toast.error('Session expired. Please log in again.')
          // Optionally redirect to login
          await navigateTo('/login')
          break
        case 403:
          toast.error('You don\'t have permission to create archives.')
          break
        case 409:
          toast.error('An archive with similar parameters already exists.')
          break
        case 422:
          toast.error('Archive data validation failed. Please check your input.')
          break
        case 429:
          toast.error('Too many requests. Please wait before creating another archive.')
          break
        case 500:
          toast.error('Server error occurred. Please try again later.')
          break
        case 503:
          toast.error('Archive service is temporarily unavailable. Please try again later.')
          break
        default:
          toast.error(error.statusMessage || 'Failed to create archive. Please try again.')
      }
    } else if (error.message) {
      toast.error(error.message)
    } else {
      toast.error('An unexpected error occurred. Please try again.')
    }
  } finally {
    isSubmitting.value = false
  }
}

const getCurrentDate = () => {
  const now = new Date()
  return now.toISOString().split('T')[0]
}
</script>

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
            <Globe class="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-sidebar-foreground tracking-tight">
              New Archive
            </h1>
            <p class="text-xs sm:text-sm text-sidebar-foreground/70">
              Create a new web archive job with advanced configuration
            </p>
          </div>
        </div>
      </div>

      <!-- Stats Cards Section -->
      <div class="jobs-data">
        <div class="grid grid-cols-3 gap-2 sm:gap-3">
          <!-- Terminated Jobs -->
          <div class="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30 border border-green-200/50 dark:border-green-800/50 rounded-lg p-2 sm:p-3 transition-all duration-200 hover:shadow-md hover:scale-105">
            <div class="flex flex-col items-center text-center space-y-1">
              <div class="p-1.5 bg-green-500/10 rounded-md">
                <CircleCheckBig class="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p class="text-sm sm:text-lg font-bold text-green-700 dark:text-green-300">
                  {{ terminatedData || 0 }}
                </p>
                <p class="text-[10px] sm:text-xs text-green-600/80 dark:text-green-400/80 font-medium">
                  Completed
                </p>
              </div>
            </div>
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>

          <!-- Pending Jobs -->
          <div class="group relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 border border-amber-200/50 dark:border-amber-800/50 rounded-lg p-2 sm:p-3 transition-all duration-200 hover:shadow-md hover:scale-105">
            <div class="flex flex-col items-center text-center space-y-1">
              <div class="p-1.5 bg-amber-500/10 rounded-md">
                <Clock class="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p class="text-sm sm:text-lg font-bold text-amber-700 dark:text-amber-300">
                  {{ pendingData || 0 }}
                </p>
                <p class="text-[10px] sm:text-xs text-amber-600/80 dark:text-amber-400/80 font-medium">
                  Pending
                </p>
              </div>
            </div>
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>

          <!-- Running Jobs -->
          <div class="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 rounded-lg p-2 sm:p-3 transition-all duration-200 hover:shadow-md hover:scale-105">
            <div class="flex flex-col items-center text-center space-y-1">
              <div class="p-1.5 bg-blue-500/10 rounded-md">
                <Archive class="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p class="text-sm sm:text-lg font-bold text-blue-700 dark:text-blue-300">
                  {{ runningData || 0 }}
                </p>
                <p class="text-[10px] sm:text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">
                  Running
                </p>
              </div>
            </div>
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      <!-- Form Section -->
      <section class="pb-8 px-6">
        <div class="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Globe class="h-5 w-5" />
                Archive Configuration
              </CardTitle>
              <CardDescription>
                Configure your web archive job with the settings below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form @submit.prevent="handleSubmit" class="space-y-6">
                <!-- Basic Fields -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <Label for="starting_url">Starting URL(s) comma separated *</Label>
                    <Input
                      id="starting_url"
                      v-model="formData.starting_url"
                      type="url"
                      placeholder="https://example.com"
                      required
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="name">Archive Name *</Label>
                    <Input
                      id="name"
                      v-model="formData.name"
                      type="text"
                      placeholder="My Website Archive"
                      required
                    />
                  </div>
                </div>

                <!-- Schedule -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <Label for="schedule_date">Schedule Date</Label>
                    <Input
                      id="schedule_date"
                      v-model="formData.schedule_date"
                      type="date"
                      :min="getCurrentDate()"
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="schedule_time">Schedule Time</Label>
                    <Input
                      id="schedule_time"
                      v-model="formData.schedule_time"
                      type="time"
                    />
                  </div>
                </div>

                <!-- Checkboxes -->
                <div class="space-y-4">
                  <div class="flex items-center space-x-3">
                    <Checkbox id="follow_robots" v-model:checked="formData.follow_robots" />
                    <Label for="follow_robots">Follow robots.txt</Label>
                  </div>
                  <div class="flex items-center space-x-3">
                    <Checkbox id="more_options" v-model:checked="formData.more_options" />
                    <Label for="more_options" class="flex items-center gap-2">
                      <Settings class="h-4 w-4" />
                      More Options
                    </Label>
                  </div>
                </div>

                <!-- More Options Section -->
                <Transition
                  enter-active-class="transition-all duration-300 ease-out"
                  enter-from-class="opacity-0 max-h-0"
                  enter-to-class="opacity-100 max-h-full"
                  leave-active-class="transition-all duration-300 ease-in"
                  leave-from-class="opacity-100 max-h-full"
                  leave-to-class="opacity-0 max-h-0"
                >
                  <div v-if="formData.more_options" class="space-y-8 p-6 border rounded-lg bg-muted/30">
                    
                    <!-- 1. Fine Grained Scoping -->
                    <div class="space-y-4">
                      <div class="flex items-center gap-2">
                        <h3 class="text-lg font-semibold">Fine Grained Scoping</h3>
                        <Dialog v-model:open="showInfoModal">
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Info class="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Fine Grained Scoping Information</DialogTitle>
                            </DialogHeader>
                            <div class="p-4 bg-muted rounded-lg">
                              <p class="text-sm text-muted-foreground">Information image will be displayed here</p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      <div class="flex justify-between items-center">
                        <Dialog v-model:open="showRuleModal">
                          <DialogTrigger asChild>
                            <Button @click="resetRuleForm">
                              <Plus class="h-4 w-4 mr-2" />
                              Add Rule
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{{ editingRuleIndex >= 0 ? 'Edit Rule' : 'Add Rule' }}</DialogTitle>
                            </DialogHeader>
                            <div class="space-y-4">
                              <div class="space-y-2">
                                <Label for="rule_url">URL</Label>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Input
                                      id="rule_url"
                                      v-model="ruleForm.url"
                                      type="url"
                                      placeholder="Enter URL"
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div class="text-xs">
                                      <p>domain: nytimes.com</p>
                                      <p>Path: wikipedia.org/usa</p>
                                      <p>regExp: /#google.com/^</p>
                                      <p>page: webarchiving.com/page.html</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <div class="space-y-2">
                                <Label>Type</Label>
                                <Select v-model="ruleForm.type">
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="primary">Primary</SelectItem>
                                    <SelectItem value="include">Include</SelectItem>
                                    <SelectItem value="exclude">Exclude</SelectItem>
                                    <SelectItem value="bad_asset">Bad Asset</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div class="space-y-2">
                                <Label>Scope</Label>
                                <Select v-model="ruleForm.scope">
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Domain">Domain</SelectItem>
                                    <SelectItem value="Path">Path</SelectItem>
                                    <SelectItem value="Page">Page</SelectItem>
                                    <SelectItem value="Regular Expression">Regular Expression</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button @click="saveRule">Save Rule</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button v-if="moreOptionsData.rules.length > 0" variant="destructive" @click="clearAllRules">
                          Remove All Rules
                        </Button>
                      </div>

                      <!-- Rules Table -->
                      <div v-if="moreOptionsData.rules.length > 0" class="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>URL</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Scope</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow v-for="(rule, index) in moreOptionsData.rules" :key="rule.id">
                              <TableCell>{{ rule.url }}</TableCell>
                              <TableCell>{{ rule.type }}</TableCell>
                              <TableCell>{{ rule.scope }}</TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal class="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem @click="editRule(index)">
                                      <Edit class="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="deleteRule(index)" class="text-destructive">
                                      <Trash2 class="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <!-- Layout Grid for sections -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <!-- Left Column -->
                      <div class="space-y-8">
                        <!-- 2. Ending Conditions -->
                        <div class="space-y-4">
                          <h3 class="text-lg font-semibold">Ending Conditions</h3>
                          <div class="space-y-4">
                            <div class="space-y-2">
                              <Label>Max. URLs</Label>
                              <Input
                                v-model.number="moreOptionsData.max_urls"
                                type="number"
                                placeholder="max urls eg: 12"
                              />
                            </div>
                            <div class="space-y-2">
                              <Label>Max. Time</Label>
                              <Input
                                v-model.number="moreOptionsData.max_time"
                                type="number"
                              />
                            </div>
                            <div class="space-y-2">
                              <Label>Depth</Label>
                              <Input
                                v-model.number="moreOptionsData.depth"
                                type="number"
                              />
                            </div>
                          </div>
                        </div>

                        <!-- 3. Actions -->
                        <div class="space-y-4">
                          <h3 class="text-lg font-semibold">Actions</h3>
                          <div class="space-y-4">
                            <div class="flex items-center justify-between">
                              <Label>Automatic WARC Export</Label>
                              <Switch v-model:checked="moreOptionsData.automatic_warc_export" />
                            </div>
                            <div class="flex items-center justify-between">
                              <Label>Proxy</Label>
                              <Switch v-model:checked="moreOptionsData.proxy" />
                            </div>
                            <div class="flex items-center justify-between">
                              <Label>Compress</Label>
                              <Switch v-model:checked="moreOptionsData.compress" />
                            </div>
                            <div class="space-y-2">
                              <Label>Stop after</Label>
                              <Input
                                v-model.number="moreOptionsData.stop_after"
                                type="number"
                                placeholder="grace termination period, default: 5 sec"
                              />
                            </div>
                            <div class="space-y-2">
                              <Label>Agent</Label>
                              <Select v-model="moreOptionsData.agent">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Aleph">Aleph</SelectItem>
                                  <SelectItem value="Jane">Jane</SelectItem>
                                  <SelectItem value="Jack">Jack</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <!-- 5. Behaviour per page -->
                        <div class="space-y-4">
                          <h3 class="text-lg font-semibold">Behaviour per page</h3>
                          <div class="space-y-4">
                            <div class="flex items-center justify-between">
                              <Label>Enable scroll</Label>
                              <Switch v-model:checked="moreOptionsData.enable_scroll" />
                            </div>
                            <div class="space-y-2">
                              <Label>View Height</Label>
                              <Input
                                :value="moreOptionsData.view_height"
                                disabled
                                class="bg-muted"
                              />
                            </div>
                            <div class="space-y-2">
                              <Label>Resources Pause Time</Label>
                              <Input
                                :value="moreOptionsData.resources_pause_time"
                                disabled
                                class="bg-muted"
                              />
                            </div>
                            <div class="space-y-2">
                              <Label>Velocity (ms)</Label>
                              <Input
                                :value="`resource-velocity (default:${moreOptionsData.velocity}ms)`"
                                disabled
                                class="bg-muted"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Right Column -->
                      <div class="lg:col-span-2 space-y-8">
                        <!-- 4. Behaviour -->
                        <div class="space-y-4">
                          <h3 class="text-lg font-semibold">Behaviour</h3>
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-4">
                              <div class="space-y-2">
                                <Label>User Agent</Label>
                                <Textarea
                                  v-model="moreOptionsData.user_agent"
                                  rows="3"
                                />
                              </div>
                              <div class="space-y-2">
                                <Label>Max. Workers</Label>
                                <Input
                                  v-model="moreOptionsData.max_workers"
                                  placeholder="maximum of worker (default: 5)"
                                />
                              </div>
                              <div class="space-y-2">
                                <Label>Page Load</Label>
                                <Input
                                  v-model="moreOptionsData.page_load"
                                  placeholder="timeout when loading URL (default: 5 sec.)"
                                />
                              </div>
                              <div class="space-y-2">
                                <Label>Queue Weight</Label>
                                <Input
                                  v-model="moreOptionsData.queue_weight"
                                  placeholder="number of seeds to archive per queue (default: 1)"
                                />
                              </div>
                            </div>
                            <div class="space-y-4">
                              <div class="flex items-center justify-between">
                                <Label>Update Existing Resources</Label>
                                <Switch v-model:checked="moreOptionsData.update_existing_resources" />
                              </div>
                              <div class="flex items-center justify-between">
                                <Label>Follow Redirects</Label>
                                <Switch v-model:checked="moreOptionsData.follow_redirects" />
                              </div>
                              <div class="flex items-center justify-between">
                                <Label>PNG snapshots</Label>
                                <Switch v-model:checked="moreOptionsData.png_snapshots" />
                              </div>
                              <div class="flex items-center justify-between">
                                <Label>PDF snapshots</Label>
                                <Switch v-model:checked="moreOptionsData.pdf_snapshots" />
                              </div>
                              <div class="flex items-center justify-between">
                                <Label>Ignore SSL errors</Label>
                                <Switch v-model:checked="moreOptionsData.ignore_ssl_errors" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- 6. Audio/Video -->
                        <div class="space-y-4">
                          <h3 class="text-lg font-semibold">Audio/Video</h3>
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex items-center justify-between">
                              <Label>Video Transcode (WebM)</Label>
                              <Switch v-model:checked="moreOptionsData.video_transcode" />
                            </div>
                            <div class="flex items-center justify-between">
                              <Label>Compatible Codec Brand</Label>
                              <Switch v-model:checked="moreOptionsData.compatible_codec_brand" />
                            </div>
                          </div>
                        </div>

                        <!-- 7. Hot links -->
                        <div class="space-y-4">
                          <h3 class="text-lg font-semibold">Hot links</h3>
                          <div class="space-y-2">
                            <div class="relative">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Textarea
                                    v-model="moreOptionsData.hot_links"
                                    rows="4"
                                    placeholder="Enter URLs..."
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>A list of urls with high Priority (Copy/paste a comma separated list)</p>
                                </TooltipContent>
                              </Tooltip>
                              <Button
                                v-if="moreOptionsData.hot_links"
                                variant="ghost"
                                size="sm"
                                class="absolute top-2 right-2"
                                @click="clearHotLinks"
                              >
                                <X class="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <!-- 8. Advanced Options -->
                        <div class="space-y-4">
                          <h3 class="text-lg font-semibold">Advanced Options</h3>
                          <Tabs default-value="sanitizer" class="w-full">
                            <!-- Responsive TabsList - scrollable on mobile, grid on larger screens -->
                            <TabsList class="grid w-full grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 h-auto">
                              <TabsTrigger value="sanitizer" class="text-xs sm:text-sm px-2 py-2">
                                <span class="hidden sm:inline">Sanitizer Rules</span>
                                <span class="sm:hidden">Sanitizer</span>
                              </TabsTrigger>
                              <TabsTrigger value="harmonizer" class="text-xs sm:text-sm px-2 py-2">
                                <span class="hidden sm:inline">Harmonizer Scripts</span>
                                <span class="sm:hidden">Harmonizer</span>
                              </TabsTrigger>
                              <TabsTrigger value="discoverer" class="text-xs sm:text-sm px-2 py-2">
                                <span class="hidden sm:inline">Link Discoverer</span>
                                <span class="sm:hidden">Discoverer</span>
                              </TabsTrigger>
                              <TabsTrigger value="cookies" class="text-xs sm:text-sm px-2 py-2">
                                Cookies
                              </TabsTrigger>
                              <TabsTrigger value="responsive" class="text-xs sm:text-sm px-2 py-2 col-span-2 sm:col-span-1">
                                <span class="hidden sm:inline">Responsive UI</span>
                                <span class="sm:hidden">Responsive</span>
                              </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="sanitizer" class="space-y-2 mt-4">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Textarea
                                    v-model="moreOptionsData.sanitizer_rules"
                                    rows="4"
                                    class="min-h-[100px] sm:min-h-[120px] lg:min-h-[150px]"
                                    placeholder="Enter sanitizer rules..."
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Rules to mutate URLs during the crawl</p>
                                </TooltipContent>
                              </Tooltip>
                            </TabsContent>
                            
                            <TabsContent value="harmonizer" class="space-y-2 mt-4">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Textarea
                                    v-model="moreOptionsData.harmonizer_scripts"
                                    rows="4"
                                    class="min-h-[100px] sm:min-h-[120px] lg:min-h-[150px]"
                                    placeholder="Enter harmonizer scripts..."
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Scripts to enhance archive browsing experience</p>
                                </TooltipContent>
                              </Tooltip>
                            </TabsContent>
                            
                            <TabsContent value="discoverer" class="space-y-2 mt-4">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Textarea
                                    v-model="moreOptionsData.link_discoverer"
                                    rows="4"
                                    class="min-h-[100px] sm:min-h-[120px] lg:min-h-[150px]"
                                    placeholder="Enter link discoverer settings..."
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Link Discoverer tooltip</p>
                                </TooltipContent>
                              </Tooltip>
                            </TabsContent>
                            
                            <TabsContent value="cookies" class="space-y-4 mt-4">
                              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div class="space-y-2">
                                  <Label class="text-sm font-medium">Filters</Label>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Textarea
                                        v-model="moreOptionsData.cookies_filters"
                                        rows="3"
                                        class="min-h-[80px] sm:min-h-[90px]"
                                        placeholder="Enter cookie filters..."
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Filter textarea</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <div class="space-y-2">
                                  <Label class="text-sm font-medium">Seeds</Label>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Textarea
                                        v-model="moreOptionsData.cookies_seeds"
                                        rows="3"
                                        class="min-h-[80px] sm:min-h-[90px]"
                                        placeholder="Enter cookie seeds..."
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Seeds textarea</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="responsive" class="space-y-4 mt-4">
                              <div class="space-y-4">
                                <div class="flex items-center space-x-3">
                                  <Checkbox 
                                    id="custom_viewport" 
                                    v-model:checked="moreOptionsData.custom_viewport" 
                                  />
                                  <Label for="custom_viewport" class="text-sm font-medium">Custom viewport</Label>
                                </div>
                                
                                <div v-if="moreOptionsData.custom_viewport" class="space-y-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Input
                                        v-model="moreOptionsData.custom_viewport_value"
                                        placeholder="Enter custom viewport..."
                                        class="w-full"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Custom viewport</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                
                                <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                  <div class="flex items-center space-x-2">
                                    <Checkbox 
                                      id="viewport_mobile" 
                                      v-model:checked="moreOptionsData.viewport_mobile" 
                                    />
                                    <Label for="viewport_mobile" class="text-sm">Mobile</Label>
                                  </div>
                                  <div class="flex items-center space-x-2">
                                    <Checkbox 
                                      id="viewport_phablet" 
                                      v-model:checked="moreOptionsData.viewport_phablet" 
                                    />
                                    <Label for="viewport_phablet" class="text-sm">Phablet</Label>
                                  </div>
                                  <div class="flex items-center space-x-2">
                                    <Checkbox 
                                      id="viewport_tablet" 
                                      v-model:checked="moreOptionsData.viewport_tablet" 
                                    />
                                    <Label for="viewport_tablet" class="text-sm">Tablet</Label>
                                  </div>
                                  <div class="flex items-center space-x-2">
                                    <Checkbox 
                                      id="viewport_desktop" 
                                      v-model:checked="moreOptionsData.viewport_desktop" 
                                    />
                                    <Label for="viewport_desktop" class="text-sm">Desktop</Label>
                                  </div>
                                </div>
                                
                                <div class="space-y-2">
                                  <Label class="text-sm font-medium">Viewport height</Label>
                                  <Input
                                    v-model="moreOptionsData.viewport_height"
                                    placeholder="Enter viewport height..."
                                    class="w-full"
                                  />
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </div>
                    </div>
                  </div>
                </Transition>

                <!-- Submit Button -->
                <div class="flex justify-end pt-6">
                  <Button
                    type="submit"
                    :disabled="isSubmitting || !formData.starting_url || !formData.name"
                    class="min-w-32"
                  >
                    <span v-if="isSubmitting" class="flex items-center gap-2">
                      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </span>
                    <span v-else class="flex items-center gap-2">
                      <Archive class="h-4 w-4" />
                      Create Archive
                    </span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  </TooltipProvider>
</template>

<style scoped>
.max-h-0 {
  max-height: 0;
  overflow: hidden;
}

.max-h-full {
  max-height: none;
  overflow: visible;
}
</style>
