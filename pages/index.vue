<template>
  <div class="space-y-6">
    <div class="bg-white shadow rounded-lg p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">
        Dashboard
      </h1>
      <p class="text-gray-600">
        Welcome to AlephArchive, {{ authStore.currentUser?.name }}!
      </p>
    </div>

    <!-- Navigation Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <NuxtLink 
        to="/new" 
        class="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <div class="flex items-center">
          <Plus class="h-8 w-8 text-blue-600" />
          <div class="ml-4">
            <h3 class="text-lg font-medium text-gray-900">New Job</h3>
            <p class="text-sm text-gray-500">Create a new crawl job</p>
          </div>
        </div>
      </NuxtLink>

      <NuxtLink 
        to="/pending" 
        class="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <div class="flex items-center">
          <Clock class="h-8 w-8 text-yellow-600" />
          <div class="ml-4">
            <h3 class="text-lg font-medium text-gray-900">Pending</h3>
            <p class="text-sm text-gray-500">View pending jobs</p>
          </div>
        </div>
      </NuxtLink>

      <NuxtLink 
        to="/running" 
        class="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <div class="flex items-center">
          <Play class="h-8 w-8 text-green-600" />
          <div class="ml-4">
            <h3 class="text-lg font-medium text-gray-900">Running</h3>
            <p class="text-sm text-gray-500">View running jobs</p>
          </div>
        </div>
      </NuxtLink>

      <NuxtLink 
        to="/completed" 
        class="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <div class="flex items-center">
          <CheckCircle class="h-8 w-8 text-blue-600" />
          <div class="ml-4">
            <h3 class="text-lg font-medium text-gray-900">Completed</h3>
            <p class="text-sm text-gray-500">View completed jobs</p>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { Plus, Clock, Play, CheckCircle } from 'lucide-vue-next'
import { definePageMeta } from '#imports'

const authStore = useAuthStore()

</script>
