<script setup lang="ts">
import { onMounted } from 'vue'

</script>

<template>
  <div class="flex flex-col min-h-screen">
    <Toast />  <SidebarProvider>
    <LayoutAppSidebar />
    <SidebarInset>
      <LayoutHeader />
      <div class="min-w-0 w-full flex-1 overflow-x-auto p-4 lg:p-6">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<style scoped>

</style>
