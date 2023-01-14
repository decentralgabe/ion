locals {
  HasAWSKey = !var.cluster_aws_key == ""
  HasAWSSecret = !var.cluster_aws_secret == ""
  stack_name = "ipfscluster-cf-final"
}

