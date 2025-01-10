# Full Stack App Setup Guide

## Table of Contents
1. [Initial Setup](#initial-setup)
2. [AWS Infrastructure](#aws-infrastructure)
3. [Database Setup](#database-setup)
4. [Next.js Application](#nextjs-application)
5. [API Integration](#api-integration)
6. [Real-time Communication](#real-time-communication)
7. [Authentication](#authentication)
8. [Deployment](#deployment)

## Initial Setup

### Project Structure
- [x] Initialize git repository:
    git init

- [x] Create project directories:
    mkdir -p src/app/api
    mkdir -p src/components
    mkdir -p src/lib/db
    mkdir -p src/styles
    mkdir -p terraform/modules/{vpc,ecs,rds,ecr,apigateway,lambda}
    mkdir -p terraform/environments/{dev,prod}
    mkdir -p db/migrations
    mkdir -p db/schemas
    mkdir -p scripts/db
    mkdir -p scripts

- [x] Create initial .gitignore:
    cat > .gitignore << 'EOF'
    # Dependencies
    node_modules/
    .pnp/
    .pnp.js

    # Testing
    coverage/

    # Next.js
    .next/
    out/

    # Production
    build/
    dist/

    # Environment
    .env*
    .env.local
    .env.development.local
    .env.test.local
    .env.production.local

    # Debug
    npm-debug.log*
    yarn-debug.log*
    yarn-error.log*

    # IDE
    .idea/
    .vscode/
    *.swp
    *.swo

    # OS
    .DS_Store
    Thumbs.db

    # Terraform
    .terraform/
    *.tfstate
    *.tfstate.*
    *.tfvars
    EOF

- [x] Create root README.md:
    cat > README.md << 'EOF'
    # Full Stack Application

    ## Overview
    Modern full-stack application built with Next.js, AWS, and Terraform.

    ## Project Structure
    - `/src` - Application source code
    - `/terraform` - Infrastructure as Code
    - `/db` - Database migrations
    - `/scripts` - Utility scripts

    ## Documentation
    See individual directory README.md files for detailed documentation.
    EOF

### AWS CLI Setup
- [x] Check if AWS CLI is installed:
    aws --version

- [x] Install AWS CLI if not present:
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install

- [x] Configure AWS CLI:
    aws configure
    # Enter AWS Access Key ID
    # Enter AWS Secret Access Key
    # Enter default region (e.g., us-west-2)
    # Enter default output format (json)

### Terraform Setup
- [x] Check if Terraform is installed:
    terraform --version

- [x] Install Terraform if not present:
    sudo apt-get update
    sudo apt-get install -y gnupg software-properties-common
    wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
    sudo apt-get update
    sudo apt-get install terraform

- [x] Initialize Terraform backend configuration:
    cat > terraform/environments/dev/backend.tf << 'EOF'
    terraform {
      backend "s3" {
        bucket         = "your-terraform-state-bucket"
        key            = "dev/terraform.tfstate"
        region         = "us-east-1"
        dynamodb_table = "terraform-state-lock"
        encrypt        = true
      }
    }
    EOF

## AWS Infrastructure

### VPC Module Setup
- [x] Create VPC module configuration:
   cat > terraform/modules/vpc/main.tf << 'EOF'
   variable "environment" {
     type = string
   }

   variable "vpc_cidr" {
     type = string
   }

   resource "aws_vpc" "main" {
     cidr_block           = var.vpc_cidr
     enable_dns_hostnames = true
     enable_dns_support   = true

     tags = {
       Name        = "${var.environment}-vpc"
       Environment = var.environment
     }
   }

   resource "aws_subnet" "public" {
     count             = 2
     vpc_id           = aws_vpc.main.id
     cidr_block       = cidrsubnet(var.vpc_cidr, 8, count.index)
     availability_zone = data.aws_availability_zones.available.names[count.index]

     tags = {
       Name        = "${var.environment}-public-subnet-${count.index + 1}"
       Environment = var.environment
     }
   }

   resource "aws_subnet" "private" {
     count             = 2
     vpc_id           = aws_vpc.main.id
     cidr_block       = cidrsubnet(var.vpc_cidr, 8, count.index + 2)
     availability_zone = data.aws_availability_zones.available.names[count.index]

     tags = {
       Name        = "${var.environment}-private-subnet-${count.index + 1}"
       Environment = var.environment
     }
   }

   resource "aws_internet_gateway" "main" {
     vpc_id = aws_vpc.main.id

     tags = {
       Name        = "${var.environment}-igw"
       Environment = var.environment
     }
   }

   resource "aws_eip" "nat" {
     count = 2
     vpc   = true

     tags = {
       Name        = "${var.environment}-nat-eip-${count.index + 1}"
       Environment = var.environment
     }
   }

   resource "aws_nat_gateway" "main" {
     count         = 2
     allocation_id = aws_eip.nat[count.index].id
     subnet_id     = aws_subnet.public[count.index].id

     tags = {
       Name        = "${var.environment}-nat-${count.index + 1}"
       Environment = var.environment
     }
   }

   output "vpc_id" {
     value = aws_vpc.main.id
   }

   output "public_subnet_ids" {
     value = aws_subnet.public[*].id
   }

   output "private_subnet_ids" {
     value = aws_subnet.private[*].id
   }
   EOF

- [x] Create variables file for VPC module:
   cat > terraform/modules/vpc/variables.tf << 'EOF'
   variable "environment" {
     description = "Environment name"
     type        = string
   }

   variable "vpc_cidr" {
     description = "CIDR block for VPC"
     type        = string
   }
   EOF

### ECR Module Setup
- [x] Create ECR module configuration:
   cat > terraform/modules/ecr/main.tf << 'EOF'
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
   EOF

### PostgreSQL on ECS Setup

- [x] Create database module configuration:

cat > terraform/modules/database/main.tf << 'EOF'
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
EOF

### Lambda Module Setup
- [x] Create Lambda module configuration:
   cat > terraform/modules/lambda/main.tf << 'EOF'
   variable "environment" {
     type = string
   }

   variable "function_name" {
     type = string
   }

   variable "handler" {
     type = string
   }

   variable "runtime" {
     type = string
   }

   variable "source_dir" {
     type = string
   }

   resource "aws_iam_role" "lambda" {
     name = "${var.environment}-${var.function_name}-role"

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

   data "archive_file" "lambda" {
     type        = "zip"
     source_dir  = var.source_dir
     output_path = "${path.module}/files/${var.function_name}.zip"
   }

   resource "aws_lambda_function" "main" {
     filename         = data.archive_file.lambda.output_path
     function_name    = "${var.environment}-${var.function_name}"
     role            = aws_iam_role.lambda.arn
     handler         = var.handler
     runtime         = var.runtime
     source_code_hash = data.archive_file.lambda.output_base64sha256

     environment {
       variables = {
         ENVIRONMENT = var.environment
       }
     }

     tags = {
       Name        = "${var.environment}-${var.function_name}"
       Environment = var.environment
     }
   }

   output "function_arn" {
     value = aws_lambda_function.main.arn
   }

   output "function_name" {
     value = aws_lambda_function.main.function_name
   }
   EOF

### API Gateway Module Setup
- [x] Create API Gateway module configuration:
   cat > terraform/modules/apigateway/main.tf << 'EOF'
   variable "environment" {
     type = string
   }

   variable "name" {
     type = string
   }

   variable "lambda_function_arn" {
     type = string
   }

   resource "aws_apigatewayv2_api" "main" {
     name          = "${var.environment}-${var.name}"
     protocol_type = "HTTP"

     cors_configuration {
       allow_origins = ["*"]
       allow_methods = ["*"]
       allow_headers = ["*"]
     }
   }

   resource "aws_apigatewayv2_stage" "main" {
     api_id      = aws_apigatewayv2_api.main.id
     name        = var.environment
     auto_deploy = true
   }

   resource "aws_apigatewayv2_integration" "main" {
     api_id             = aws_apigatewayv2_api.main.id
     integration_type   = "AWS_PROXY"
     integration_uri    = var.lambda_function_arn
     integration_method = "POST"
   }

   resource "aws_apigatewayv2_route" "main" {
     api_id    = aws_apigatewayv2_api.main.id
     route_key = "ANY /{proxy+}"
     target    = "integrations/${aws_apigatewayv2_integration.main.id}"
   }

   resource "aws_lambda_permission" "apigw" {
     statement_id  = "AllowAPIGatewayInvoke"
     action        = "lambda:InvokeFunction"
     function_name = var.lambda_function_name
     principal     = "apigateway.amazonaws.com"
     source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
   }

   output "api_endpoint" {
     value = aws_apigatewayv2_stage.main.invoke_url
   }
   EOF

### Environment Configuration
- [x] Create development environment configuration:
   cat > terraform/environments/dev/main.tf << 'EOF'
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

   output "vpc_id" {
     value = module.vpc.vpc_id
   }
   EOF

## Database Setup

### Database Migration Structure
- [x] Create database migration directory structure:
   mkdir -p db/migrations
   mkdir -p db/schemas
   mkdir -p scripts/db

- [x] Create database initialization script:
   cat > db/migrations/000001_init.up.sql << 'EOF'
   -- Enable UUID extension
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

   -- Create users table
   CREATE TABLE users (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       email VARCHAR(255) NOT NULL UNIQUE,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );

   -- Create audit log function
   CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
       NEW.updated_at = CURRENT_TIMESTAMP;
       RETURN NEW;
   END;
   $$ language 'plpgsql';

   -- Create trigger for users table
   CREATE TRIGGER update_users_updated_at
       BEFORE UPDATE ON users
       FOR EACH ROW
       EXECUTE FUNCTION update_updated_at_column();
   EOF

- [x] Create corresponding down migration:
   cat > db/migrations/000001_init.down.sql << 'EOF'
   DROP TRIGGER IF EXISTS update_users_updated_at ON users;
   DROP FUNCTION IF EXISTS update_updated_at_column();
   DROP TABLE IF EXISTS users;
   DROP EXTENSION IF EXISTS "uuid-ossp";
   EOF

### Database Schema Types
- [x] Create TypeScript types for database schema:
   mkdir -p src/lib/db/types
   cat > src/lib/db/types/schema.ts << 'EOF'
   export interface User {
       id: string;
       email: string;
       created_at: Date;
       updated_at: Date;
   }
   EOF

### Database Utility Functions
- [x] Create database configuration:
   cat > src/lib/db/config.ts << 'EOF'
   import { Pool } from 'pg';

   const pool = new Pool({
       host: process.env.DB_HOST,
       port: parseInt(process.env.DB_PORT || '5432'),
       database: process.env.DB_NAME,
       user: process.env.DB_USER,
       password: process.env.DB_PASSWORD,
       ssl: process.env.NODE_ENV === 'production' ? {
           rejectUnauthorized: false
       } : false
   });

   export default pool;
   EOF

- [x] Create database utility functions:
   cat > src/lib/db/utils.ts << 'EOF'
   import { Pool, QueryResult } from 'pg';
   import pool from './config';

   export async function query(
       text: string,
       params?: any[]
   ): Promise<QueryResult> {
       const start = Date.now();
       const res = await pool.query(text, params);
       const duration = Date.now() - start;
       console.log('executed query', { text, duration, rows: res.rowCount });
       return res;
   }

   export async function getClient(): Promise<Pool> {
       const client = await pool.connect();
       const query = client.query;
       const release = client.release;

       // Set a timeout of 5 seconds, after which we will log this client's last query
       const timeout = setTimeout(() => {
           console.error('A client has been checked out for more than 5 seconds!');
           console.error(`The last executed query on this client was: ${client.lastQuery}`);
       }, 5000);

       // Monkey patch the query method to keep track of the last query executed
       client.query = (...args) => {
           client.lastQuery = args;
           return query.apply(client, args);
       };

       client.release = () => {
           clearTimeout(timeout);
           client.query = query;
           client.release = release;
           return release.apply(client);
       };

       return client;
   }
   EOF

### Database Migration Scripts
- [x] Create database migration script:
   cat > scripts/db/migrate.ts << 'EOF'
   import { promises as fs } from 'fs';
   import path from 'path';
   import { query } from '../../src/lib/db/utils';

   async function getCurrentVersion(): Promise<number> {
       try {
           const result = await query(`
               SELECT version FROM schema_migrations
               ORDER BY version DESC
               LIMIT 1
           `);
           return result.rows[0]?.version || 0;
       } catch (error) {
           // If table doesn't exist, create it
           await query(`
               CREATE TABLE IF NOT EXISTS schema_migrations (
                   version INTEGER PRIMARY KEY,
                   applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
               )
           `);
           return 0;
       }
   }

   async function migrate(): Promise<void> {
       const currentVersion = await getCurrentVersion();
       
       const migrationsDir = path.join(__dirname, '../../db/migrations');
       const files = await fs.readdir(migrationsDir);
       
       const migrations = files
           .filter(f => f.endsWith('.up.sql'))
           .map(f => ({
               version: parseInt(f.split('_')[0]),
               path: path.join(migrationsDir, f)
           }))
           .sort((a, b) => a.version - b.version)
           .filter(m => m.version > currentVersion);

       for (const migration of migrations) {
           const sql = await fs.readFile(migration.path, 'utf-8');
           console.log(`Applying migration ${migration.version}...`);
           
           await query('BEGIN');
           try {
               await query(sql);
               await query(
                   'INSERT INTO schema_migrations (version) VALUES ($1)',
                   [migration.version]
               );
               await query('COMMIT');
               console.log(`Migration ${migration.version} applied successfully`);
           } catch (error) {
               await query('ROLLBACK');
               console.error(`Error applying migration ${migration.version}:`, error);
               throw error;
           }
       }
   }

   migrate().catch(console.error);
   EOF

- [x] Create database documentation:
   cat > db/README.md << 'EOF'
   # Database Documentation

   ## Overview
   PostgreSQL database with migrations-based schema management.

   ## Schema
   ### Users Table
   - `id` (UUID, Primary Key): Unique identifier
   - `email` (VARCHAR): User's email address
   - `created_at` (TIMESTAMP): Record creation timestamp
   - `updated_at` (TIMESTAMP): Record update timestamp

   ## Migrations
   Migrations are stored in `db/migrations` and follow the format:
   - `{version}_description.up.sql`: Forward migration
   - `{version}_description.down.sql`: Rollback migration

   ## Scripts
   - `scripts/db/migrate.ts`: Applies pending migrations
   EOF

## Next.js Application Setup

### Initialize Next.js Project
- [x] Initialize Next.js project:
   npx create-next-app@latest . --typescript --tailwind --app --use-npm --eslint --no-src-dir --import-alias "@/*"

- [x] Install additional dependencies:
   npm install @prisma/client @tanstack/react-query axios date-fns jose jsonwebtoken pg react-hook-form uuid zod zustand @auth0/auth0-react @aws-sdk/client-s3

- [x] Install development dependencies:
   npm install --save-dev @types/jsonwebtoken @types/pg @types/uuid prisma ts-node typescript

### Configure TailwindCSS and shadcn/ui
- [x] Initialize shadcn/ui:
   npx shadcn-ui@latest init

- [x] When prompted, select these options:
   - Style: Default
   - Base color: Slate
   - CSS variables: Yes
   - Tailwind CSS class sorting: Yes
   - React Server Components: Yes
   - Components location: @/components
   - Utilities location: @/lib/utils
   - Color CSS variables: Yes

- [x] Update tailwind.config.js:
   cat > tailwind.config.js << 'EOF'
   /** @type {import('tailwindcss').Config} */
   module.exports = {
     darkMode: ["class"],
     content: [
       './pages/**/*.{ts,tsx}',
       './components/**/*.{ts,tsx}',
       './app/**/*.{ts,tsx}',
       './src/**/*.{ts,tsx}',
     ],
     theme: {
       container: {
         center: true,
         padding: "2rem",
         screens: {
           "2xl": "1400px",
         },
       },
       extend: {
         colors: {
           border: "hsl(var(--border))",
           input: "hsl(var(--input))",
           ring: "hsl(var(--ring))",
           background: "hsl(var(--background))",
           foreground: "hsl(var(--foreground))",
           primary: {
             DEFAULT: "hsl(var(--primary))",
             foreground: "hsl(var(--primary-foreground))",
           },
           secondary: {
             DEFAULT: "hsl(var(--secondary))",
             foreground: "hsl(var(--secondary-foreground))",
           },
           destructive: {
             DEFAULT: "hsl(var(--destructive))",
             foreground: "hsl(var(--destructive-foreground))",
           },
           muted: {
             DEFAULT: "hsl(var(--muted))",
             foreground: "hsl(var(--muted-foreground))",
           },
           accent: {
             DEFAULT: "hsl(var(--accent))",
             foreground: "hsl(var(--accent-foreground))",
           },
           popover: {
             DEFAULT: "hsl(var(--popover))",
             foreground: "hsl(var(--popover-foreground))",
           },
           card: {
             DEFAULT: "hsl(var(--card))",
             foreground: "hsl(var(--card-foreground))",
           },
         },
         borderRadius: {
           lg: "var(--radius)",
           md: "calc(var(--radius) - 2px)",
           sm: "calc(var(--radius) - 4px)",
         },
         keyframes: {
           "accordion-down": {
             from: { height: 0 },
             to: { height: "var(--radix-accordion-content-height)" },
           },
           "accordion-up": {
             from: { height: "var(--radix-accordion-content-height)" },
             to: { height: 0 },
           },
         },
         animation: {
           "accordion-down": "accordion-down 0.2s ease-out",
           "accordion-up": "accordion-up 0.2s ease-out",
         },
       },
     },
     plugins: [require("tailwindcss-animate")],
   }
   EOF

### App Structure Setup
- [x] Create base app layout:
   cat > app/layout.tsx << 'EOF'
   import "@/styles/globals.css"
   import { Inter } from "next/font/google"
   import { cn } from "@/lib/utils"

   const inter = Inter({ subsets: ["latin"] })

   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode
   }) {
     return (
       <html lang="en">
         <body className={cn(
           "min-h-screen bg-background font-sans antialiased",
           inter.className
         )}>
           {children}
         </body>
       </html>
     )
   }
   EOF

- [x] Create basic page component:
   cat > app/page.tsx << 'EOF'
   import { Button } from "@/components/ui/button"
   
   export default function Home() {
     return (
       <main className="flex min-h-screen flex-col items-center justify-center p-24">
         <h1 className="text-4xl font-bold mb-8">
           Full Stack App Template
         </h1>
         <Button>Hello World</Button>
       </main>
     )
   }
   EOF

### State Management Setup
- [x] Create Zustand store:
   mkdir -p lib/store
   cat > lib/store/index.ts << 'EOF'
   import { create } from 'zustand'

   interface AppState {
     isLoading: boolean
     setIsLoading: (loading: boolean) => void
   }

   export const useStore = create<AppState>((set) => ({
     isLoading: false,
     setIsLoading: (loading) => set({ isLoading: loading }),
   }))
   EOF

### API Client Setup
- [x] Create API client utilities:
   mkdir -p lib/api
   cat > lib/api/client.ts << 'EOF'
   import axios from 'axios'

   export const api = axios.create({
     baseURL: process.env.NEXT_PUBLIC_API_URL,
     headers: {
       'Content-Type': 'application/json',
     },
   })

   api.interceptors.request.use((config) => {
     const token = localStorage.getItem('token')
     if (token) {
       config.headers.Authorization = `Bearer ${token}`
     }
     return config
   })

   api.interceptors.response.use(
     (response) => response,
     async (error) => {
       if (error.response?.status === 401) {
         // Handle token refresh or logout
       }
       return Promise.reject(error)
     }
   )
   EOF

### Form Validation Setup
- [x] Create Zod schemas:
   mkdir -p lib/schemas
   cat > lib/schemas/auth.ts << 'EOF'
   import { z } from 'zod'

   export const loginSchema = z.object({
     email: z.string().email(),
     password: z.string().min(8),
   })

   export type LoginSchema = z.infer<typeof loginSchema>
   EOF

## Auth0 Integration

### Auth0 Setup
- [x] Create Auth0 tenant (if not exists):
   AUTH0_DOMAIN="your-domain.auth0.com"
   AUTH0_CLIENT_ID="your-client-id"
   AUTH0_CLIENT_SECRET="your-client-secret"

- [x] Add Auth0 environment variables:
   cat > .env.local << 'EOF'
   AUTH0_SECRET='use [openssl rand -hex 32] to generate a 32 bytes value'
   AUTH0_BASE_URL='http://localhost:3000'
   AUTH0_ISSUER_BASE_URL='https://YOUR_DOMAIN'
   AUTH0_CLIENT_ID='YOUR_CLIENT_ID'
   AUTH0_CLIENT_SECRET='YOUR_CLIENT_SECRET'
   EOF

### Auth0 React Integration
- [x] Create Auth0 provider component:
   mkdir -p components/providers
   cat > components/providers/auth-provider.tsx << 'EOF'
   import { Auth0Provider } from "@auth0/auth0-react";

   export function AuthProvider({ children }: { children: React.ReactNode }) {
     return (
       <Auth0Provider
         domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN!}
         clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!}
         authorizationParams={{
           redirect_uri: typeof window !== "undefined" ? window.location.origin : "",
           audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
         }}
       >
         {children}
       </Auth0Provider>
     );
   }
   EOF

- [x] Update root layout to include Auth0 provider:
   cat > app/layout.tsx << 'EOF'
   import "@/styles/globals.css"
   import { Inter } from "next/font/google"
   import { AuthProvider } from "@/components/providers/auth-provider"
   import { cn } from "@/lib/utils"

   const inter = Inter({ subsets: ["latin"] })

   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode
   }) {
     return (
       <html lang="en">
         <body className={cn(
           "min-h-screen bg-background font-sans antialiased",
           inter.className
         )}>
           <AuthProvider>{children}</AuthProvider>
         </body>
       </html>
     )
   }
   EOF

### Auth0 Hooks and Utilities
- [x] Create authentication hooks:
   mkdir -p lib/hooks
   cat > lib/hooks/use-auth.ts << 'EOF'
   import { useAuth0 } from "@auth0/auth0-react";
   import { useCallback } from "react";

   export function useAuth() {
     const {
       isAuthenticated,
       isLoading,
       user,
       getAccessTokenSilently,
       loginWithRedirect,
       logout,
     } = useAuth0();

     const login = useCallback(() => {
       loginWithRedirect();
     }, [loginWithRedirect]);

     const signOut = useCallback(() => {
       logout({ 
         logoutParams: {
           returnTo: window.location.origin 
         }
       });
     }, [logout]);

     const getToken = useCallback(async () => {
       return await getAccessTokenSilently();
     }, [getAccessTokenSilently]);

     return {
       isAuthenticated,
       isLoading,
       user,
       login,
       signOut,
       getToken,
     };
   }
   EOF

### Protected Routes Component
- [x] Create protected route wrapper:
   cat > components/auth/protected-route.tsx << 'EOF'
   import { useAuth } from "@/lib/hooks/use-auth";
   import { useRouter } from "next/navigation";
   import { useEffect } from "react";

   export function ProtectedRoute({ children }: { children: React.ReactNode }) {
     const { isAuthenticated, isLoading } = useAuth();
     const router = useRouter();

     useEffect(() => {
       if (!isLoading && !isAuthenticated) {
         router.push("/");
       }
     }, [isLoading, isAuthenticated, router]);

     if (isLoading) {
       return <div>Loading...</div>;
     }

     return isAuthenticated ? <>{children}</> : null;
   }
   EOF

### Auth0 API Integration
- [x] Create authentication utilities:
   mkdir -p lib/auth
   cat > lib/auth/utils.ts << 'EOF'
   import { auth0 } from "./config";

   export async function getSession(request: Request) {
     const session = await auth0.getSession(request);
     return session;
   }

   export async function validateToken(token: string) {
     try {
       const user = await auth0.validateToken(token);
       return user;
     } catch (error) {
       return null;
     }
   }

   export async function handleCallback(request: Request) {
     try {
       await auth0.handleCallback(request);
     } catch (error) {
       console.error(error);
       throw error;
     }
   }
   EOF

### Auth0 Protected API Routes
- [ ] Create middleware for protected routes:
   cat > middleware.ts << 'EOF'
   import { NextResponse } from "next/server";
   import type { NextRequest } from "next/server";
   import { validateToken } from "@/lib/auth/utils";

   export async function middleware(request: NextRequest) {
     // Check if the request is for an API route
     if (request.nextUrl.pathname.startsWith("/api/")) {
       const token = request.headers.get("authorization")?.split(" ")[1];

       if (!token) {
         return new NextResponse(
           JSON.stringify({ error: "Missing authentication token" }),
           {
             status: 401,
             headers: { "content-type": "application/json" },
           }
         );
       }

       const user = await validateToken(token);

       if (!user) {
         return new NextResponse(
           JSON.stringify({ error: "Invalid authentication token" }),
           {
             status: 401,
             headers: { "content-type": "application/json" },
           }
         );
       }

       // Add user information to request headers
       const headers = new Headers(request.headers);
       headers.set("x-user-id", user.sub);

       return NextResponse.next({
         request: {
           headers,
         },
       });
     }

     return NextResponse.next();
   }

   export const config = {
     matcher: "/api/:path*",
   };
   EOF

## WebSocket Integration

### API Gateway WebSocket Setup
- [x] Create WebSocket API configuration in Terraform:
   cat > terraform/modules/apigateway/websocket.tf << 'EOF'
   resource "aws_apigatewayv2_api" "websocket" {
     name                       = "${var.environment}-websocket"
     protocol_type             = "WEBSOCKET"
     route_selection_expression = "$request.body.action"
   }

   resource "aws_apigatewayv2_stage" "websocket" {
     api_id = aws_apigatewayv2_api.websocket.id
     name   = var.environment
     
     default_route_settings {
       logging_level          = "INFO"
       data_trace_enabled     = true
       throttling_burst_limit = 5000
       throttling_rate_limit  = 10000
     }
   }

   resource "aws_apigatewayv2_route" "connect" {
     api_id    = aws_apigatewayv2_api.websocket.id
     route_key = "$connect"
     target    = "integrations/${aws_apigatewayv2_integration.connect.id}"
   }

   resource "aws_apigatewayv2_route" "disconnect" {
     api_id    = aws_apigatewayv2_api.websocket.id
     route_key = "$disconnect"
     target    = "integrations/${aws_apigatewayv2_integration.disconnect.id}"
   }

   resource "aws_apigatewayv2_route" "default" {
     api_id    = aws_apigatewayv2_api.websocket.id
     route_key = "$default"
     target    = "integrations/${aws_apigatewayv2_integration.default.id}"
   }
   EOF

### WebSocket Lambda Functions
- [x] Create WebSocket handler directory:
   mkdir -p src/lambda/websocket

- [x] Create connection handler:
   cat > src/lambda/websocket/connect.ts << 'EOF'
   import { APIGatewayProxyHandler } from 'aws-lambda';
   import { DynamoDB } from '@aws-sdk/client-dynamodb';

   const dynamodb = new DynamoDB({ region: process.env.AWS_REGION });

   export const handler: APIGatewayProxyHandler = async (event) => {
     const connectionId = event.requestContext.connectionId;
     
     try {
       await dynamodb.putItem({
         TableName: process.env.CONNECTIONS_TABLE!,
         Item: {
           connectionId: { S: connectionId! },
           timestamp: { N: Date.now().toString() }
         }
       });
       
       return {
         statusCode: 200,
         body: 'Connected'
       };
     } catch (error) {
       console.error('Error connecting:', error);
       return {
         statusCode: 500,
         body: 'Failed to connect'
       };
     }
   };
   EOF

- [x] Create disconnection handler:
   cat > src/lambda/websocket/disconnect.ts << 'EOF'
   import { APIGatewayProxyHandler } from 'aws-lambda';
   import { DynamoDB } from '@aws-sdk/client-dynamodb';

   const dynamodb = new DynamoDB({ region: process.env.AWS_REGION });

   export const handler: APIGatewayProxyHandler = async (event) => {
     const connectionId = event.requestContext.connectionId;
     
     try {
       await dynamodb.deleteItem({
         TableName: process.env.CONNECTIONS_TABLE!,
         Key: {
           connectionId: { S: connectionId! }
         }
       });
       
       return {
         statusCode: 200,
         body: 'Disconnected'
       };
     } catch (error) {
       console.error('Error disconnecting:', error);
       return {
         statusCode: 500,
         body: 'Failed to disconnect'
       };
     }
   };
   EOF

- [x] Create default message handler:
   cat > src/lambda/websocket/default.ts << 'EOF'
   import { APIGatewayProxyHandler } from 'aws-lambda';
   import { ApiGatewayManagementApi } from '@aws-sdk/client-apigatewaymanagementapi';
   import { DynamoDB } from '@aws-sdk/client-dynamodb';

   const dynamodb = new DynamoDB({ region: process.env.AWS_REGION });

   export const handler: APIGatewayProxyHandler = async (event) => {
     const domain = event.requestContext.domainName;
     const stage = event.requestContext.stage;
     const connectionId = event.requestContext.connectionId;
     
     const api = new ApiGatewayManagementApi({
       endpoint: `${domain}/${stage}`
     });

     try {
       const data = JSON.parse(event.body || '{}');
       
       // Echo the message back to the sender
       await api.postToConnection({
         ConnectionId: connectionId!,
         Data: Buffer.from(JSON.stringify({
           message: `Received: ${data.message}`
         }))
       });
       
       return {
         statusCode: 200,
         body: 'Message sent'
       };
     } catch (error) {
       console.error('Error handling message:', error);
       return {
         statusCode: 500,
         body: 'Failed to process message'
       };
     }
   };
   EOF

### WebSocket DynamoDB Table
- [ ] Add DynamoDB table for WebSocket connections:
   cat > terraform/modules/dynamodb/main.tf << 'EOF'
   resource "aws_dynamodb_table" "connections" {
     name           = "${var.environment}-websocket-connections"
     billing_mode   = "PAY_PER_REQUEST"
     hash_key       = "connectionId"
     
     attribute {
       name = "connectionId"
       type = "S"
     }

     tags = {
       Environment = var.environment
       Name        = "${var.environment}-websocket-connections"
     }
   }

   output "table_name" {
     value = aws_dynamodb_table.connections.name
   }
   EOF

### Client-side WebSocket Integration
- [x] Create WebSocket hook:
   cat > lib/hooks/use-websocket.ts << 'EOF'
   import { useEffect, useRef, useCallback } from 'react';
   import { useAuth } from './use-auth';

   export function useWebSocket() {
     const { getToken } = useAuth();
     const wsRef = useRef<WebSocket | null>(null);

     const connect = useCallback(async () => {
       const token = await getToken();
       const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}?token=${token}`);

       ws.onopen = () => {
         console.log('WebSocket connected');
       };

       ws.onmessage = (event) => {
         const data = JSON.parse(event.data);
         console.log('Received message:', data);
       };

       ws.onclose = () => {
         console.log('WebSocket disconnected');
       };

       ws.onerror = (error) => {
         console.error('WebSocket error:', error);
       };

       wsRef.current = ws;

       return () => {
         if (wsRef.current) {
           wsRef.current.close();
         }
       };
     }, [getToken]);

     const sendMessage = useCallback((message: any) => {
       if (wsRef.current?.readyState === WebSocket.OPEN) {
         wsRef.current.send(JSON.stringify(message));
       }
     }, []);

     useEffect(() => {
       const cleanup = connect();
       return () => {
         cleanup.then(disconnectFn => disconnectFn());
       };
     }, [connect]);

     return { sendMessage };
   }
   EOF

### Test Component
- [x] Create WebSocket test component:
   cat > components/websocket-test.tsx << 'EOF'
   import { useWebSocket } from "@/lib/hooks/use-websocket";
   import { Button } from "./ui/button";
   import { Input } from "./ui/input";
   import { useState } from "react";

   export function WebSocketTest() {
     const { sendMessage } = useWebSocket();
     const [message, setMessage] = useState("");

     const handleSend = () => {
       if (message.trim()) {
         sendMessage({ action: "message", message });
         setMessage("");
       }
     };

     return (
       <div className="flex gap-2">
         <Input
           value={message}
           onChange={(e) => setMessage(e.target.value)}
           placeholder="Enter message"
         />
         <Button onClick={handleSend}>Send</Button>
       </div>
     );
   }
   EOF

## S3 File Storage Integration

### S3 Bucket Setup
- [x] Add S3 bucket configuration to Terraform:
   cat > terraform/modules/s3/main.tf << 'EOF'
   resource "aws_s3_bucket" "storage" {
     bucket = "${var.environment}-${var.bucket_name}"

     tags = {
       Name        = "${var.environment}-${var.bucket_name}"
       Environment = var.environment
     }
   }

   resource "aws_s3_bucket_versioning" "storage" {
     bucket = aws_s3_bucket.storage.id
     versioning_configuration {
       status = "Enabled"
     }
   }

   resource "aws_s3_bucket_public_access_block" "storage" {
     bucket = aws_s3_bucket.storage.id

     block_public_acls       = true
     block_public_policy     = true
     ignore_public_acls      = true
     restrict_public_buckets = true
   }

   resource "aws_s3_bucket_cors_configuration" "storage" {
     bucket = aws_s3_bucket.storage.id

     cors_rule {
       allowed_headers = ["*"]
       allowed_methods = ["GET", "PUT", "POST", "DELETE"]
       allowed_origins = [var.allowed_origin]
       expose_headers  = ["ETag"]
       max_age_seconds = 3000
     }
   }

   output "bucket_name" {
     value = aws_s3_bucket.storage.id
   }

   output "bucket_arn" {
     value = aws_s3_bucket.storage.arn
   }
   EOF

### S3 Backend Service
- [ ] Create S3 service utilities:
   mkdir -p lib/services
   cat > lib/services/s3.ts << 'EOF'
   import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
   import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

   const s3Client = new S3Client({
     region: process.env.AWS_REGION,
     credentials: {
       accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
     },
   });

   export async function generatePresignedUploadUrl(key: string) {
     const command = new PutObjectCommand({
       Bucket: process.env.AWS_S3_BUCKET,
       Key: key,
     });

     return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
   }

   export async function generatePresignedDownloadUrl(key: string) {
     const command = new GetObjectCommand({
       Bucket: process.env.AWS_S3_BUCKET,
       Key: key,
     });

     return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
   }

   export async function deleteFile(key: string) {
     const command = new DeleteObjectCommand({
       Bucket: process.env.AWS_S3_BUCKET,
       Key: key,
     });

     return await s3Client.send(command);
   }
   EOF

### File Upload Components
- [ ] Create file upload hook:
   cat > lib/hooks/use-file-upload.ts << 'EOF'
   import { useState } from 'react';
   import { api } from '@/lib/api/client';

   export function useFileUpload() {
     const [isUploading, setIsUploading] = useState(false);
     const [progress, setProgress] = useState(0);

     const uploadFile = async (file: File) => {
       try {
         setIsUploading(true);
         setProgress(0);

         // Get presigned URL
         const { data: { url, key } } = await api.post('/api/upload-url', {
           fileName: file.name,
           fileType: file.type,
         });

         // Upload to S3
         await fetch(url, {
           method: 'PUT',
           body: file,
           headers: {
             'Content-Type': file.type,
           },
         });

         return key;
       } catch (error) {
         console.error('Upload failed:', error);
         throw error;
       } finally {
         setIsUploading(false);
         setProgress(100);
       }
     };

     return {
       uploadFile,
       isUploading,
       progress,
     };
   }
   EOF

- [ ] Create file upload component:
   cat > components/file-upload.tsx << 'EOF'
   import { useFileUpload } from "@/lib/hooks/use-file-upload";
   import { Button } from "./ui/button";
   import { Progress } from "./ui/progress";
   import { useState } from "react";

   export function FileUpload() {
     const { uploadFile, isUploading, progress } = useFileUpload();
     const [selectedFile, setSelectedFile] = useState<File | null>(null);

     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       if (e.target.files && e.target.files[0]) {
         setSelectedFile(e.target.files[0]);
       }
     };

     const handleUpload = async () => {
       if (!selectedFile) return;
       try {
         const key = await uploadFile(selectedFile);
         console.log('File uploaded successfully. Key:', key);
         setSelectedFile(null);
       } catch (error) {
         console.error('Upload failed:', error);
       }
     };

     return (
       <div className="space-y-4">
         <input
           type="file"
           onChange={handleFileChange}
           className="block w-full text-sm text-slate-500
             file:mr-4 file:py-2 file:px-4
             file:rounded-full file:border-0
             file:text-sm file:font-semibold
             file:bg-violet-50 file:text-violet-700
             hover:file:bg-violet-100"
         />
         {selectedFile && (
           <div className="space-y-2">
             <Button 
               onClick={handleUpload}
               disabled={isUploading}
             >
               {isUploading ? 'Uploading...' : 'Upload'}
             </Button>
             {isUploading && <Progress value={progress} />}
           </div>
         )}
       </div>
     );
   }
   EOF

### API Route for Presigned URLs
- [ ] Create upload URL API route:
   mkdir -p app/api/upload-url
   cat > app/api/upload-url/route.ts << 'EOF'
   import { generatePresignedUploadUrl } from "@/lib/services/s3";
   import { NextResponse } from "next/server";
   import { v4 as uuidv4 } from "uuid";

   export async function POST(request: Request) {
     try {
       const { fileName, fileType } = await request.json();
       
       // Generate unique key
       const key = `${uuidv4()}-${fileName}`;
       
       // Generate presigned URL
       const url = await generatePresignedUploadUrl(key);
       
       return NextResponse.json({ url, key });
     } catch (error) {
       console.error('Failed to generate upload URL:', error);
       return NextResponse.json(
         { error: 'Failed to generate upload URL' },
         { status: 500 }
       );
     }
   }
   EOF

### Environment Variables
- [ ] Update environment variables:
   cat >> .env.local << 'EOF'
   # AWS S3
   AWS_REGION=us-west-2
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_S3_BUCKET=your_bucket_name
   EOF

## Zustand State Management Setup

### Core Store Setup
- [ ] Create main store configuration:
   mkdir -p lib/store
   cat > lib/store/index.ts << 'EOF'
   import { create } from 'zustand'
   import { devtools, persist } from 'zustand/middleware'

   interface AppState {
     isLoading: boolean
     setIsLoading: (loading: boolean) => void
     error: string | null
     setError: (error: string | null) => void
   }

   export const useStore = create<AppState>()(
     devtools(
       persist(
         (set) => ({
           isLoading: false,
           setIsLoading: (loading) => set({ isLoading: loading }),
           error: null,
           setError: (error) => set({ error }),
         }),
         {
           name: 'app-storage',
         }
       )
     )
   )
   EOF

### Feature-Specific Stores
- [ ] Create auth store:
   cat > lib/store/auth.ts << 'EOF'
   import { create } from 'zustand'
   import { devtools } from 'zustand/middleware'

   interface User {
     id: string
     email: string
   }

   interface AuthState {
     user: User | null
     setUser: (user: User | null) => void
     token: string | null
     setToken: (token: string | null) => void
   }

   export const useAuthStore = create<AuthState>()(
     devtools(
       (set) => ({
         user: null,
         setUser: (user) => set({ user }),
         token: null,
         setToken: (token) => set({ token }),
       }),
       {
         name: 'auth-storage',
       }
     )
   )
   EOF

- [ ] Create UI store:
   cat > lib/store/ui.ts << 'EOF'
   import { create } from 'zustand'
   import { devtools } from 'zustand/middleware'

   interface UIState {
     isSidebarOpen: boolean
     setIsSidebarOpen: (isOpen: boolean) => void
     activeModal: string | null
     setActiveModal: (modalId: string | null) => void
     theme: 'light' | 'dark'
     setTheme: (theme: 'light' | 'dark') => void
   }

   export const useUIStore = create<UIState>()(
     devtools(
       (set) => ({
         isSidebarOpen: true,
         setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
         activeModal: null,
         setActiveModal: (modalId) => set({ activeModal: modalId }),
         theme: 'light',
         setTheme: (theme) => set({ theme }),
       }),
       {
         name: 'ui-storage',
       }
     )
   )
   EOF

### Store Hooks
- [ ] Create custom store hooks:
   cat > lib/hooks/use-app-store.ts << 'EOF'
   import { useStore } from '@/lib/store'
   import { useAuthStore } from '@/lib/store/auth'
   import { useUIStore } from '@/lib/store/ui'
   import { shallow } from 'zustand/shallow'

   export function useLoading() {
     return useStore(
       (state) => ({
         isLoading: state.isLoading,
         setIsLoading: state.setIsLoading,
       }),
       shallow
     )
   }

   export function useError() {
     return useStore(
       (state) => ({
         error: state.error,
         setError: state.setError,
       }),
       shallow
     )
   }

   export function useAuth() {
     return useAuthStore(
       (state) => ({
         user: state.user,
         setUser: state.setUser,
         token: state.token,
         setToken: state.setToken,
       }),
       shallow
     )
   }

   export function useUI() {
     return useUIStore(
       (state) => ({
         isSidebarOpen: state.isSidebarOpen,
         setIsSidebarOpen: state.setIsSidebarOpen,
         activeModal: state.activeModal,
         setActiveModal: state.setActiveModal,
         theme: state.theme,
         setTheme: state.setTheme,
       }),
       shallow
     )
   }
   EOF

### Store Provider Setup
- [ ] Create store provider component:
   cat > components/providers/store-provider.tsx << 'EOF'
   import { useEffect } from 'react'
   import { useAuth } from '@/lib/hooks/use-app-store'
   import { useAuth0 } from '@auth0/auth0-react'

   export function StoreProvider({ children }: { children: React.ReactNode }) {
     const { user: auth0User, isAuthenticated, getAccessTokenSilently } = useAuth0()
     const { setUser, setToken } = useAuth()

     useEffect(() => {
       if (isAuthenticated && auth0User) {
         setUser({
           id: auth0User.sub!,
           email: auth0User.email!,
         })

         getAccessTokenSilently().then(setToken)
       } else {
         setUser(null)
         setToken(null)
       }
     }, [isAuthenticated, auth0User, setUser, setToken, getAccessTokenSilently])

     return <>{children}</>
   }
   EOF

### Store Integration in Layout
- [ ] Update root layout with store provider:
   cat > app/layout.tsx << 'EOF'
   import "@/styles/globals.css"
   import { Inter } from "next/font/google"
   import { AuthProvider } from "@/components/providers/auth-provider"
   import { StoreProvider } from "@/components/providers/store-provider"
   import { cn } from "@/lib/utils"

   const inter = Inter({ subsets: ["latin"] })

   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode
   }) {
     return (
       <html lang="en">
         <body className={cn(
           "min-h-screen bg-background font-sans antialiased",
           inter.className
         )}>
           <AuthProvider>
             <StoreProvider>
               {children}
             </StoreProvider>
           </AuthProvider>
         </body>
       </html>
     )
   }
   EOF

## React Hook Form and Zod Integration

### Form Schema Setup
- [ ] Create base schemas directory:
   mkdir -p lib/schemas
   cat > lib/schemas/index.ts << 'EOF'
   export * from './auth'
   export * from './user'
   export * from './form'
   EOF

- [ ] Create common form schemas:
   cat > lib/schemas/form.ts << 'EOF'
   import { z } from 'zod'

   export const emailSchema = z.string().email('Invalid email address')

   export const passwordSchema = z
     .string()
     .min(8, 'Password must be at least 8 characters')
     .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
     .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
     .regex(/[0-9]/, 'Password must contain at least one number')

   export const nameSchema = z
     .string()
     .min(2, 'Name must be at least 2 characters')
     .max(50, 'Name must be less than 50 characters')
   EOF

- [ ] Create user form schemas:
   cat > lib/schemas/user.ts << 'EOF'
   import { z } from 'zod'
   import { emailSchema, passwordSchema, nameSchema } from './form'

   export const userSchema = z.object({
     id: z.string().uuid().optional(),
     email: emailSchema,
     firstName: nameSchema,
     lastName: nameSchema,
     role: z.enum(['USER', 'ADMIN']).default('USER'),
     createdAt: z.date().optional(),
     updatedAt: z.date().optional(),
   })

   export const createUserSchema = userSchema.omit({ 
     id: true, 
     createdAt: true, 
     updatedAt: true 
   })

   export const updateUserSchema = createUserSchema.partial()

   export type User = z.infer<typeof userSchema>
   export type CreateUserInput = z.infer<typeof createUserSchema>
   export type UpdateUserInput = z.infer<typeof updateUserSchema>
   EOF

### Form Components
- [ ] Create form wrapper component:
   mkdir -p components/forms
   cat > components/forms/form.tsx << 'EOF'
   import * as React from "react"
   import { useForm, UseFormProps } from "react-hook-form"
   import { zodResolver } from "@hookform/resolvers/zod"
   import type { z } from "zod"

   interface FormProps<T extends z.ZodType> extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
     schema: T
     onSubmit: (data: z.infer<T>) => void | Promise<void>
     defaultValues?: Partial<z.infer<T>>
     children: React.ReactNode
   }

   export function Form<T extends z.ZodType>({
     schema,
     onSubmit,
     children,
     defaultValues,
     ...props
   }: FormProps<T>) {
     const form = useForm({
       resolver: zodResolver(schema),
       defaultValues,
     })

     return (
       <form onSubmit={form.handleSubmit(onSubmit)} {...props}>
         {children}
       </form>
     )
   }
   EOF

- [ ] Create form field components:
   cat > components/forms/fields.tsx << 'EOF'
   import { useFormContext } from "react-hook-form"
   import { Input } from "@/components/ui/input"
   import { Label } from "@/components/ui/label"
   import { cn } from "@/lib/utils"

   interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
     name: string
     label?: string
   }

   export function TextField({ name, label, className, ...props }: FieldProps) {
     const { register, formState: { errors } } = useFormContext()
     const error = errors[name]

     return (
       <div className="space-y-2">
         {label && <Label htmlFor={name}>{label}</Label>}
         <Input
           {...register(name)}
           {...props}
           id={name}
           className={cn(
             error && "border-red-500 focus-visible:ring-red-500",
             className
           )}
         />
         {error?.message && (
           <p className="text-sm text-red-500">
             {error.message as string}
           </p>
         )}
       </div>
     )
   }
   EOF

### Example Form Implementation
- [ ] Create sample user form component:
   cat > components/forms/user-form.tsx << 'EOF'
   import { useForm, FormProvider } from "react-hook-form"
   import { zodResolver } from "@hookform/resolvers/zod"
   import { createUserSchema, type CreateUserInput } from "@/lib/schemas/user"
   import { TextField } from "./fields"
   import { Button } from "@/components/ui/button"
   import { useToast } from "@/components/ui/use-toast"

   interface UserFormProps {
     onSubmit: (data: CreateUserInput) => Promise<void>
   }

   export function UserForm({ onSubmit }: UserFormProps) {
     const { toast } = useToast()
     const form = useForm<CreateUserInput>({
       resolver: zodResolver(createUserSchema),
     })

     const handleSubmit = async (data: CreateUserInput) => {
       try {
         await onSubmit(data)
         form.reset()
         toast({
           title: "Success",
           description: "User created successfully",
         })
       } catch (error) {
         toast({
           title: "Error",
           description: "Failed to create user",
           variant: "destructive",
         })
       }
     }

     return (
       <FormProvider {...form}>
         <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
           <TextField
             name="firstName"
             label="First Name"
             placeholder="John"
           />
           <TextField
             name="lastName"
             label="Last Name"
             placeholder="Doe"
           />
           <TextField
             name="email"
             label="Email"
             type="email"
             placeholder="john@example.com"
           />
           <Button type="submit" disabled={form.formState.isSubmitting}>
             {form.formState.isSubmitting ? "Creating..." : "Create User"}
           </Button>
         </form>
       </FormProvider>
     )
   }
   EOF

### Form Validation Hook
- [ ] Create validation hook:
   cat > lib/hooks/use-form-validate.ts << 'EOF'
   import { useCallback } from 'react'
   import { z } from 'zod'

   export function useFormValidate<T extends z.ZodType>(schema: T) {
     return useCallback(
       async (data: unknown) => {
         try {
           const validData = await schema.parseAsync(data)
           return { data: validData, error: null }
         } catch (error) {
           if (error instanceof z.ZodError) {
             return { data: null, error: error.flatten() }
           }
           return { data: null, error: { message: 'Validation failed' } }
         }
       },
       [schema]
     )
   }
   EOF

### API Route with Validation
- [ ] Create example API route with form validation:
   mkdir -p app/api/users
   cat > app/api/users/route.ts << 'EOF'
   import { NextResponse } from "next/server"
   import { createUserSchema } from "@/lib/schemas/user"
   import { query } from "@/lib/db/utils"

   export async function POST(request: Request) {
     try {
       const body = await request.json()
       
       // Validate request body
       const result = createUserSchema.safeParse(body)
       if (!result.success) {
         return NextResponse.json(
           { error: "Invalid input", details: result.error.flatten() },
           { status: 400 }
         )
       }

       // Insert user into database
       const { email, firstName, lastName, role } = result.data
       const { rows } = await query(
         `INSERT INTO users (email, first_name, last_name, role)
          VALUES ($1, $2, $3, $4)
          RETURNING id, email, first_name, last_name, role, created_at`,
         [email, firstName, lastName, role]
       )

       return NextResponse.json(rows[0])
     } catch (error) {
       console.error("Failed to create user:", error)
       return NextResponse.json(
         { error: "Failed to create user" },
         { status: 500 }
       )
     }
   }
   EOF

## Deployment Setup

### Docker Configuration
- [ ] Create Dockerfile:
   cat > Dockerfile << 'EOF'
   # Build stage
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   # Production stage
   FROM node:18-alpine AS runner
   WORKDIR /app

   ENV NODE_ENV production

   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs

   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

   USER nextjs

   ENV PORT 3000
   ENV HOSTNAME "0.0.0.0"

   CMD ["node", "server.js"]
   EOF

- [ ] Create .dockerignore:
   cat > .dockerignore << 'EOF'
   node_modules
   .next
   .git
   .env*
   README.md
   .gitignore
   docker-compose*
   EOF

### ECS Task Definition
- [ ] Create ECS task definition in Terraform:
   cat > terraform/modules/ecs/task-definition.tf << 'EOF'
   resource "aws_ecs_task_definition" "app" {
     family                   = "${var.environment}-app"
     requires_compatibilities = ["FARGATE"]
     network_mode            = "awsvpc"
     cpu                     = 256
     memory                  = 512
     execution_role_arn      = aws_iam_role.ecs_execution.arn
     task_role_arn          = aws_iam_role.ecs_task.arn

     container_definitions = jsonencode([
       {
         name  = "app"
         image = "${var.ecr_repository_url}:latest"
         portMappings = [
           {
             containerPort = 3000
             hostPort      = 3000
             protocol      = "tcp"
           }
         ]
         environment = [
           {
             name  = "NODE_ENV"
             value = "production"
           },
           {
             name  = "DATABASE_URL"
             value = var.database_url
           }
         ]
         secrets = [
           {
             name      = "AUTH0_SECRET"
             valueFrom = "${var.ssm_parameter_prefix}/auth0-secret"
           },
           {
             name      = "AUTH0_CLIENT_SECRET"
             valueFrom = "${var.ssm_parameter_prefix}/auth0-client-secret"
           }
         ]
         logConfiguration = {
           logDriver = "awslogs"
           options = {
             "awslogs-group"         = "/ecs/${var.environment}-app"
             "awslogs-region"        = var.aws_region
             "awslogs-stream-prefix" = "ecs"
           }
         }
       }
     ])

     tags = {
       Name        = "${var.environment}-app"
       Environment = var.environment
     }
   }
   EOF

### ECS Service
- [ ] Create ECS service configuration:
   cat > terraform/modules/ecs/service.tf << 'EOF'
   resource "aws_ecs_cluster" "main" {
     name = "${var.environment}-cluster"

     setting {
       name  = "containerInsights"
       value = "enabled"
     }

     tags = {
       Name        = "${var.environment}-cluster"
       Environment = var.environment
     }
   }

   resource "aws_ecs_service" "app" {
     name            = "${var.environment}-app"
     cluster         = aws_ecs_cluster.main.id
     task_definition = aws_ecs_task_definition.app.arn
     desired_count   = 2
     launch_type     = "FARGATE"

     network_configuration {
       subnets          = var.private_subnet_ids
       security_groups  = [aws_security_group.ecs.id]
       assign_public_ip = false
     }

     load_balancer {
       target_group_arn = aws_lb_target_group.app.arn
       container_name   = "app"
       container_port   = 3000
     }

     deployment_circuit_breaker {
       enable   = true
       rollback = true
     }

     deployment_controller {
       type = "ECS"
     }

     tags = {
       Name        = "${var.environment}-app"
       Environment = var.environment
     }
   }
   EOF

### CI/CD Pipeline
- [ ] Create GitHub Actions workflow:
   mkdir -p .github/workflows
   cat > .github/workflows/deploy.yml << 'EOF'
   name: Deploy

   on:
     push:
       branches: [main]
     workflow_dispatch:

   env:
     AWS_REGION: us-west-2
     ECR_REPOSITORY: app
     ECS_CLUSTER: prod-cluster
     ECS_SERVICE: prod-app

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2

         - name: Configure AWS credentials
           uses: aws-actions/configure-aws-credentials@v1
           with:
             aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
             aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
             aws-region: ${{ env.AWS_REGION }}

         - name: Login to Amazon ECR
           id: login-ecr
           uses: aws-actions/amazon-ecr-login@v1

         - name: Build, tag, and push image to Amazon ECR
           env:
             ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
             IMAGE_TAG: ${{ github.sha }}
           run: |
             docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
             docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
             docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
             docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

         - name: Download task definition
           run: |
             aws ecs describe-task-definition \
               --task-definition $ECS_SERVICE \
               --query taskDefinition > task-definition.json

         - name: Fill in the new image ID in the Amazon ECS task definition
           id: task-def
           uses: aws-actions/amazon-ecs-render-task-definition@v1
           with:
             task-definition: task-definition.json
             container-name: app
             image: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ github.sha }}

         - name: Deploy Amazon ECS task definition
           uses: aws-actions/amazon-ecs-deploy-task-definition@v1
           with:
             task-definition: ${{ steps.task-def.outputs.task-definition }}
             service: ${{ env.ECS_SERVICE }}
             cluster: ${{ env.ECS_CLUSTER }}
             wait-for-service-stability: true
   EOF

### Database Migration Job
- [ ] Create database migration job:
   cat > terraform/modules/ecs/migration-job.tf << 'EOF'
   resource "aws_ecs_task_definition" "migration" {
     family                   = "${var.environment}-migration"
     requires_compatibilities = ["FARGATE"]
     network_mode            = "awsvpc"
     cpu                     = 256
     memory                  = 512
     execution_role_arn      = aws_iam_role.ecs_execution.arn
     task_role_arn          = aws_iam_role.ecs_task.arn

     container_definitions = jsonencode([
       {
         name  = "migration"
         image = "${var.ecr_repository_url}:latest"
         command = ["npm", "run", "migrate"]
         environment = [
           {
             name  = "NODE_ENV"
             value = "production"
           },
           {
             name  = "DATABASE_URL"
             value = var.database_url
           }
         ]
         logConfiguration = {
           logDriver = "awslogs"
           options = {
             "awslogs-group"         = "/ecs/${var.environment}-migration"
             "awslogs-region"        = var.aws_region
             "awslogs-stream-prefix" = "ecs"
           }
         }
       }
     ])

     tags = {
       Name        = "${var.environment}-migration"
       Environment = var.environment
     }
   }
   EOF

### SSL Certificate
- [ ] Create ACM certificate in Terraform:
   cat > terraform/modules/acm/main.tf << 'EOF'
   resource "aws_acm_certificate" "main" {
     domain_name       = var.domain_name
     validation_method = "DNS"

     subject_alternative_names = ["*.${var.domain_name}"]

     lifecycle {
       create_before_destroy = true
     }

     tags = {
       Name        = "${var.environment}-certificate"
       Environment = var.environment
     }
   }

   output "certificate_arn" {
     value = aws_acm_certificate.main.arn
   }
   EOF

### Load Balancer
- [ ] Create ALB configuration:
   cat > terraform/modules/alb/main.tf << 'EOF'
   resource "aws_lb" "main" {
     name               = "${var.environment}-alb"
     internal           = false
     load_balancer_type = "application"
     security_groups    = [aws_security_group.alb.id]
     subnets           = var.public_subnet_ids

     enable_deletion_protection = true

     tags = {
       Name        = "${var.environment}-alb"
       Environment = var.environment
     }
   }

   resource "aws_lb_target_group" "app" {
     name        = "${var.environment}-app"
     port        = 3000
     protocol    = "HTTP"
     vpc_id      = var.vpc_id
     target_type = "ip"

     health_check {
       healthy_threshold   = 2
       unhealthy_threshold = 10
       timeout             = 3
       interval            = 30
       path                = "/api/health"
       matcher             = "200"
     }

     tags = {
       Name        = "${var.environment}-app"
       Environment = var.environment
     }
   }

   resource "aws_lb_listener" "https" {
     load_balancer_arn = aws_lb.main.arn
     port              = "443"
     protocol          = "HTTPS"
     ssl_policy        = "ELBSecurityPolicy-2016-08"
     certificate_arn   = var.certificate_arn

     default_action {
       type             = "forward"
       target_group_arn = aws_lb_target_group.app.arn
     }
   }
   EOF

## Monitoring and Logging Setup

### CloudWatch Logs
- [ ] Create CloudWatch log groups in Terraform:
   cat > terraform/modules/cloudwatch/main.tf << 'EOF'
   resource "aws_cloudwatch_log_group" "app" {
     name              = "/ecs/${var.environment}-app"
     retention_in_days = 30

     tags = {
       Environment = var.environment
       Application = "app"
     }
   }

   resource "aws_cloudwatch_log_group" "migration" {
     name              = "/ecs/${var.environment}-migration"
     retention_in_days = 30

     tags = {
       Environment = var.environment
       Application = "migration"
     }
   }

   resource "aws_cloudwatch_log_group" "lambda" {
     name              = "/aws/lambda/${var.environment}"
     retention_in_days = 30

     tags = {
       Environment = var.environment
       Application = "lambda"
     }
   }
   EOF

### CloudWatch Metrics
- [ ] Create custom metrics configuration:
   cat > terraform/modules/cloudwatch/metrics.tf << 'EOF'
   resource "aws_cloudwatch_metric_alarm" "cpu_utilization_high" {
     alarm_name          = "${var.environment}-cpu-utilization-high"
     comparison_operator = "GreaterThanThreshold"
     evaluation_periods  = "2"
     metric_name        = "CPUUtilization"
     namespace          = "AWS/ECS"
     period             = "300"
     statistic          = "Average"
     threshold          = "85"
     alarm_description  = "CPU utilization is too high"
     alarm_actions      = [aws_sns_topic.alerts.arn]

     dimensions = {
       ClusterName = var.ecs_cluster_name
       ServiceName = var.ecs_service_name
     }
   }

   resource "aws_cloudwatch_metric_alarm" "memory_utilization_high" {
     alarm_name          = "${var.environment}-memory-utilization-high"
     comparison_operator = "GreaterThanThreshold"
     evaluation_periods  = "2"
     metric_name        = "MemoryUtilization"
     namespace          = "AWS/ECS"
     period             = "300"
     statistic          = "Average"
     threshold          = "85"
     alarm_description  = "Memory utilization is too high"
     alarm_actions      = [aws_sns_topic.alerts.arn]

     dimensions = {
       ClusterName = var.ecs_cluster_name
       ServiceName = var.ecs_service_name
     }
   }
   EOF

### Health Check API
- [ ] Create health check endpoint:
   mkdir -p app/api/health
   cat > app/api/health/route.ts << 'EOF'
   import { NextResponse } from "next/server"
   import { query } from "@/lib/db/utils"

   export async function GET() {
     try {
       // Check database connection
       await query('SELECT 1')
       
       // Add more health checks here (Redis, external services, etc.)
       
       return NextResponse.json({ 
         status: 'healthy',
         timestamp: new Date().toISOString()
       })
     } catch (error) {
       console.error('Health check failed:', error)
       return NextResponse.json(
         { 
           status: 'unhealthy',
           error: 'Service unavailable'
         },
         { status: 503 }
       )
     }
   }
   EOF

### Error Tracking
- [ ] Create error utility:
   mkdir -p lib/utils
   cat > lib/utils/error.ts << 'EOF'
   type ErrorWithMessage = {
     message: string
   }

   function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
     return (
       typeof error === 'object' &&
       error !== null &&
       'message' in error &&
       typeof (error as Record<string, unknown>).message === 'string'
     )
   }

   function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
     if (isErrorWithMessage(maybeError)) return maybeError

     try {
       return new Error(JSON.stringify(maybeError))
     } catch {
       return new Error(String(maybeError))
     }
   }

   export function getErrorMessage(error: unknown) {
     return toErrorWithMessage(error).message
   }
   EOF

### Performance Monitoring
- [ ] Create performance monitoring middleware:
   cat > middleware/performance.ts << 'EOF'
   import { NextResponse } from 'next/server'
   import type { NextRequest } from 'next/server'

   export function middleware(request: NextRequest) {
     const start = Date.now()
     const response = NextResponse.next()

     response.headers.set('X-Response-Time', `${Date.now() - start}ms`)
     
     // Log request timing to CloudWatch
     console.log({
       path: request.nextUrl.pathname,
       method: request.method,
       responseTime: Date.now() - start,
       timestamp: new Date().toISOString()
     })

     return response
   }

   export const config = {
     matcher: '/api/:path*',
   }
   EOF

### Alerting Configuration
- [ ] Create SNS topic for alerts:
   cat > terraform/modules/sns/main.tf << 'EOF'
   resource "aws_sns_topic" "alerts" {
     name = "${var.environment}-alerts"

     tags = {
       Environment = var.environment
     }
   }

   resource "aws_sns_topic_subscription" "alerts_email" {
     topic_arn = aws_sns_topic.alerts.arn
     protocol  = "email"
     endpoint  = var.alert_email
   }
   EOF

### Database Monitoring
- [ ] Create RDS monitoring configuration:
   cat > terraform/modules/rds/monitoring.tf << 'EOF'
   resource "aws_cloudwatch_metric_alarm" "database_cpu" {
     alarm_name          = "${var.environment}-database-cpu-high"
     comparison_operator = "GreaterThanThreshold"
     evaluation_periods  = "2"
     metric_name        = "CPUUtilization"
     namespace          = "AWS/RDS"
     period             = "300"
     statistic          = "Average"
     threshold          = "85"
     alarm_description  = "Database CPU utilization is too high"
     alarm_actions      = [var.sns_topic_arn]

     dimensions = {
       DBInstanceIdentifier = aws_db_instance.main.id
     }
   }

   resource "aws_cloudwatch_metric_alarm" "database_memory" {
     alarm_name          = "${var.environment}-database-memory-low"
     comparison_operator = "LessThanThreshold"
     evaluation_periods  = "2"
     metric_name        = "FreeableMemory"
     namespace          = "AWS/RDS"
     period             = "300"
     statistic          = "Average"
     threshold          = "100000000" # 100MB
     alarm_description  = "Database freeable memory is too low"
     alarm_actions      = [var.sns_topic_arn]

     dimensions = {
       DBInstanceIdentifier = aws_db_instance.main.id
     }
   }
   EOF

### Logging Utilities
- [x] Create logging utility:
   cat > lib/utils/logger.ts << 'EOF'
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
       ...(error && { error: {
         message: error.message,
         stack: error.stack
       }}),
       ...(context && { context })
     }

     // In production, this will be captured by CloudWatch
     console.log(JSON.stringify(logEntry))
   }
   EOF

### WebSocket Storage Setup
- [x] Add S3 bucket for WebSocket connections:
   cat > terraform/modules/s3/websocket.tf << 'EOF'
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
   EOF

### Database Setup
- [x] Create PostgreSQL on ECS:
   cat > terraform/modules/ecs/database.tf << 'EOF'
   // ... existing PostgreSQL ECS configuration ...
   EOF