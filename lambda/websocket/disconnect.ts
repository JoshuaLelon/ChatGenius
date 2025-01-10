import { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('WebSocket Disconnect:', event);

  const connectionId = event.requestContext.connectionId;
  const timestamp = new Date().toISOString();

  try {
    // Here you would typically remove the connection ID from your database
    // For example, removing from DynamoDB's active connections table

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Disconnected successfully',
        connectionId,
        timestamp,
      }),
    };
  } catch (error) {
    console.error('Error in disconnect handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to disconnect',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
