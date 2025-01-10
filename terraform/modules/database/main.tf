variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

resource "aws_security_group" "db" {
  name_prefix = "${var.environment}-db-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-db"
    Environment = var.environment
  }
}

resource "aws_efs_file_system" "db_data" {
  creation_token = "${var.environment}-db-data"
  encrypted      = true

  tags = {
    Name        = "${var.environment}-db-data"
    Environment = var.environment
  }
}

resource "aws_efs_mount_target" "db_data" {
  count           = length(var.subnet_ids)
  file_system_id  = aws_efs_file_system.db_data.id
  subnet_id       = var.subnet_ids[count.index]
  security_groups = [aws_security_group.efs.id]
}

resource "aws_security_group" "efs" {
  name_prefix = "${var.environment}-efs-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [aws_security_group.db.id]
  }
}

resource "random_password" "db_password" {
  length  = 16
  special = true
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name = "${var.environment}-db-credentials"
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "postgres"
    password = random_password.db_password.result
    database = "app"
  })
}

resource "aws_ecs_task_definition" "db" {
  family                   = "${var.environment}-db"
  requires_compatibilities = ["FARGATE"]
  network_mode            = "awsvpc"
  cpu                     = 1024
  memory                  = 2048
  execution_role_arn      = aws_iam_role.ecs_execution.arn
  task_role_arn          = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name = "db"
      image = "postgres:13.7"
      essential = true
      portMappings = [
        {
          containerPort = 5432
          hostPort = 5432
          protocol = "tcp"
        }
      ]
      environment = [
        {
          name = "POSTGRES_DB"
          value = "app"
        }
      ]
      secrets = [
        {
          name = "POSTGRES_USER"
          valueFrom = format("%s:username::", aws_secretsmanager_secret.db_credentials.arn)
        },
        {
          name = "POSTGRES_PASSWORD"
          valueFrom = format("%s:password::", aws_secretsmanager_secret.db_credentials.arn)
        }
      ]
      mountPoints = [
        {
          sourceVolume = "db-data"
          containerPath = "/var/lib/postgresql/data"
          readOnly = false
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group = format("/ecs/%s-db", var.environment)
          awslogs-region = data.aws_region.current.name
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])

  volume {
    name = "db-data"
    efs_volume_configuration {
      file_system_id = aws_efs_file_system.db_data.id
      root_directory = "/"
    }
  }

  tags = {
    Name        = "${var.environment}-db"
    Environment = var.environment
  }
}

resource "aws_ecs_service" "db" {
  name            = "${var.environment}-db"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.db.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.db.id]
    assign_public_ip = false
  }

  deployment_maximum_percent         = 100
  deployment_minimum_healthy_percent = 100
  enable_execute_command            = true

  tags = {
    Name        = "${var.environment}-db"
    Environment = var.environment
  }
}

output "db_host" {
  value = aws_ecs_service.db.name
}

output "db_name" {
  value = "app"
}

output "db_username" {
  value = "postgres"
}

output "db_password" {
  value     = random_password.db_password.result
  sensitive = true
} 