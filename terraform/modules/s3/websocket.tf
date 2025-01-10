resource "aws_s3_bucket" "websocket_connections" {
  bucket = "${var.environment}-websocket-connections"

  tags = {
    Name        = "${var.environment}-websocket-connections"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "websocket_connections" {
  bucket = aws_s3_bucket.websocket_connections.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "websocket_connections" {
  bucket = aws_s3_bucket.websocket_connections.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "websocket_connections_bucket" {
  value = aws_s3_bucket.websocket_connections.id
} 