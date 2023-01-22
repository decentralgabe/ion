# Load Balancer
module "ecs_lb_bitcoin" {
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
    bucket  = module.s3_alb_bitcoin.s3_bucket_id
    prefix  = local.namespace
    enabled = true
  }

  http_tcp_listeners = [
    {
      port               = 8332
      protocol           = "HTTP"
      target_group_index = 0
    }
  ]

  target_groups = [
    {
      name_prefix          = "ecs-tg"
      backend_protocol     = "HTTP"
      backend_port         = 8332
      target_type          = "ip"
      deregistration_delay = 10
      health_check = {
        enabled             = true
        interval            = 30
        path                = "/api/v0"
        port                = "8332"
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

module "s3_alb_bitcoin" {
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
