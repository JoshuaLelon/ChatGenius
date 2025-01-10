import { APIGatewayProxyHandler } from 'aws-lambda'
import { ApiGatewayManagementApi } from '@aws-sdk/client-apigatewaymanagementapi'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

const s3Client = new S3Client({ region: process.env.AWS_REGION })

export const handler: APIGatewayProxyHandler = async (event) => {
  const domain = event.requestContext.domainName
  const stage = event.requestContext.stage
  const connectionId = event.requestContext.connectionId
  
  const api = new ApiGatewayManagementApi({
    endpoint: `${domain}/${stage}`
  })

  try {
    const data = JSON.parse(event.body || '{}')
    
    // Get all active connections
    const connections = await s3Client.send(new ListObjectsV2Command({
      Bucket: process.env.CONNECTIONS_BUCKET!,
      Prefix: 'connections/'
    }))

    // Broadcast message to all connections except sender
    const broadcastPromises = connections.Contents?.map(async (obj) => {
      const connId = obj.Key?.split('/')[1]
      if (connId && connId !== connectionId) {
        try {
          await api.postToConnection({
            ConnectionId: connId,
            Data: Buffer.from(JSON.stringify({
              message: `User ${connectionId}: ${data.message}`
            }))
          })
        } catch (error) {
          console.error(`Failed to send to connection ${connId}:`, error)
        }
      }
    }) || []

    await Promise.all(broadcastPromises)
    
    return {
      statusCode: 200,
      body: 'Message broadcast'
    }
  } catch (error) {
    console.error('Error handling message:', error)
    return {
      statusCode: 500,
      body: 'Failed to process message'
    }
  }
} 