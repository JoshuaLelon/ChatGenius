import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './use-auth'

interface WebSocketMessage {
  message: string
  [key: string]: any
}

export function useWebSocket() {
  const { getToken } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  const connect = useCallback(async () => {
    try {
      const token = await getToken()
      const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WEBSOCKET_URL}?token=${token}`)
      
      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        // Attempt to reconnect after 3 seconds
        setTimeout(connect, 3000)
      }

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        setMessages(prev => [...prev, message])
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
    }
  }, [getToken])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
      setIsConnected(false)
    }
  }, [])

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({ message }))
    }
  }, [isConnected])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    messages,
    sendMessage
  }
} 