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

variable "bitcoin_container_image" {
  type        = string
  description = "bitcoin image value e.g. \"ruimarinho/bitcoin-core:23.0\""
}
