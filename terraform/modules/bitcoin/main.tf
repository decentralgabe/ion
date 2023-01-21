# Cluster
resource "aws_ecs_cluster" "ecs_cluster" {
  name = "${local.namespace}-ecs"

  tags = {
    Name = "${local.namespace}-ecs-cluster"
    Env  = "${var.env}"
  }
}

# Load Balancer
resource "aws_lb" "ecs_cluster_lb" {
  name               = "${local.namespace}-alb"
  internal           = false
  load_balancer_type = "application"
  subnets = [
    "${aws_subnet.public_subnet_1.id}",
    "${aws_subnet.public_subnet_2.id}"
  ]
  security_groups = [
    aws_security_group.default.id
  ]
  ip_address_type                  = "ipv4"
  idle_timeout                     = "60"
  enable_deletion_protection       = "false"
  enable_http2                     = "true"
  enable_cross_zone_load_balancing = "true"

  access_logs {
    bucket  = module.s3_alb.s3_bucket_id
    prefix  = local.namespace
    enabled = true
  }

  tags = {
    Name = "${local.namespace}-ecs-cluster-lb"
    Env  = "${var.env}"
  }
}

module "s3_alb" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "3.6.0"

  bucket = "${local.namespace}-alb-logs"
  acl    = "private"

  attach_elb_log_delivery_policy = true

  lifecycle_rule = [
    {
      id      = "log"
      enabled = true
      expiration = {
        days = 60
      }
    }
  ]

  tags = {
    Name = "${local.namespace}-ecs-cluster-lb-logs"
    Env  = "${var.env}"
  }
}

resource "aws_lb_target_group" "ecs_cluster_lb_tg" {
  health_check {
    interval            = 300
    path                = "/"
    port                = "8332"
    protocol            = "HTTP"
    timeout             = 120
    unhealthy_threshold = 10
    healthy_threshold   = 3
    matcher             = "200"
  }

  name        = "${local.namespace}-alb-tg"
  port        = 8332
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.vpc.id

  depends_on = [aws_lb.ecs_cluster_lb]

  tags = {
    Name = "${local.namespace}-ecs-lb-tg"
    Env  = "${var.env}"
  }
}

resource "aws_lb_listener" "ecs_cluster_lb_listener" {
  load_balancer_arn = aws_lb.ecs_cluster_lb.arn
  port              = 8332
  protocol          = "HTTP"

  default_action {
    target_group_arn = aws_lb_target_group.ecs_cluster_lb_tg.arn
    type             = "forward"
  }

  depends_on = [aws_lb_target_group.ecs_cluster_lb_tg]

  tags = {
    Name = "${local.namespace}-ecs-cluter-lb-listener"
    Env  = "${var.env}"
  }
}

# Task/Execution Role and Policy
resource "aws_iam_role" "ecs_task_role" {
  name = "${local.namespace}-ecs-task-role"
  path = "/"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      },
    ]
  })
  managed_policy_arns = [aws_iam_policy.ecs_task_policy.id]
}

resource "aws_iam_policy" "ecs_task_policy" {
  name = "${local.namespace}-ecs-task-policy"

  policy = jsonencode({
    Version : "2012-10-17",
    Statement : [
      {
        Effect : "Allow",
        Action : [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource : "*"
      }
    ]
  })
}

# Log Group for Task
resource "aws_cloudwatch_log_group" "ecs_task_log_group" {
  name = local.bitcoin_task_log_group

  tags = {
    Name = "${local.namespace}-ecs-cluter-task-definition"
    Env  = "${var.env}"
  }
}


# Task Definition
resource "aws_ecs_task_definition" "ecs_task_definition" {
  container_definitions = templatefile("${path.module}/templates/ecs_bitcoin_task.tpl", {
    bitcoin_container_image_name = local.bitcoin_container_image_name
    bitcoin_container_image      = var.bitcoin_container_image
    aws_region                   = var.aws_region
    bitcoin_task_log_group       = local.bitcoin_task_log_group
  })
  family             = "${local.namespace}-fargate"
  task_role_arn      = aws_iam_role.ecs_task_role.arn
  execution_role_arn = aws_iam_role.ecs_task_role.arn
  network_mode       = "awsvpc"

  volume {
    name = "efs"

    efs_volume_configuration {
      file_system_id = aws_efs_file_system.efs_file_system.id
      root_directory = "/"
    }
  }

  requires_compatibilities = ["FARGATE"]
  cpu                      = "2048"
  memory                   = "4096"
}

# Service
resource "aws_ecs_service" "ecs_service" {
  name    = "${local.namespace}-ecs-service"
  cluster = aws_ecs_cluster.ecs_cluster.id

  load_balancer {
    target_group_arn = aws_lb_target_group.ecs_cluster_lb_tg.arn
    container_name   = local.bitcoin_container_image_name
    container_port   = 8332
  }

  desired_count                      = 1
  launch_type                        = "FARGATE"
  platform_version                   = "LATEST"
  task_definition                    = aws_ecs_task_definition.ecs_task_definition.arn
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  network_configuration {
    assign_public_ip = false
    security_groups = [
      "${aws_security_group.default.id}"
    ]
    subnets = [
      "${aws_subnet.private_subnet_1.id}",
      "${aws_subnet.private_subnet_2.id}"
    ]
  }
  health_check_grace_period_seconds = 1209600 # 2 weeks
  scheduling_strategy               = "REPLICA"

  tags = {
    Name = "${local.namespace}-ecs-cluter-task-definition"
    Env  = "${var.env}"
  }

  depends_on = [aws_cloudwatch_log_group.ecs_task_log_group]
}
