import { WebSocketServer, WebSocket } from "ws"
import {
  storeConnection,
  removeConnection,
  getConnection,
  formatMessage,
  listRoomConnections,
  getRoom,
} from "../lib/services/websocket"
import { parse } from "url"
import { Message } from "../lib/types/chat"

interface ExtendedWebSocket extends WebSocket {
  connectionId?: string
  userId?: string
}

interface WebSocketMessage {
  type: "message" | "typing" | "join_room" | "leave_room"
  content?: string
  roomId?: string
}

const wss = new WebSocketServer({ port: 3001 })
const clients = new Map<string, ExtendedWebSocket>()

wss.on("connection", async (ws: ExtendedWebSocket, req) => {
  const connectionId = Math.random().toString(36).substring(2)
  const { query } = parse(req.url || "", true)
  const userId = query.userId as string

  if (!userId) {
    ws.close(1008, "User ID is required")
    return
  }

  ws.connectionId = connectionId
  ws.userId = userId

  // Store connection in S3
  await storeConnection(connectionId, userId)
  clients.set(connectionId, ws)

  // Send welcome message
  ws.send(JSON.stringify(
    formatMessage("system", `Connected with ID: ${connectionId}`, "system")
  ))

  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString()) as WebSocketMessage
      const connection = await getConnection(connectionId)
      
      if (!connection) {
        ws.close(1008, "Connection not found")
        return
      }

      switch (message.type) {
        case "message":
          if (!message.content || !message.roomId) break
          
          const room = await getRoom(message.roomId)
          if (!room) break

          const formattedMessage = formatMessage("chat", message.content, userId)
          const messageStr = JSON.stringify(formattedMessage)
          
          // Get all connections in the room and broadcast
          const roomConnections = await listRoomConnections(message.roomId)
          roomConnections.forEach((conn) => {
            const client = clients.get(conn.connectionId)
            if (client?.readyState === WebSocket.OPEN) {
              client.send(messageStr)
            }
          })
          break

        case "typing":
          if (!message.roomId) break
          
          const typingMessage = formatMessage("system", `${userId} is typing...`, "system")
          const roomConns = await listRoomConnections(message.roomId)
          roomConns.forEach((conn) => {
            const client = clients.get(conn.connectionId)
            if (client?.readyState === WebSocket.OPEN && client.userId !== userId) {
              client.send(JSON.stringify(typingMessage))
            }
          })
          break

        case "join_room":
          if (!message.roomId) break
          
          const updatedConnection = {
            ...connection,
            rooms: [...new Set([...connection.rooms, message.roomId])],
          }
          await storeConnection(connectionId, userId, updatedConnection.rooms)
          break

        case "leave_room":
          if (!message.roomId) break
          
          const filteredRooms = connection.rooms.filter((id) => id !== message.roomId)
          await storeConnection(connectionId, userId, filteredRooms)
          break
      }
    } catch (error) {
      console.error("Error processing message:", error)
      ws.send(JSON.stringify(
        formatMessage("system", "Error processing message", "system")
      ))
    }
  })

  ws.on("close", async () => {
    await removeConnection(connectionId)
    clients.delete(connectionId)
  })

  ws.on("error", async (error) => {
    console.error("WebSocket error:", error)
    await removeConnection(connectionId)
    clients.delete(connectionId)
  })
})

console.log("WebSocket server running on ws://localhost:3001") 