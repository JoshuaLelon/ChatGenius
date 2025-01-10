import { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('WebSocket Connect:', event);

  const connectionId = event.requestContext.connectionId;
  const timestamp = new Date().toISOString();

  try {
    // Here you would typically store the connection ID in a database
    // For example, using DynamoDB to track active connections

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Connected successfully',
        connectionId,
        timestamp,
      }),
    };
  } catch (error) {
    console.error('Error in connect handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to connect',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
