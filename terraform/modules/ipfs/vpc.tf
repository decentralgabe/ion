# VPC
resource "aws_vpc" "vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  instance_tenancy     = "default"

  tags = {
    Name = "${local.namespace}-vpc"
    Env  = "${var.env}"
  }
}


# Internet gateway for the public subnet
resource "aws_internet_gateway" "ig" {
  vpc_id = aws_vpc.vpc.id

  tags = {
    Name = "${local.namespace}-igw"
    Env  = "${var.env}"
  }
}

# Public subnets
resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.vpc.id
  cidr_block              = var.public_subnet_cidr_1
  availability_zone       = var.availability_zone_1
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.namespace}-public-subnet-1"
    Env  = "${var.env}"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.vpc.id
  cidr_block              = var.public_subnet_cidr_2
  availability_zone       = var.availability_zone_2
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.namespace}-public-subnet-2"
    Env  = "${var.env}"
  }
}

# Private subnets
resource "aws_subnet" "private_subnet_1" {
  vpc_id                  = aws_vpc.vpc.id
  cidr_block              = var.private_subnet_cidr_1
  availability_zone       = var.availability_zone_2
  map_public_ip_on_launch = false

  tags = {
    Name = "${local.namespace}-private-subnet-1"
    Env  = "${var.env}"
  }
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id                  = aws_vpc.vpc.id
  cidr_block              = var.private_subnet_cidr_2
  availability_zone       = var.availability_zone_1
  map_public_ip_on_launch = false


  tags = {
    Name = "${local.namespace}-private-subnet-2"
    Env  = "${var.env}"
  }
}

# Routing table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.vpc.id

  tags = {
    Name = "${local.namespace}-public-route-table"
    Env  = "${var.env}"
  }
}

# Routing tables for private subnets
resource "aws_route_table" "private_1" {
  vpc_id = aws_vpc.vpc.id

  tags = {
    Name = "${local.namespace}-private-route-table-1"
    Env  = "${var.env}"
  }
}

resource "aws_route_table" "private_2" {
  vpc_id = aws_vpc.vpc.id

  tags = {
    Name = "${local.namespace}-private-route-table-2"
    Env  = "${var.env}"
  }
}

# NATs
resource "aws_nat_gateway" "nat_1" {
  allocation_id = aws_eip.nat_eip_1.id
  subnet_id     = aws_subnet.public_subnet_1.id

  tags = {
    Name = "${local.namespace}-nat-1"
    Env  = "${var.env}"
  }

  depends_on = [aws_internet_gateway.ig, aws_eip.nat_eip_1]
}

resource "aws_nat_gateway" "nat_2" {
  allocation_id = aws_eip.nat_eip_2.id
  subnet_id     = aws_subnet.public_subnet_2.id

  tags = {
    Name = "${local.namespace}-nat-2"
    Env  = "${var.env}"
  }

  depends_on = [aws_internet_gateway.ig, aws_eip.nat_eip_2]
}

# ENIs
resource "aws_network_interface" "eni_public_1" {
  description       = "Interface for NAT Gateway nat_1"
  subnet_id         = aws_subnet.public_subnet_1.id
  source_dest_check = false
}

resource "aws_network_interface" "eni_public_2" {
  description       = "Interface for NAT Gateway nat_2"
  subnet_id         = aws_subnet.public_subnet_2.id
  source_dest_check = false
}

# Elastic IPs for NATs
resource "aws_eip" "nat_eip_1" {
  vpc = true
}

resource "aws_eip" "nat_eip_2" {
  vpc = true
}

# Gateways - 1 public IGW, 2 NAT
resource "aws_route" "public_internet_gateway" {
  destination_cidr_block = "0.0.0.0/0"
  route_table_id         = aws_route_table.public.id
  gateway_id             = aws_internet_gateway.ig.id
}

resource "aws_route" "private_nat_gateway_1" {
  destination_cidr_block = "0.0.0.0/0"
  route_table_id         = aws_route_table.private_1.id
  nat_gateway_id         = aws_nat_gateway.nat_1.id
}

resource "aws_route" "private_nat_gateway_2" {
  destination_cidr_block = "0.0.0.0/0"
  route_table_id         = aws_route_table.private_2.id
  nat_gateway_id         = aws_nat_gateway.nat_2.id
}

# Route table associations
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_subnet_1.id
  route_table_id = aws_route_table.private_1.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_subnet_2.id
  route_table_id = aws_route_table.private_2.id
}

# Default VPC Security Group
resource "aws_security_group" "default" {
  name        = "${local.namespace}-default-sg"
  description = "Default security group to allow inbound/outbound from the VPC"
  vpc_id      = aws_vpc.vpc.id

  tags = {
    Name = "${local.namespace}-default-sg"
    Env  = "${var.env}"
  }

  depends_on = [aws_vpc.vpc]
}

resource "aws_security_group_rule" "swarm_port" {
  type              = "ingress"
  cidr_blocks       = ["0.0.0.0/0"]
  from_port         = 4001
  to_port           = 4001
  protocol          = "tcp"
  security_group_id = aws_security_group.default.id
}

resource "aws_security_group_rule" "rpc_port" {
  type              = "ingress"
  cidr_blocks       = ["0.0.0.0/0"]
  from_port         = 5001
  to_port           = 5001
  protocol          = "tcp"
  security_group_id = aws_security_group.default.id
}

resource "aws_security_group_rule" "gateway_port" {
  type              = "ingress"
  cidr_blocks       = ["0.0.0.0/0"]
  from_port         = 8080
  to_port           = 8080
  protocol          = "tcp"
  security_group_id = aws_security_group.default.id
}

resource "aws_security_group_rule" "ecs_task_from_efs" {
  type                     = "ingress"
  from_port                = 2049
  to_port                  = 2049
  protocol                 = "tcp"
  security_group_id        = aws_security_group.default.id
  source_security_group_id = aws_security_group.efs_sg.id
}

resource "aws_security_group_rule" "ecs_task_to_world" {
  type              = "egress"
  cidr_blocks       = ["0.0.0.0/0"]
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  security_group_id = aws_security_group.default.id
}

resource "aws_security_group_rule" "ecs_task_into_efs" {
  type                     = "egress"
  from_port                = 2049
  to_port                  = 2049
  protocol                 = "tcp"
  security_group_id        = aws_security_group.default.id
  source_security_group_id = aws_security_group.efs_sg.id
}
