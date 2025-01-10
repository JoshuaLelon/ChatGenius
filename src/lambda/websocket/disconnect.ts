import { APIGatewayProxyHandler } from 'aws-lambda'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({ region: process.env.AWS_REGION })

export const handler: APIGatewayProxyHandler = async (event) => {
  const connectionId = event.requestContext.connectionId
  
  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.CONNECTIONS_BUCKET!,
      Key: `connections/${connectionId}`
    }))
    
    return {
      statusCode: 200,
      body: 'Disconnected'
    }
  } catch (error) {
    console.error('Error disconnecting:', error)
    return {
      statusCode: 500,
      body: 'Failed to disconnect'
    }
  }
} 