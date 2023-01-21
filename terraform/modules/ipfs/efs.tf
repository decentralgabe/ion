resource "aws_efs_file_system" "efs_file_system" {
  creation_token   = "${local.namespace}-efs"
  performance_mode = "generalPurpose"
  throughput_mode  = "elastic"

  tags = {
    Name = "${local.namespace}-efs"
    Env  = "${var.env}"
  }

  depends_on = [aws_vpc.vpc]
}

resource "aws_efs_mount_target" "efs_mount_target_1" {
  file_system_id = aws_efs_file_system.efs_file_system.id
  security_groups = [
    "${aws_security_group.default.id}",
    "${aws_security_group.efs_sg.id}",
  ]
  subnet_id = aws_subnet.private_subnet_1.id

  depends_on = [aws_efs_file_system.efs_file_system]
}

resource "aws_efs_mount_target" "efs_mount_target_2" {
  file_system_id = aws_efs_file_system.efs_file_system.id
  security_groups = [
    "${aws_security_group.efs_sg.id}"
  ]
  subnet_id = aws_subnet.private_subnet_2.id

  depends_on = [aws_efs_file_system.efs_file_system]
}


# Allow traffic to/from the ECS task
resource "aws_security_group" "efs_sg" {
  name        = "${local.namespace}-efs-sg"
  description = "EFS security group to allow inbound/outbound from EFS to the VPC"
  vpc_id      = aws_vpc.vpc.id

  tags = {
    Name = "${local.namespace}-efs-sg"
    Env  = "${var.env}"
  }

  depends_on = [aws_vpc.vpc]
}

resource "aws_security_group_rule" "efs_from_ecs_task" {
  type                     = "ingress"
  from_port                = 2049
  to_port                  = 2049
  protocol                 = "tcp"
  security_group_id        = aws_security_group.efs_sg.id
  source_security_group_id = aws_security_group.default.id
}

resource "aws_security_group_rule" "efs_into_ecs_task" {
  type                     = "egress"
  from_port                = 0
  to_port                  = 0
  protocol                 = "-1"
  security_group_id        = aws_security_group.efs_sg.id
  source_security_group_id = aws_security_group.default.id
}
