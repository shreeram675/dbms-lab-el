provider "aws" {
  region = var.aws_region
}

# VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  name   = "blockchain-doc-vpc"
  cidr   = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
}

# RDS Postgres
module "db" {
  source = "terraform-aws-modules/rds/aws"
  identifier = "blockchain-doc-db"

  engine            = "postgres"
  engine_version    = "14"
  instance_class    = "db.t3.micro"
  allocated_storage = 20

  db_name  = "db_proj"
  username = "postgres"
  port     = "5432"

  subnet_ids             = module.vpc.private_subnets
  vpc_security_group_ids = [module.security_group.security_group_id]
}

# ECR
resource "aws_ecr_repository" "backend" {
  name = "blockchain-doc-backend"
}

# ECS Cluster
module "ecs" {
  source = "terraform-aws-modules/ecs/aws"
  cluster_name = "blockchain-doc-cluster"
  fargate_capacity_providers = {
    FARGATE = {
      default_capacity_provider_strategy = {
        weight = 100
      }
    }
  }
}

# ALB
module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  name    = "blockchain-doc-alb"
  vpc_id  = module.vpc.vpc_id
  subnets = module.vpc.public_subnets
  security_groups = [module.security_group.security_group_id]
}
