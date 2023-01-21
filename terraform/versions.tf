terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.51.0"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "2.25.0"
    }
  }
  required_version = ">= 1.3.7"
}
