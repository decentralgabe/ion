variable "aws_region" {
  type        = string
  description = "AWS region. Must match region of vpc_id and public_subnet_ids."
}

variable "env" {
  type        = string
  description = "environment description used for namespacing"
}

variable "namespace" {
  type        = string
  description = "namespace for the resource"
}

variable "vpc_cidr" {
  type        = string
  description = "The CIDR block of the vpc"
}

variable "public_subnet_cidr_1" {
  type        = string
  description = "The CIDR block for the first public subnet"
}

variable "public_subnet_cidr_2" {
  type        = string
  description = "The CIDR block for the second public subnet"
}

variable "private_subnet_cidr_1" {
  type        = string
  description = "The CIDR block for the first private subnet"
}

variable "private_subnet_cidr_2" {
  type        = string
  description = "The CIDR block for the second private subnet"
}

variable "availability_zone_1" {
  type        = string
  description = "The first az that the resources will be launched in"
}

variable "availability_zone_2" {
  type        = string
  description = "The second az that the resources will be launched in"
}

variable "ipfs_container_image_version" {
  type        = string
  description = "ipfs image version value e.g. `latest`"
}

variable "ipfs_ec2_instance_type" {
  type        = string
  description = "ec2 instance type to run"
}

variable "ipfs_key_name" {
  type        = string
  description = "ssh key to add to ec2 instances"
}

variable "ipfs_task_cpu" {
  type        = string
  description = "vCPU for instance * 1024 https://aws.amazon.com/ec2/instance-types/"
}

variable "ipfs_task_cpu_count" {
  type        = string
  description = "vCPU count for instance https://aws.amazon.com/ec2/instance-types/"
}

variable "ipfs_task_memory" {
  type        = string
  description = "Memory limit for instance in GiB * 1024 https://aws.amazon.com/ec2/instance-types/"
}
