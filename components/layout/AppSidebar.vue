<script setup lang="ts">
import type { NavGroup, NavLink, NavSectionTitle } from '~/types/nav'
import { navMenu, navMenuBottom } from '~/constants/menus'
const authStore = useAuthStore();
  
// const user = {
//   name: authStore.user?.name,
//   email: authStore.user?.login,
//   // avatar: userStore.avatar,
// }
function resolveNavItemComponent(item: NavLink | NavGroup | NavSectionTitle): any {
  if ('children' in item)
    return resolveComponent('LayoutSidebarNavGroup')

  return resolveComponent('LayoutSidebarNavLink')
}

const teams: {
  name: string
  logo: string
  plan: string
}[] = [
  {
    name: 'Aleph Archive',
    logo: 'i-lucide-gallery-vertical-end',
    plan: 'Enterprise',
  },
]

const user: {
  name: string
  email: string
  avatar: string
} = {
  name: authStore.user?.name ?? 'Aleph User',
  email: authStore.user?.login ?? 'Aleph',
  avatar: '/avatars/avatartion.png',
}

const { sidebar } = useAppSettings()
</script>

<template>
  <Sidebar :collapsible="sidebar.collapsible" :side="sidebar.side" :variant="sidebar.variant">
    <SidebarHeader>
      <LayoutSidebarNavHeader :teams="teams" />
      <Search />
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup v-for="(nav, indexGroup) in navMenu" :key="indexGroup">
        <SidebarGroupLabel v-if="nav.heading">
          {{ nav.heading }}
        </SidebarGroupLabel>
        <component :is="resolveNavItemComponent(item)" v-for="(item, index) in nav.items" :key="index" :item="item" />
      </SidebarGroup>
      <SidebarGroup class="mt-auto">
        <component :is="resolveNavItemComponent(item)" v-for="(item, index) in navMenuBottom" :key="index" :item="item" size="sm" />
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <LayoutSidebarNavFooter :user="user" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>

<style scoped>

</style>
