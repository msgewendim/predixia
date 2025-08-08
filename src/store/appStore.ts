import { create } from 'zustand'

interface AppStore {
  isSidebarCollapsed: boolean
  setIsSidebarCollapsed: (collapsed: boolean) => void
}



export const useAppStore = create<AppStore>((set) => ({
  isSidebarCollapsed: false,
  setIsSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
}))