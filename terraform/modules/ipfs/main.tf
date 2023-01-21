# Cluster
module "ecs" {
  source  = "terraform-aws-modules/ecs/aws"
  version = "~> 4.1.2"

  cluster_name = "${local.namespace}-ecs"

  cluster_configuration = {
    execute_command_configuration = {
      logging = "OVERRIDE"
      log_configuration = {
        cloud_watch_log_group_name = "/aws/ecs/${local.namespace}-ecs-ec2"
      }
    }
  }

  cluster_settings = {
    name  = "containerInsights"
    value = "enabled"
  }

  default_capacity_provider_use_fargate = false

  autoscaling_capacity_providers = {
    one = {
      auto_scaling_group_arn = module.autoscaling.autoscaling_group_arn

      managed_scaling = {
        status          = "ENABLED"
        target_capacity = 1
      }
    }
  }

  tags = {
    Name = "${local.namespace}-ecs-cluster"
    Env  = "${var.env}"
  }

  depends_on = [aws_vpc.vpc]
}

# https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-optimized_AMI.html#ecs-optimized-ami-linux
data "aws_ssm_parameter" "ecs_optimized_ami" {
  name = "/aws/service/ecs/optimized-ami/amazon-linux-2/recommended"
}

resource "aws_iam_service_linked_role" "autoscaling_linked_role" {
  aws_service_name = "autoscaling.amazonaws.com"
  description      = "A service linked role for autoscaling"
  custom_suffix    = "${local.namespace}-autoscaling-linked-role"

  # Sometimes good sleep is required to have some IAM resources created before they can be used
  provisioner "local-exec" {
    command = "sleep 10"
  }
}

resource "aws_iam_instance_profile" "ssm_instance_profile" {
  name = "${local.namespace}-ssm-instance-profile"
  role = aws_iam_role.ssm_iam_role.name
}

resource "aws_iam_role" "ssm_iam_role" {
  name = "${local.namespace}-ssm-iam-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Principal = {
          Service = "ec2.amazonaws.com"
        },
        Effect = "Allow",
        Sid    = ""
      }
    ]
  })
}

module "autoscaling" {
  source  = "terraform-aws-modules/autoscaling/aws"
  version = "~> 6.7.0"

  name = "${local.namespace}-ecs-instance"

  key_name = var.ipfs_key_name

  min_size                  = 0
  max_size                  = 1
  desired_capacity          = 1
  wait_for_capacity_timeout = 0
  health_check_type         = "EC2"
  vpc_zone_identifier       = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
  service_linked_role_arn   = aws_iam_service_linked_role.autoscaling_linked_role.arn

  image_id          = jsondecode(data.aws_ssm_parameter.ecs_optimized_ami.value)["image_id"]
  instance_type     = var.ipfs_ec2_instance_type
  enable_monitoring = true

  user_data = base64encode(local.user_data)

  launch_template_name   = "${local.namespace}-ecs-autoscaling-launch-template"
  update_default_version = true

  metadata_options = {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 32
    instance_metadata_tags      = "enabled"
  }

  create_iam_instance_profile = true
  iam_role_name               = "${local.namespace}-ecs-autoscaling-iam"
  iam_role_path               = "/ec2/"
  iam_role_description        = "ECS role for ${local.namespace}"
  iam_role_policies = {
    AmazonEC2ContainerServiceforEC2Role = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
    AmazonSSMManagedInstanceCore        = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  }

  # target_group_arns = [module.ecs_lb.target_group_arns[0]]

  network_interfaces = [
    {
      delete_on_termination = true
      description           = "ssh, autoscaling, ipfs, efs"
      device_index          = 0
      security_groups       = [aws_security_group.allow_ssh.id, module.autoscaling_sg.security_group_id, aws_security_group.default.id, aws_security_group.efs_sg.id]
    }
  ]

  # https://github.com/hashicorp/terraform-provider-aws/issues/12582
  autoscaling_group_tags = {
    AmazonECSManaged = true
  }

  tags = {
    Name = "${local.namespace}-ecs-cluster-autoscaling"
    Env  = "${var.env}"
  }
}

module "autoscaling_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 4.17.1"

  name   = "${local.namespace}-autoscaling-sg"
  vpc_id = aws_vpc.vpc.id

  ingress_with_source_security_group_id = [
    {
      from_port                = 4001
      to_port                  = 4001
      protocol                 = "tcp"
      description              = "ipfs swarm"
      source_security_group_id = aws_security_group.default.id
    },
    {
      from_port                = 4001
      to_port                  = 4001
      protocol                 = "udp"
      description              = "ipfs swarm"
      source_security_group_id = aws_security_group.default.id
    },
    {
      from_port                = 5001
      to_port                  = 5001
      protocol                 = "tcp"
      description              = "ipfs rpc"
      source_security_group_id = aws_security_group.default.id
    },
    {
      from_port                = 8080
      to_port                  = 8080
      protocol                 = "tcp"
      description              = "ipfs gateway"
      source_security_group_id = aws_security_group.default.id
    },
    {
      from_port                = 2049
      to_port                  = 2049
      protocol                 = "tcp"
      description              = "efs"
      source_security_group_id = aws_security_group.efs_sg.id
    },
    {
      from_port                = 22
      to_port                  = 22
      protocol                 = "tcp"
      description              = "ssh"
      source_security_group_id = aws_security_group.allow_ssh.id
    }
  ]

  egress_with_source_security_group_id = [
    {
      from_port                = 2049
      to_port                  = 2049
      protocol                 = "tcp"
      description              = "efs"
      source_security_group_id = aws_security_group.efs_sg.id
    },
    {
      from_port                = 0
      to_port                  = 65535
      protocol                 = "tcp"
      description              = "ipfs api"
      source_security_group_id = aws_security_group.default.id
    }
  ]

  tags = {
    Name = "${local.namespace}-ecs-cluster-autoscaling-sg"
    Env  = "${var.env}"
  }
}

