variable "aws_region" {
  type        = string
  description = "AWS region. Must match region of vpc_id and public_subnet_ids."
}

variable "env" {
  type        = string
  description = "environment description used for namespacing"
}
