variable "environment" {
  type = string
}

variable "repository_name" {
  type = string
}

resource "aws_ecr_repository" "main" {
  name = "${var.environment}-${var.repository_name}"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.environment}-${var.repository_name}"
    Environment = var.environment
  }
}

output "repository_url" {
  value = aws_ecr_repository.main.repository_url
}

# Add lifecycle policy to clean up untagged images
resource "aws_ecr_lifecycle_policy" "main" {
  repository = aws_ecr_repository.main.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 30 untagged images"
        selection = {
          tagStatus   = "untagged"
          countType   = "imageCountMoreThan"
          countNumber = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
} 