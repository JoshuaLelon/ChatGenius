import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { Message, ChatRoom, ChatUser } from "../types/chat"
import { v4 as uuidv4 } from "uuid"

const CONNECTIONS_PREFIX = "connections/"
const ROOMS_PREFIX = "rooms/"

interface Connection {
  connectionId: string
  userId: string
  timestamp: number
  rooms: string[]
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function storeConnection(connectionId: string, userId: string, rooms: string[] = []): Promise<void> {
  const connection: Connection = {
    connectionId,
    userId,
    timestamp: Date.now(),
    rooms,
  }

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${CONNECTIONS_PREFIX}${connectionId}`,
    Body: JSON.stringify(connection),
  })

  await s3Client.send(command)
}

export async function removeConnection(connectionId: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${CONNECTIONS_PREFIX}${connectionId}`,
  })

  await s3Client.send(command)
}

export async function getConnection(connectionId: string): Promise<Connection | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `${CONNECTIONS_PREFIX}${connectionId}`,
    })

    const response = await s3Client.send(command)
    const body = await response.Body?.transformToString()
    return body ? JSON.parse(body) : null
  } catch (error) {
    return null
  }
}

export async function listRoomConnections(roomId: string): Promise<Connection[]> {
  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_S3_BUCKET,
    Prefix: CONNECTIONS_PREFIX,
  })

  const response = await s3Client.send(command)
  const connections: Connection[] = []

  if (response.Contents) {
    for (const object of response.Contents) {
      if (object.Key) {
        const connection = await getConnection(object.Key.replace(CONNECTIONS_PREFIX, ""))
        if (connection && connection.rooms.includes(roomId)) {
          connections.push(connection)
        }
      }
    }
  }

  return connections
}

export function formatMessage(type: Message["type"], content: string, sender: string, attachments?: Message["attachments"]): Message {
  return {
    id: uuidv4(),
    type,
    content,
    sender,
    timestamp: Date.now(),
    attachments,
  }
}

export async function storeRoom(room: ChatRoom): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${ROOMS_PREFIX}${room.id}`,
    Body: JSON.stringify(room),
  })

  await s3Client.send(command)
}

export async function getRoom(roomId: string): Promise<ChatRoom | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `${ROOMS_PREFIX}${roomId}`,
    })

    const response = await s3Client.send(command)
    const body = await response.Body?.transformToString()
    return body ? JSON.parse(body) : null
  } catch (error) {
    return null
  }
} 