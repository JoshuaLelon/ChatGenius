import { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('WebSocket Message:', event);

  const connectionId = event.requestContext.connectionId;
  const timestamp = new Date().toISOString();

  try {
    let message;
    try {
      message = JSON.parse(event.body || '{}');
    } catch {
      throw new Error('Invalid message format');
    }

    // Here you would typically process the message and broadcast to other clients
    // For example, using ApiGatewayManagementApi to send messages to other connections

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Message received',
        connectionId,
        timestamp,
        data: message,
      }),
    };
  } catch (error) {
    console.error('Error in message handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to process message',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
