interface LogParams {
  level: 'info' | 'warn' | 'error'
  message: string
  error?: Error
  context?: Record<string, unknown>
}

export function log({ level, message, error, context }: LogParams) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    ...(error && { 
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    }),
    ...(context && { context })
  }

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log(JSON.stringify(logEntry, null, 2))
    return
  }

  // In production, send to API Gateway endpoint
  fetch(process.env.NEXT_PUBLIC_LOGS_ENDPOINT!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(logEntry)
  }).catch(err => {
    // Fallback to console if API call fails
    console.error('Failed to send log:', err)
    console.log(JSON.stringify(logEntry))
  })
} 