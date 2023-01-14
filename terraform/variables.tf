// Common
variable "aws_region" {
  type        = string
  description = "AWS region. Must match region of vpc_id and public_subnet_ids."
}

variable "env" {
  type        = string
  description = "environment description used for namespacing"
}

// Bitcoin
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

// IPFS

variable "ipfs_cpu" {
  type        = number
  description = "vCPU units to allocate to the IPFS ECS task"
  default     = 1024 # 1024 = 1 vCPU
}

variable "ipfs_memory" {
  type        = number
  description = "Memory allocation per IPFS API instance"
  default     = 8192
}

variable "ipfs_task_count" {
  type        = number
  description = "Number of IPFS ECS tasks to run in the ECS service"
  default     = 1
}

variable "ipfs_enable_alb_logging" {
  type        = bool
  description = "True to enable ALB logs (stored in a new S3 bucket)"
  default     = false
}

variable "ipfs_default_log_level" {
  type        = string
  description = "IPFS default log level"
  default     = "info"
}

variable "use_existing_ipfs_peer_identities" {
  type        = string
  description = "Use existing IPFS peer identities"
  default     = false
}

// ION
