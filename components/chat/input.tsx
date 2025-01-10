import React, { useState, useRef, useCallback } from "react"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { PaperclipIcon, SendIcon } from "lucide-react"
import { useWebSocket } from "../../lib/hooks/useWebSocket"
import { useChatStore } from "../../lib/stores/chat"
import { cn } from "../../lib/utils"
import { uploadFile } from "../../lib/services/upload"
import { toast } from "sonner"

interface ChatInputProps {
  roomId: string
  userId: string
  onSend?: () => void
}

export function ChatInput({ roomId, userId, onSend }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { sendMessage, sendTypingIndicator } = useWebSocket({ userId })
  const typingTimeout = useRef<NodeJS.Timeout>()

  const handleTyping = useCallback(() => {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current)
    }
    sendTypingIndicator(roomId)
    typingTimeout.current = setTimeout(() => {
      sendTypingIndicator(roomId)
    }, 3000)
  }, [roomId, sendTypingIndicator])

  const handleSend = useCallback(() => {
    if (message.trim()) {
      sendMessage(message.trim(), roomId)
      setMessage("")
      onSend?.()
    }
  }, [message, roomId, sendMessage, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      try {
        setIsUploading(true)
        const { url, name } = await uploadFile(file)
        const isImage = file.type.startsWith("image/")
        sendMessage(JSON.stringify({
          type: isImage ? "image" : "file",
          url,
          name,
        }), roomId)
      } catch (error) {
        console.error("Error uploading file:", error)
        toast.error("Failed to upload file")
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    },
    [roomId, sendMessage]
  )

  return (
    <div className="flex items-end gap-2 p-4 border-t bg-background">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <PaperclipIcon className="h-5 w-5" />
      </Button>
      <Textarea
        value={message}
        onChange={(e) => {
          setMessage(e.target.value)
          handleTyping()
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="min-h-[80px] max-h-[200px]"
      />
      <Button
        className={cn("shrink-0", !message.trim() && "opacity-50")}
        onClick={handleSend}
        disabled={!message.trim() || isUploading}
      >
        <SendIcon className="h-5 w-5" />
      </Button>
    </div>
  )
} 