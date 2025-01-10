import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { cn } from "../../lib/utils"
import { Message } from "../../lib/types/chat"
import { format } from "date-fns"

interface ChatMessageProps {
  message: Message
  isCurrentUser: boolean
}

export function ChatMessage({ message, isCurrentUser }: ChatMessageProps) {
  return (
    <div className={cn(
      "flex gap-3 p-4",
      isCurrentUser ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar>
        <AvatarImage src={`https://avatar.vercel.sh/${message.sender}`} />
        <AvatarFallback>{message.sender[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className={cn(
        "flex flex-col gap-1 max-w-[70%]",
        isCurrentUser ? "items-end" : "items-start"
      )}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {message.sender}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(message.timestamp, "HH:mm")}
          </span>
        </div>
        <div className={cn(
          "rounded-lg p-3",
          isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted",
          message.type === "system" && "bg-secondary text-secondary-foreground italic"
        )}>
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {message.attachments.map((attachment, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-background border">
                {attachment.type === "image" ? (
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="max-w-[200px] rounded-md"
                  />
                ) : (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {attachment.name}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 