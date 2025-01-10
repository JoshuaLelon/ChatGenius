variable "environment" {
  type        = string
  description = "Environment (e.g., dev, prod)"
}

variable "websocket_api_id" {
  type        = string
  description = "ID of the WebSocket API Gateway"
}

variable "websocket_api_execution_arn" {
  type        = string
  description = "Execution ARN of the WebSocket API Gateway"
}

resource "aws_iam_role" "lambda" {
  name = "websocket-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "connect" {
  filename         = "${path.module}/../../../../lambda/websocket/connect.zip"
  function_name    = "websocket-connect-${var.environment}"
  role            = aws_iam_role.lambda.arn
  handler         = "connect.handler"
  runtime         = "nodejs20.x"
  
  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_lambda_function" "disconnect" {
  filename         = "${path.module}/../../../../lambda/websocket/disconnect.zip"
  function_name    = "websocket-disconnect-${var.environment}"
  role            = aws_iam_role.lambda.arn
  handler         = "disconnect.handler"
  runtime         = "nodejs20.x"
  
  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_lambda_function" "message" {
  filename         = "${path.module}/../../../../lambda/websocket/message.zip"
  function_name    = "websocket-message-${var.environment}"
  role            = aws_iam_role.lambda.arn
  handler         = "message.handler"
  runtime         = "nodejs20.x"
  
  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_lambda_permission" "connect" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.connect.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.websocket_api_execution_arn}/*"
}

resource "aws_lambda_permission" "disconnect" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.disconnect.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.websocket_api_execution_arn}/*"
}

resource "aws_lambda_permission" "message" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.message.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.websocket_api_execution_arn}/*"
}

output "connect_function_arn" {
  value = aws_lambda_function.connect.invoke_arn
}

output "disconnect_function_arn" {
  value = aws_lambda_function.disconnect.invoke_arn
}

output "message_function_arn" {
  value = aws_lambda_function.message.invoke_arn
} 