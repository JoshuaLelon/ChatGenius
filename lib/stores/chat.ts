import { create } from "zustand"
import { Message } from "../types/chat"

interface ChatState {
  messages: Message[]
  isConnected: boolean
  isTyping: { [userId: string]: boolean }
  activeUsers: string[]
  actions: {
    addMessage: (message: Message) => void
    setConnected: (connected: boolean) => void
    setTyping: (userId: string, isTyping: boolean) => void
    setActiveUsers: (users: string[]) => void
    clearMessages: () => void
  }
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isConnected: false,
  isTyping: {},
  activeUsers: [],
  actions: {
    addMessage: (message) =>
      set((state) => ({
        messages: [...state.messages, message],
      })),
    setConnected: (connected) =>
      set(() => ({
        isConnected: connected,
      })),
    setTyping: (userId, isTyping) =>
      set((state) => ({
        isTyping: {
          ...state.isTyping,
          [userId]: isTyping,
        },
      })),
    setActiveUsers: (users) =>
      set(() => ({
        activeUsers: users,
      })),
    clearMessages: () =>
      set(() => ({
        messages: [],
      })),
  },
})) 