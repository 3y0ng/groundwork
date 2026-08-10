// Ephemeral UI state (not persisted): controls the onboarding + setup modals.
import { create } from 'zustand'

export const WELCOME_KEY = 'groundwork-onboarded-v1'

interface UIState {
  setupOpen: boolean
  openSetup: () => void
  closeSetup: () => void
}

export const useUI = create<UIState>(set => ({
  setupOpen: false,
  openSetup: () => set({ setupOpen: true }),
  closeSetup: () => set({ setupOpen: false }),
}))
