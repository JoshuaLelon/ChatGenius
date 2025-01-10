export interface Message {
  id: string
  type: "chat" | "system"
  content: string
  sender: string
  timestamp: number
  attachments?: {
    type: "image" | "file"
    url: string
    name: string
  }[]
}

export interface ChatUser {
  id: string
  name: string
  avatar?: string
  status: "online" | "offline" | "away"
  lastSeen?: number
}

export interface ChatRoom {
  id: string
  name: string
  type: "direct" | "group"
  participants: string[]
  lastMessage?: Message
  unreadCount: number
}

export interface TypingIndicator {
  userId: string
  roomId: string
  timestamp: number
} 