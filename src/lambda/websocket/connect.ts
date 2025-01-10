import { APIGatewayProxyHandler } from 'aws-lambda'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({ region: process.env.AWS_REGION })

export const handler: APIGatewayProxyHandler = async (event) => {
  const connectionId = event.requestContext.connectionId
  
  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.CONNECTIONS_BUCKET!,
      Key: `connections/${connectionId}`,
      Body: JSON.stringify({
        connectionId,
        timestamp: Date.now(),
        metadata: event.requestContext
      })
    }))
    
    return {
      statusCode: 200,
      body: 'Connected'
    }
  } catch (error) {
    console.error('Error connecting:', error)
    return {
      statusCode: 500,
      body: 'Failed to connect'
    }
  }
} 