provider "aws" {
  region = "us-east-1"
}

locals {
  environment = "dev"
}

module "rds" {
  source = "../../modules/rds"

  identifier     = "chatgenius-${local.environment}"
  database_name  = "chatgenius"
  username       = "postgres"
  password       = "postgres"  # Change this in production
  environment    = local.environment
}

module "s3" {
  source = "../../modules/s3"

  bucket_name  = "chatgenius-uploads-${local.environment}"
  environment  = local.environment
}

module "api_gateway" {
  source = "../../modules/api-gateway"

  name        = "chatgenius-websocket-${local.environment}"
  environment = local.environment
  lambda_function_arns = {
    connect    = module.lambda.connect_function_arn
    disconnect = module.lambda.disconnect_function_arn
    message    = module.lambda.message_function_arn
  }
}

module "lambda" {
  source = "../../modules/lambda"

  environment                  = local.environment
  websocket_api_id            = module.api_gateway.api_id
  websocket_api_execution_arn = "arn:aws:execute-api:us-east-1:${data.aws_caller_identity.current.account_id}:${module.api_gateway.api_id}"
}

data "aws_caller_identity" "current" {}
