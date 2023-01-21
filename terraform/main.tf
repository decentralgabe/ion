provider "aws" {
  region = var.aws_region
}

provider "docker" {
  host = "http://registry.hub.docker.com"
}

module "bitcoin" {
  source                  = "./modules/bitcoin"
  aws_region              = var.aws_region
  env                     = var.env
  namespace               = "${var.env}-bitcoin"
  vpc_cidr                = var.vpc_cidr
  public_subnet_cidr_1    = var.public_subnet_cidr_1
  public_subnet_cidr_2    = var.public_subnet_cidr_2
  private_subnet_cidr_1   = var.private_subnet_cidr_1
  private_subnet_cidr_2   = var.private_subnet_cidr_2
  availability_zone_1     = var.availability_zone_1
  availability_zone_2     = var.availability_zone_2
  bitcoin_container_image = var.bitcoin_container_image
}

module "ipfs" {
  source                 = "./modules/ipfs"
  aws_region             = var.aws_region
  env                    = var.env
  namespace              = "${var.env}-ipfs"
  vpc_cidr               = var.vpc_cidr
  public_subnet_cidr_1   = var.public_subnet_cidr_1
  public_subnet_cidr_2   = var.public_subnet_cidr_2
  private_subnet_cidr_1  = var.private_subnet_cidr_1
  private_subnet_cidr_2  = var.private_subnet_cidr_2
  availability_zone_1    = var.availability_zone_1
  availability_zone_2    = var.availability_zone_2
  ipfs_container_image   = var.ipfs_container_image
  ipfs_ec2_instance_type = var.ipfs_ec2_instance_type
  ipfs_key_name          = var.ipfs_key_name
  ipfs_task_cpu          = var.ipfs_task_cpu
  ipfs_task_cpu_count    = var.ipfs_task_cpu_count
  ipfs_task_memory       = var.ipfs_task_memory
}

# module "ion" {
#   source       = "modules/ion"
#   aws_region   = var.aws_region
#   env          = var.env
#   namespace    = "${var.env}-ion"
#   bitcoin_host = module.bitcoin.host
#   ipfs_host    = module.ipfs.host
# }

