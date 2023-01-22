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
