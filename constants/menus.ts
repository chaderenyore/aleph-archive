import type { NavMenu, NavMenuItems } from '~/types/nav'

export const navMenu: NavMenu[] = [
  {
    heading: 'General',
    items: [
      {
        title: 'Home',
        icon: 'i-lucide-home',
        link: '/',
      },
      {
        title: 'New',
        icon: 'i-lucide-archive',
        link: '/new',
      },
      {
        title: 'Pending',
        icon: 'i-lucide-trending-up',
        link: '/pending',
      },
      
    ],
  },
  {
    heading: 'Pages',
    items: [
     {
        title: 'Running',
        icon: 'i-lucide-loader',
        link: '/running',
      },
      {
        title: 'Completed',
        icon: 'i-lucide-circle-check-big',
        link: '/completed',
      },
      {
        title: 'Audits',
        icon: 'i-lucide-folder-search',
        link: '/audit',
      },
      
    ],
  },

]

export const navMenuBottom: NavMenuItems = [
  // {
  //   title: 'Help & Support',
  //   icon: 'i-lucide-circle-help',
  //   link: 'https://github.com/dianprata/nuxt-shadcn-dashboard',
  // },
  // {
  //   title: 'Feedback',
  //   icon: 'i-lucide-send',
  //   link: 'https://github.com/dianprata/nuxt-shadcn-dashboard',
  // },
]
