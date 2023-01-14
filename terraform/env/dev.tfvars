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
bitcoin_container_image = "ruimarinho/bitcoin-core:23.0"
