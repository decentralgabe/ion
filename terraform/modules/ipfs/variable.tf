variable "vpc_id" {
  description = "The ID of the VPC to use to deploy this IPFS stack into"
  type = string
}

variable "cidr_block" {
  description = "VPC CIDR Block. In your VPC console, find the 'IPv4 CIDR' block associated with it. (e.g: 172.31.0.0/16 or 10.0.0.0/16 or any valid CIDR)"
  type = string
}

variable "availability_zone1" {
  description = "Availability zone 1 where the first node will be deployed to"
  type = string
}

variable "public_subnet1" {
  description = "Public subnet 1 within the availability zone 1 selected above"
  type = string
}

variable "availability_zone2" {
  description = "Availability zone 2 where the second node will be deployed to"
  type = string
}

variable "public_subnet2" {
  description = "Public subnet 2 within the availability zone 2 selected above"
  type = string
}

variable "availability_zone3" {
  description = "Availability zone 3 where the third node will be deployed to"
  type = string
}

variable "public_subnet3" {
  description = "Public subnet 3 within the availability zone 3 selected above"
  type = string
}

variable "cloudfront_prefix_list_id" {
  description = "Enter the ID of the Prefix List for 'com.amazonaws.global.cloudfront.origin-facing' so we can allow only Cloudfront to access our ALB. See AWS VPC Console -> Managed prefix lists."
  type = string
}

variable "docker_image_ipfs" {
  description = "The Docker image to use for IPFS. Reference your own custom Docker image (custom config)"
  type = string
  default = "ipfs/kubo:latest"
}

variable "docker_image_ipfs_cluster" {
  description = "The Docker image to use for IPFS Cluster"
  type = string
  default = "ipfs/ipfs-cluster:latest"
}

variable "cluster_crdt_trusted_peers" {
  description = "Trust all peers in the cluster or restict trust to some peers?"
  type = string
  default = "*"
}

variable "cluster_ipfshttp_node_muti_address" {
  description = "The IP Address of the IPFS API IPFS Cluster can connect to"
  type = string
  default = "/ip4/0.0.0.0/tcp/5001"
}

variable "cluster_monitoring_interval" {
  description = "How fast you want new peers to be detected"
  type = string
  default = "2s"
}

variable "cluster_restapi_basic_auth_credentials" {
  description = "The login:password combination needed to secure the IPFS Cluster API"
  type = string
}

variable "cluster_restapihttp_listen_multi_address" {
  description = "Enter the ip/port IPFS Cluster HTTP API will listen on"
  type = string
  default = "/ip4/0.0.0.0/tcp/9094"
}

variable "cluster_id" {
  description = "Provide the ID of your main IPFS Cluster node"
  type = string
}

variable "cluster_private_key" {
  description = "Provide the PRIVATE KEY of your main IPFS Cluster node"
  type = string
}

variable "cluster_secret" {
  description = "The SECRET to share amongst all IPFS CLuster nodes to restrict access"
  type = string
}

variable "cluster_s3_bucket" {
  description = "Optional. Can be used to reference a S3 bucket if you want to use the S3 plugin (https://github.com/ipfs/go-ds-s3)"
  type = string
}

variable "cluster_aws_key" {
  description = "Optional. ARN or Name (if same region) of the SSM Parameter store parameter containing the AWS Key to use for the S3 plugin (https://github.com/ipfs/go-ds-s3)"
  type = string
}

variable "cluster_aws_secret" {
  description = "Optional. ARN or Name (if same region) of the SSM Parameter store parameter containing the AWS Secret to use for the S3 plugin (https://github.com/ipfs/go-ds-s3)"
  type = string
}

variable "efs_throughput_mode" {
  description = "'bursting' is good if you use S3 as datastore or for small clusters. You may experience slowness with 'bursting' after sustained use. 'elastic' provides high performances but is much more expensive. See: https://docs.aws.amazon.com/efs/latest/ug/performance.html"
  type = string
  default = "bursting"
}

