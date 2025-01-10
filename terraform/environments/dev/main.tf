provider "aws" {
  region = "us-east-1"
}

module "vpc" {
  source = "../../modules/vpc"

  environment = "dev"
  vpc_cidr   = "10.0.0.0/16"
}

module "ecr" {
  source = "../../modules/ecr"

  environment     = "dev"
  repository_name = "app"
}

module "database" {
  source = "../../modules/database"

  environment = "dev"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
}

module "lambda" {
  source = "../../modules/lambda"

  environment    = "dev"
  function_name  = "api"
  handler        = "index.handler"
  runtime        = "nodejs18.x"
  source_dir     = "../../src/lambda"
}

module "apigateway" {
  source = "../../modules/apigateway"

  environment          = "dev"
  name                = "api"
  lambda_function_arn  = module.lambda.function_arn
  lambda_function_name = module.lambda.function_name
}

output "api_endpoint" {
  value = module.apigateway.api_endpoint
}

output "ecr_repository_url" {
  value = module.ecr.repository_url
}

output "db_endpoint" {
  value = module.database.db_host
}

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "private_subnet_ids" {
  value = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  value = module.vpc.public_subnet_ids
} 