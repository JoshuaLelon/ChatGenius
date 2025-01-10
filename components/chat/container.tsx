import React, { useEffect, useRef } from "react"
import { ScrollArea } from "../ui/scroll-area"
import { ChatMessage } from "./message"
import { ChatInput } from "./input"
import { useChatStore } from "../../lib/stores/chat"
import { useWebSocket } from "../../lib/hooks/useWebSocket"

interface ChatContainerProps {
  roomId: string
  userId: string
}

export function ChatContainer({ roomId, userId }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages } = useChatStore()
  const { joinRoom, leaveRoom } = useWebSocket({ userId })

  useEffect(() => {
    joinRoom(roomId)
    return () => {
      leaveRoom(roomId)
    }
  }, [roomId, joinRoom, leaveRoom])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isCurrentUser={message.sender === userId}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <ChatInput
        roomId={roomId}
        userId={userId}
      />
    </div>
  )
} 