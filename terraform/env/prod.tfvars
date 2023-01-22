# AWS Config
aws_region = "us-west-2"
env        = "prod"

# Networking
vpc_cidr              = "10.0.0.0/16"
public_subnet_cidr_1  = "10.0.0.0/20"
public_subnet_cidr_2  = "10.0.16.0/20"
private_subnet_cidr_1 = "10.0.128.0/20"
private_subnet_cidr_2 = "10.0.144.0/20"
availability_zone_1   = "us-west-1a"
availability_zone_2   = "us-west-1b"

# Bitcoin
bitcoin_container_image   = "ruimarinho/bitcoin-core:23.0"
bitcoin_ec2_instance_type = "m5n.2xlarge"
bitcoin_key_name          = "gabe"
bitcoin_task_cpu          = "8192"
bitcoin_task_cpu_count    = "8"
bitcoin_task_memory       = "30000"

# IPFS
ipfs_container_image_version = "latest"
ipfs_ec2_instance_type       = "t3.2xlarge"
ipfs_key_name                = "gabe"
ipfs_task_cpu                = "8192"
ipfs_task_cpu_count          = "8"
ipfs_task_memory             = "30000"
