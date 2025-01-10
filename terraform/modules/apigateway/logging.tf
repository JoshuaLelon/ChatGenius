resource "aws_apigatewayv2_route" "logs" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /logs"
  target    = "integrations/${aws_apigatewayv2_integration.logs.id}"
}

resource "aws_apigatewayv2_integration" "logs" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  
  integration_method = "POST"
  integration_uri    = aws_lambda_function.logs.invoke_arn
}

resource "aws_lambda_function" "logs" {
  filename         = data.archive_file.logs_lambda.output_path
  function_name    = "${var.environment}-logs"
  role            = aws_iam_role.logs_lambda.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"

  environment {
    variables = {
      LOG_GROUP_NAME = "/api/${var.environment}/application"
    }
  }
}

resource "aws_iam_role" "logs_lambda" {
  name = "${var.environment}-logs-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "logs_lambda" {
  name = "${var.environment}-logs-lambda"
  role = aws_iam_role.logs_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

data "archive_file" "logs_lambda" {
  type        = "zip"
  output_path = "${path.module}/files/logs.zip"
  
  source {
    content = <<EOF
exports.handler = async (event) => {
  const logEntry = JSON.parse(event.body);
  
  console.log(JSON.stringify({
    timestamp: logEntry.timestamp,
    level: logEntry.level,
    message: logEntry.message,
    ...(logEntry.error && { error: logEntry.error }),
    ...(logEntry.context && { context: logEntry.context })
  }));
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Log recorded' })
  };
};
EOF
    filename = "index.js"
  }
} 