import { useState, useEffect, useCallback, useRef } from "react"
import { Message } from "../types/chat"
import { useChatStore } from "../stores/chat"

interface UseWebSocketOptions {
  userId: string
  onMessage?: (message: Message) => void
  onError?: (error: Event) => void
}

export function useWebSocket({ userId, onMessage, onError }: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const { actions } = useChatStore()

  useEffect(() => {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?userId=${userId}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      actions.setConnected(true)
    }

    ws.onclose = () => {
      setIsConnected(false)
      actions.setConnected(false)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as Message
        actions.addMessage(message)
        onMessage?.(message)
      } catch (error) {
        console.error("Error parsing message:", error)
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      onError?.(error)
    }

    return () => {
      ws.close()
    }
  }, [userId, onMessage, onError, actions])

  const sendMessage = useCallback((content: string, roomId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "message",
        content,
        roomId,
      }))
    }
  }, [])

  const sendTypingIndicator = useCallback((roomId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "typing",
        roomId,
      }))
    }
  }, [])

  const joinRoom = useCallback((roomId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "join_room",
        roomId,
      }))
    }
  }, [])

  const leaveRoom = useCallback((roomId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "leave_room",
        roomId,
      }))
    }
  }, [])

  return {
    isConnected,
    sendMessage,
    sendTypingIndicator,
    joinRoom,
    leaveRoom,
  }
} 