import React from "react"
import { ScrollArea } from "../ui/scroll-area"
import { Button } from "../ui/button"
import { ChatRoom } from "../../lib/types/chat"
import { cn } from "../../lib/utils"
import { format } from "date-fns"

interface ChatRoomListProps {
  rooms: ChatRoom[]
  activeRoomId?: string
  onRoomSelect: (roomId: string) => void
}

export function ChatRoomList({ rooms, activeRoomId, onRoomSelect }: ChatRoomListProps) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-4">
        {rooms.map((room) => (
          <Button
            key={room.id}
            variant={activeRoomId === room.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start px-4",
              activeRoomId === room.id && "bg-secondary"
            )}
            onClick={() => onRoomSelect(room.id)}
          >
            <div className="flex flex-col items-start">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{room.name}</span>
                {room.unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    {room.unreadCount}
                  </span>
                )}
              </div>
              {room.lastMessage && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="truncate max-w-[150px]">
                    {room.lastMessage.content}
                  </span>
                  <span className="text-xs">
                    {format(room.lastMessage.timestamp, "HH:mm")}
                  </span>
                </div>
              )}
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  )
} 