# Load Balancer
module "ecs_lb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 8.2.1"

  name               = "${local.namespace}-alb"
  load_balancer_type = "application"
  vpc_id             = aws_vpc.vpc.id
  security_groups    = [aws_security_group.default.id]
  subnets = [
    "${aws_subnet.public_subnet_1.id}",
    "${aws_subnet.public_subnet_2.id}"
  ]

  access_logs = {
    bucket  = module.s3_alb.s3_bucket_id
    prefix  = local.namespace
    enabled = true
  }

  http_tcp_listeners = [
    {
      port               = 4001
      protocol           = "HTTP"
      target_group_index = 0
    },
    {
      port               = 8080
      protocol           = "HTTP"
      target_group_index = 0
    }
  ]

  target_groups = [
    {
      name_prefix          = "ecs-tg"
      backend_protocol     = "HTTP"
      backend_port         = 8080
      target_type          = "ip"
      deregistration_delay = 10
      health_check = {
        enabled             = true
        interval            = 30
        path                = "/api/v0"
        port                = "5001"
        healthy_threshold   = 3
        unhealthy_threshold = 3
        timeout             = 6
        protocol            = "HTTP"
        matcher             = "200-399"
      }
    }
  ]

  tags = {
    Name = "${local.namespace}-ecs-cluster-lb"
    Env  = "${var.env}"
  }
}

module "s3_alb" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 3.6.0"

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

# Service
resource "aws_ecs_service" "ecs_service" {
  name    = "${local.namespace}-ecs-service"
  cluster = module.ecs.cluster_id

  network_configuration {
    assign_public_ip = false
    security_groups = [
      "${aws_security_group.default.id}",
      "${aws_security_group.allow_ssh.id}",
      "${aws_security_group.efs_sg.id}",
      "${module.autoscaling_sg.security_group_id}"
    ]
    subnets = [
      "${aws_subnet.private_subnet_1.id}",
      "${aws_subnet.private_subnet_2.id}"
    ]
  }

  load_balancer {
    target_group_arn = module.ecs_lb.target_group_arns[0]
    container_name   = local.ipfs_container_image_name
    container_port   = 8080
  }

  desired_count                      = 1
  launch_type                        = "EC2"
  task_definition                    = aws_ecs_task_definition.ecs_task_definition.arn
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 0

  health_check_grace_period_seconds = 600
  scheduling_strategy               = "REPLICA"

  # redeploy on every apply
  force_new_deployment = true

  tags = {
    Name = "${local.namespace}-ecs-service"
    Env  = "${var.env}"
  }

  depends_on = [aws_cloudwatch_log_group.ecs_task_log_group]
}

# Task Definition
resource "aws_ecs_task_definition" "ecs_task_definition" {
  container_definitions = templatefile("${path.module}/templates/ecs_ipfs_task.tpl", {
    ipfs_container_image_name = local.ipfs_container_image_name
    ipfs_container_image      = var.ipfs_container_image
    ipfs_task_cpu_count       = tonumber(var.ipfs_task_cpu_count)
    ipfs_task_memory          = tonumber(var.ipfs_task_memory)
    aws_region                = var.aws_region
    ipfs_task_log_group       = local.ipfs_task_log_group
  })
  family             = "${local.namespace}-ecs-task"
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

  requires_compatibilities = ["EC2"]
  cpu                      = var.ipfs_task_cpu
  memory                   = var.ipfs_task_memory
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
  name              = local.ipfs_task_log_group
  retention_in_days = 7

  tags = {
    Name = "${local.namespace}-ecs-cluter-task-definition"
    Env  = "${var.env}"
  }
}


# allow ssh into private instances
resource "aws_security_group" "allow_ssh" {
  vpc_id      = aws_vpc.vpc.id
  name        = "allow-ssh"
  description = "security group that allows ssh and all egress traffic"
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
    Name = "${local.namespace}-allow-ssh-sg"
    Env  = "${var.env}"
  }
}


# ssh bastion
resource "aws_instance" "bastion_instance" {
  ami           = jsondecode(data.aws_ssm_parameter.ecs_optimized_ami.value)["image_id"]
  instance_type = "t2.micro"

  subnet_id = aws_subnet.public_subnet_1.id

  vpc_security_group_ids = [aws_security_group.allow_ssh.id]

  key_name = var.ipfs_key_name

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 32
    instance_metadata_tags      = "enabled"
  }

  tags = {
    Name = "${local.namespace}-bastion-instance"
    Env  = "${var.env}"
  }
}
