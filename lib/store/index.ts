import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface AppState {
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
}

export const useStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        isLoading: false,
        setIsLoading: (loading) => set({ isLoading: loading }),
        error: null,
        setError: (error) => set({ error }),
      }),
      {
        name: 'app-storage',
      }
    )
  )
) 