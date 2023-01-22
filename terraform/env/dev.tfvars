# AWS Config
aws_region = "us-east-1"
env        = "dev"

# Networking
vpc_cidr              = "10.0.0.0/16"
public_subnet_cidr_1  = "10.0.0.0/20"
public_subnet_cidr_2  = "10.0.16.0/20"
private_subnet_cidr_1 = "10.0.128.0/20"
private_subnet_cidr_2 = "10.0.144.0/20"
availability_zone_1   = "us-east-1a"
availability_zone_2   = "us-east-1b"

# Bitcoin
bitcoin_container_image   = "ruimarinho/bitcoin-core:23.0"
bitcoin_ec2_instance_type = "m5n.large"
bitcoin_key_name          = "gabe"
bitcoin_task_cpu          = "2048"
bitcoin_task_cpu_count    = "2"
bitcoin_task_memory       = "7873"

# IPFS
ipfs_container_image_version = "latest"
ipfs_ec2_instance_type       = "t3.large"
ipfs_key_name                = "gabe"
ipfs_task_cpu                = "2048"
ipfs_task_cpu_count          = "2"
ipfs_task_memory             = "7873"
