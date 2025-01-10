import React, { useState } from "react"
import { useWebSocket } from "@/lib/hooks/use-websocket"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

export function WebSocketTest() {
  const { sendMessage, isConnected, messages } = useWebSocket()
  const [message, setMessage] = useState("")

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message)
      setMessage("")
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>
      
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter message"
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button onClick={handleSend} disabled={!isConnected}>
          Send
        </Button>
      </div>

      <div className="border rounded-lg p-4 h-[300px] overflow-y-auto space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className="text-sm">
            {msg.message}
          </div>
        ))}
      </div>
    </div>
  )
} 