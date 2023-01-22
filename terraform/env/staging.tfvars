# AWS Config
aws_region = "us-west-2"
env        = "staging"

# Networking
vpc_cidr              = "10.0.0.0/16"
public_subnet_cidr_1  = "10.0.0.0/20"
public_subnet_cidr_2  = "10.0.16.0/20"
private_subnet_cidr_1 = "10.0.128.0/20"
private_subnet_cidr_2 = "10.0.144.0/20"
availability_zone_1   = "us-west-2a"
availability_zone_2   = "us-west-2b"

# Bitcoin
bitcoin_container_image   = "ruimarinho/bitcoin-core:23.0"
bitcoin_ec2_instance_type = "m5n.nlarge"
bitcoin_key_name          = "gabe"
bitcoin_task_cpu          = "2048"
bitcoin_task_cpu_count    = "2"
bitcoin_task_memory       = "7873"

# IPFS
ipfs_container_image_version = "latest"
ipfs_ec2_instance_type       = "t3.xlarge"
ipfs_key_name                = "gabe"
ipfs_task_cpu                = "4096"
ipfs_task_cpu_count          = "4"
ipfs_task_memory             = "15500"
