"use client"

import React, { useState } from "react"
import { useUser } from "@auth0/auth0-react"
import { ChatContainer } from "../../components/chat/container"
import { ChatRoomList } from "../../components/chat/room-list"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../../components/ui/resizable"

export default function ChatPage() {
  const { user } = useUser()
  const [activeRoomId, setActiveRoomId] = useState<string>()
  const [rooms] = useState([
    {
      id: "general",
      name: "General",
      type: "group" as const,
      participants: [],
      unreadCount: 0,
    },
    {
      id: "random",
      name: "Random",
      type: "group" as const,
      participants: [],
      unreadCount: 2,
    },
  ])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to access the chat.</p>
      </div>
    )
  }

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25} minSize={20}>
          <ChatRoomList
            rooms={rooms}
            activeRoomId={activeRoomId}
            onRoomSelect={setActiveRoomId}
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={75}>
          {activeRoomId ? (
            <ChatContainer
              roomId={activeRoomId}
              userId={user.sub!}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a room to start chatting
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
} 