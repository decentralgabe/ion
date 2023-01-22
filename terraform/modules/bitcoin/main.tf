# Cluster
module "ecs_bitcoin" {
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
    bitcoin-capacity = {
      auto_scaling_group_arn = module.autoscaling_bitcoin.autoscaling_group_arn

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

# Autoscaling
module "autoscaling_bitcoin" {
  source  = "terraform-aws-modules/autoscaling/aws"
  version = "~> 6.7.0"

  name = "${local.namespace}-ecs-autoscaling"

  key_name = var.bitcoin_key_name

  min_size                  = 0
  max_size                  = 1
  desired_capacity          = 1
  wait_for_capacity_timeout = 0
  health_check_type         = "EC2"
  vpc_zone_identifier       = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
  service_linked_role_arn   = aws_iam_service_linked_role.autoscaling_linked_role.arn

  image_id          = jsondecode(data.aws_ssm_parameter.ecs_optimized_ami.value)["image_id"]
  instance_type     = var.bitcoin_ec2_instance_type
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

  network_interfaces = [
    {
      delete_on_termination = true
      description           = "ssh, autoscaling, bitcoin, efs"
      device_index          = 0
      security_groups       = [aws_security_group.allow_ssh.id, module.autoscaling_sg_bitcoin.security_group_id, aws_security_group.default.id, aws_security_group.efs_sg.id]
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

module "autoscaling_sg_bitcoin" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 4.17.1"

  name   = "${local.namespace}-autoscaling-sg"
  vpc_id = aws_vpc.vpc.id

  ingress_with_source_security_group_id = [
    {
      from_port                = 8332
      to_port                  = 8332
      protocol                 = "tcp"
      description              = "btc port"
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
      description              = "btc api"
      source_security_group_id = aws_security_group.default.id
    }
  ]

  tags = {
    Name = "${local.namespace}-ecs-cluster-autoscaling-sg"
    Env  = "${var.env}"
  }
}

# Service
resource "aws_ecs_service" "ecs_service" {
  name    = "${local.namespace}-ecs-service"
  cluster = module.ecs_bitcoin.cluster_id

  network_configuration {
    assign_public_ip = false
    security_groups = [
      "${aws_security_group.default.id}",
      "${aws_security_group.allow_ssh.id}",
      "${aws_security_group.efs_sg.id}",
      "${module.autoscaling_sg_bitcoin.security_group_id}"
    ]
    subnets = [
      "${aws_subnet.private_subnet_1.id}",
      "${aws_subnet.private_subnet_2.id}"
    ]
  }

  load_balancer {
    target_group_arn = module.ecs_lb_bitcoin.target_group_arns[0]
    container_name   = local.bitcoin_container_image_name
    container_port   = 8332
  }

  desired_count                      = 1
  launch_type                        = "EC2"
  task_definition                    = aws_ecs_task_definition.ecs_task_definition.arn
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 0

  health_check_grace_period_seconds = 2147483647
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
  container_definitions = templatefile("${path.module}/templates/ecs_bitcoin_task.tpl", {
    bitcoin_container_image_name = local.bitcoin_container_image_name
    bitcoin_container_image      = var.bitcoin_container_image
    aws_region                   = var.aws_region
    bitcoin_task_log_group       = local.bitcoin_task_log_group
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
  cpu                      = var.bitcoin_task_cpu
  memory                   = var.bitcoin_task_memory
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
  name              = local.bitcoin_task_log_group
  retention_in_days = 7

  tags = {
    Name = "${local.namespace}-ecs-cluter-task-definition"
    Env  = "${var.env}"
  }
}
