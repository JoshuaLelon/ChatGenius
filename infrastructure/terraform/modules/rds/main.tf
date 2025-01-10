variable "identifier" {
  type        = string
  description = "The name of the RDS instance"
}

variable "database_name" {
  type        = string
  description = "The name of the database to create"
}

variable "username" {
  type        = string
  description = "Username for the master DB user"
}

variable "password" {
  type        = string
  description = "Password for the master DB user"
}

variable "environment" {
  type        = string
  description = "Environment (e.g., dev, prod)"
}

resource "aws_db_instance" "postgres" {
  identifier           = var.identifier
  allocated_storage    = 20
  storage_type         = "gp2"
  engine              = "postgres"
  engine_version      = "16.1"
  instance_class      = "db.t3.micro"
  db_name             = var.database_name
  username            = var.username
  password            = var.password
  skip_final_snapshot = true

  vpc_security_group_ids = [aws_security_group.rds.id]

  tags = {
    Environment = var.environment
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.identifier}-rds-"
  description = "Security group for RDS instance"

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = var.environment
  }
}

output "endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "database_name" {
  value = aws_db_instance.postgres.db_name
}

output "username" {
  value = aws_db_instance.postgres.username
}

output "port" {
  value = 5432
} 