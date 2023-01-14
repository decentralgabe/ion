resource "aws_security_group" "ec2_sgefs" {
  vpc_id = var.vpc_id
  description = "Allow EFS access from IPFS cluster"
  name = join("-", [local.stack_name, "ipfs-efs"])
  egress = [
    {
      cidr_blocks = var.cidr_block
      from_port = 0
      to_port = 65525
      protocol = -1
      description = "Traffic can only go to internal network"
    }
  ]
  ingress = [
    {
      cidr_blocks = var.cidr_block
      from_port = 2049
      to_port = 2049
      protocol = "TCP"
      description = "Incoming NFS connections from the IPFS nodes"
    }
  ]
}

resource "aws_security_group" "ec2_sgecs" {
  vpc_id = var.vpc_id
  description = "Allow access to IPFS nodes"
  name = join("-", [local.stack_name, "ipfs-nodes"])
  egress = [
    {
      cidr_blocks = "0.0.0.0/0"
      from_port = 0
      to_port = 65535
      protocol = -1
      description = "Allow traffic out to any Internet destinations"
    }
  ]
  ingress = [
    {
      cidr_blocks = var.cidr_block
      from_port = 9096
      to_port = 9096
      protocol = "TCP"
      description = "IPFS Cluster Swarm from internal network only"
    },
    {
      security_groups = aws_security_group.ec2_sgalb.arn
      from_port = 9094
      to_port = 9094
      protocol = "TCP"
      description = "IPFS CLuster REST API from ipfs ALB security group only"
    },
    {
      security_groups = aws_security_group.ec2_sgalb.arn
      from_port = 8080
      to_port = 8080
      protocol = "TCP"
      description = "IPFS Gateway from ipfs ALB security group only"
    },
    {
      cidr_blocks = "0.0.0.0/0"
      from_port = 4001
      to_port = 4001
      protocol = "TCP"
      description = "IPFS swarm port open to the Internet"
    },
    {
      cidr_blocks = var.cidr_block
      from_port = 5001
      to_port = 5001
      protocol = "TCP"
      description = "IPFS RPC API from internal network only"
    }
  ]
}

resource "aws_efs_file_system" "efsfs1" {
  availability_zone_name = var.availability_zone1
  encrypted = True
  throughput_mode = var.efs_throughput_mode
  tags = [
    {
      Key = "Name"
      Value = join("-", [local.stack_name, "ipfs", var.availability_zone1])
    }
  ]
}

resource "aws_efs_file_system" "efsfs2" {
  availability_zone_name = var.availability_zone2
  encrypted = True
  throughput_mode = var.efs_throughput_mode
  tags = [
    {
      Key = "Name"
      Value = join("-", [local.stack_name, "ipfs", var.availability_zone2])
    }
  ]
}

resource "aws_efs_file_system" "efsfs3" {
  availability_zone_name = var.availability_zone3
  encrypted = True
  throughput_mode = var.efs_throughput_mode
  tags = [
    {
      Key = "Name"
      Value = join("-", [local.stack_name, "ipfs", var.availability_zone3])
    }
  ]
}

resource "aws_efs_mount_target" "efsmt1" {
  file_system_id = aws_efs_file_system.efsfs1.arn
  subnet_id = var.public_subnet1
  security_groups = [
    aws_security_group.ec2_sgefs.arn
  ]
}

resource "aws_efs_access_point" "efsap1" {
  tags = [
    {
      Key = "Name"
      Value = join("-", [local.stack_name, "ipfs"])
    }
  ]
  root_directory = {
    Path = "/"
  }
  file_system_id = aws_efs_file_system.efsfs1.arn
}

resource "aws_efs_mount_target" "efsmt2" {
  file_system_id = aws_efs_file_system.efsfs2.arn
  subnet_id = var.public_subnet2
  security_groups = [
    aws_security_group.ec2_sgefs.arn
  ]
}

resource "aws_efs_access_point" "efsap2" {
  tags = [
    {
      Key = "Name"
      Value = join("-", [local.stack_name, "ipfs"])
    }
  ]
  root_directory = {
    Path = "/"
  }
  file_system_id = aws_efs_file_system.efsfs2.arn
}

resource "aws_efs_mount_target" "efsmt3" {
  file_system_id = aws_efs_file_system.efsfs3.arn
  subnet_id = var.public_subnet3
  security_groups = [
    aws_security_group.ec2_sgefs.arn
  ]
}

resource "aws_efs_access_point" "efsap3" {
  tags = [
    {
      Key = "Name"
      Value = join("-", [local.stack_name, "ipfs"])
    }
  ]
  root_directory = {
    Path = "/"
  }
  file_system_id = aws_efs_file_system.efsfs3.arn
}

resource "aws_ecs_cluster" "ecscipfs" {
  name = local.stack_name
  capacity_providers = [
    "FARGATE",
    "FARGATE_SPOT"
  ]
}

resource "aws_ecs_task_definition" "ecstd1" {
  family = join("-", [local.stack_name, "ipfs-node", var.availability_zone1])
  cpu = 1024
  memory = 2048
  network_mode = "awsvpc"
  requires_compatibilities = [
    "FARGATE"
  ]
  execution_role_arn = aws_iam_role.iamrexec.arn
  task_role_arn = aws_iam_role.iamrtask.arn
  runtime_platform = {
    CpuArchitecture = "X86_64"
    OperatingSystemFamily = "LINUX"
  }
  volume = [
    {
      name = "ipfs"
      efs_volume_configuration = {
        AuthorizationConfig = {
          IAM = "DISABLED"
          AccessPointId = aws_efs_access_point.efsap1.arn
        }
        FilesystemId = aws_efs_file_system.efsfs1.arn
        TransitEncryption = "ENABLED"
      }
    }
  ]
  container_definitions = [
    {
      Name = "ipfs"
      Image = var.docker_image_ipfs
      Secrets = [
        local.HasAWSKey ? {
  Name = "CLUSTER_AWS_KEY"
  ValueFrom = var.cluster_aws_key
} : null,
        local.HasAWSSecret ? {
  Name = "CLUSTER_AWS_SECRET"
  ValueFrom = var.cluster_aws_secret
} : null
      ]
      Environment = [
        {
          Name = "CLUSTER_S3_BUCKET"
          Value = var.cluster_s3_bucket
        },
        {
          Name = "CLUSTER_PEERNAME"
          Value = join("-", [local.stack_name, "node1"])
        },
        {
          Name = "AWS_REGION"
          Value = data.aws_region.current.name
        }
      ]
      PortMappings = [
        {
          ContainerPort = 4001
          HostPort = 4001
          Protocol = "tcp"
        },
        {
          ContainerPort = 5001
          HostPort = 5001
          Protocol = "tcp"
        },
        {
          ContainerPort = 8080
          HostPort = 8080
          Protocol = "tcp"
        }
      ]
      MountPoints = [
        {
          ContainerPath = "/data/ipfs"
          SourceVolume = "ipfs"
        }
      ]
      LogConfiguration = {
        LogDriver = "awslogs"
        Options = {
          awslogs-group = join("", ["/ecs/", local.stack_name, "-ipfs-node-", var.availability_zone1])
          awslogs-region = data.aws_region.current.name
          awslogs-stream-prefix = "ipfs"
        }
      }
      HealthCheck = {
        Command = [
          "CMD-SHELL",
          "/usr/local/bin/ipfs dag stat /ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn || exit 1"
        ]
      }
    },
    {
      Name = "ipfs-cluster"
      Image = var.docker_image_ipfs_cluster
      DependsOn = [
        {
          Condition = "HEALTHY"
          ContainerName = "ipfs"
        }
      ]
      Secrets = [
        {
          Name = "CLUSTER_ID"
          ValueFrom = aws_ssm_parameter.ssmpclusterid.arn
        },
        {
          Name = "CLUSTER_PRIVATEKEY"
          ValueFrom = aws_ssm_parameter.ssmpclusterprivatekey.arn
        },
        {
          Name = "CLUSTER_SECRET"
          ValueFrom = aws_ssm_parameter.ssmpclustersecret.arn
        },
        {
          Name = "CLUSTER_RESTAPI_BASICAUTHCREDENTIALS"
          ValueFrom = aws_ssm_parameter.ssmpclusterbasicauth.arn
        }
      ]
      Environment = [
        {
          Name = "CLUSTER_CRDT_TRUSTEDPEERS"
          Value = var.cluster_crdt_trusted_peers
        },
        {
          Name = "CLUSTER_MONITORPINGINTERVAL"
          Value = var.cluster_monitoring_interval
        },
        {
          Name = "CLUSTER_PEERNAME"
          Value = join("-", [local.stack_name, "node1"])
        },
        {
          Name = "CLUSTER_IPFSHTTP_NODEMULTIADDRESS"
          Value = var.cluster_ipfshttp_node_muti_address
        },
        {
          Name = "CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS"
          Value = var.cluster_restapihttp_listen_multi_address
        }
      ]
      PortMappings = [
        {
          ContainerPort = 9094
          HostPort = 9094
          Protocol = "tcp"
        },
        {
          ContainerPort = 9096
          HostPort = 9096
          Protocol = "tcp"
        }
      ]
      MountPoints = [
        {
          ContainerPath = "/data/ipfs-cluster"
          SourceVolume = "ipfs"
        }
      ]
      LogConfiguration = {
        LogDriver = "awslogs"
        Options = {
          awslogs-group = join("", ["/ecs/", local.stack_name, "-ipfs-node-", var.availability_zone1])
          awslogs-region = data.aws_region.current.name
          awslogs-stream-prefix = "ipfs-cluster"
        }
      }
      HealthCheck = {
        Command = [
          "CMD-SHELL",
          join(" ", ["/usr/local/bin/ipfs-cluster-ctl", "--force-http", "--basic-auth", aws_ssm_parameter.ssmpclusterbasicauth.arn, "|| exit 1"])
        ]
      }
    }
  ]
}

resource "aws_ecs_task_definition" "ecstd2" {
  family = join("-", [local.stack_name, "ipfs-node", var.availability_zone2])
  cpu = 1024
  memory = 2048
  network_mode = "awsvpc"
  requires_compatibilities = [
    "FARGATE"
  ]
  execution_role_arn = aws_iam_role.iamrexec.arn
  task_role_arn = aws_iam_role.iamrtask.arn
  runtime_platform = {
    CpuArchitecture = "X86_64"
    OperatingSystemFamily = "LINUX"
  }
  volume = [
    {
      name = "ipfs"
      efs_volume_configuration = {
        AuthorizationConfig = {
          IAM = "DISABLED"
          AccessPointId = aws_efs_access_point.efsap2.arn
        }
        FilesystemId = aws_efs_file_system.efsfs2.arn
        TransitEncryption = "ENABLED"
      }
    }
  ]
  container_definitions = [
    {
      Name = "ipfs"
      Image = var.docker_image_ipfs
      Secrets = [
        local.HasAWSKey ? {
  Name = "CLUSTER_AWS_KEY"
  ValueFrom = var.cluster_aws_key
} : null,
        local.HasAWSSecret ? {
  Name = "CLUSTER_AWS_SECRET"
  ValueFrom = var.cluster_aws_secret
} : null
      ]
      Environment = [
        {
          Name = "CLUSTER_S3_BUCKET"
          Value = var.cluster_s3_bucket
        },
        {
          Name = "CLUSTER_PEERNAME"
          Value = join("-", [local.stack_name, "node2"])
        },
        {
          Name = "AWS_REGION"
          Value = data.aws_region.current.name
        }
      ]
      PortMappings = [
        {
          ContainerPort = 4001
          HostPort = 4001
          Protocol = "tcp"
        },
        {
          ContainerPort = 5001
          HostPort = 5001
          Protocol = "tcp"
        },
        {
          ContainerPort = 8080
          HostPort = 8080
          Protocol = "tcp"
        }
      ]
      MountPoints = [
        {
          ContainerPath = "/data/ipfs"
          SourceVolume = "ipfs"
        }
      ]
      LogConfiguration = {
        LogDriver = "awslogs"
        Options = {
          awslogs-group = join("", ["/ecs/", local.stack_name, "-ipfs-node-", var.availability_zone2])
          awslogs-region = data.aws_region.current.name
          awslogs-stream-prefix = "ipfs"
        }
      }
      HealthCheck = {
        Command = [
          "CMD-SHELL",
          "/usr/local/bin/ipfs dag stat /ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn || exit 1"
        ]
      }
    },
    {
      Name = "ipfs-cluster"
      Image = var.docker_image_ipfs_cluster
      DependsOn = [
        {
          Condition = "HEALTHY"
          ContainerName = "ipfs"
        }
      ]
      Secrets = [
        {
          Name = "CLUSTER_SECRET"
          ValueFrom = aws_ssm_parameter.ssmpclustersecret.arn
        },
        {
          Name = "CLUSTER_RESTAPI_BASICAUTHCREDENTIALS"
          ValueFrom = aws_ssm_parameter.ssmpclusterbasicauth.arn
        }
      ]
      Environment = [
        {
          Name = "CLUSTER_CRDT_TRUSTEDPEERS"
          Value = var.cluster_crdt_trusted_peers
        },
        {
          Name = "CLUSTER_MONITORPINGINTERVAL"
          Value = var.cluster_monitoring_interval
        },
        {
          Name = "CLUSTER_PEERNAME"
          Value = join("-", [local.stack_name, "node2"])
        },
        {
          Name = "CLUSTER_IPFSHTTP_NODEMULTIADDRESS"
          Value = var.cluster_ipfshttp_node_muti_address
        },
        {
          Name = "CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS"
          Value = var.cluster_restapihttp_listen_multi_address
        }
      ]
      PortMappings = [
        {
          ContainerPort = 9094
          HostPort = 9094
          Protocol = "tcp"
        },
        {
          ContainerPort = 9096
          HostPort = 9096
          Protocol = "tcp"
        }
      ]
      MountPoints = [
        {
          ContainerPath = "/data/ipfs-cluster"
          SourceVolume = "ipfs"
        }
      ]
      Command = [
        "daemon",
        "--bootstrap",
        join("", ["/dns/", join("-", [local.stack_name, "ipfs-node", var.availability_zone1]), ".", local.stack_name, "/tcp/9096/p2p/", var.cluster_id])
      ]
      LogConfiguration = {
        LogDriver = "awslogs"
        Options = {
          awslogs-group = join("", ["/ecs/", local.stack_name, "-ipfs-node-", var.availability_zone2])
          awslogs-region = data.aws_region.current.name
          awslogs-stream-prefix = "ipfs-cluster"
        }
      }
      HealthCheck = {
        Command = [
          "CMD-SHELL",
          join(" ", ["/usr/local/bin/ipfs-cluster-ctl", "--force-http", "--basic-auth", aws_ssm_parameter.ssmpclusterbasicauth.arn, "|| exit 1"])
        ]
      }
    }
  ]
}

resource "aws_ecs_task_definition" "ecstd3" {
  family = join("-", [local.stack_name, "ipfs-node", var.availability_zone3])
  cpu = 1024
  memory = 2048
  network_mode = "awsvpc"
  requires_compatibilities = [
    "FARGATE"
  ]
  execution_role_arn = aws_iam_role.iamrexec.arn
  task_role_arn = aws_iam_role.iamrtask.arn
  runtime_platform = {
    CpuArchitecture = "X86_64"
    OperatingSystemFamily = "LINUX"
  }
  volume = [
    {
      name = "ipfs"
      efs_volume_configuration = {
        AuthorizationConfig = {
          IAM = "DISABLED"
          AccessPointId = aws_efs_access_point.efsap3.arn
        }
        FilesystemId = aws_efs_file_system.efsfs3.arn
        TransitEncryption = "ENABLED"
      }
    }
  ]
  container_definitions = [
    {
      Name = "ipfs"
      Image = var.docker_image_ipfs
      Secrets = [
        local.HasAWSKey ? {
  Name = "CLUSTER_AWS_KEY"
  ValueFrom = var.cluster_aws_key
} : null,
        local.HasAWSSecret ? {
  Name = "CLUSTER_AWS_SECRET"
  ValueFrom = var.cluster_aws_secret
} : null
      ]
      Environment = [
        {
          Name = "CLUSTER_S3_BUCKET"
          Value = var.cluster_s3_bucket
        },
        {
          Name = "CLUSTER_PEERNAME"
          Value = join("-", [local.stack_name, "node3"])
        },
        {
          Name = "AWS_REGION"
          Value = data.aws_region.current.name
        }
      ]
      PortMappings = [
        {
          ContainerPort = 4001
          HostPort = 4001
          Protocol = "tcp"
        },
        {
          ContainerPort = 5001
          HostPort = 5001
          Protocol = "tcp"
        },
        {
          ContainerPort = 8080
          HostPort = 8080
          Protocol = "tcp"
        }
      ]
      MountPoints = [
        {
          ContainerPath = "/data/ipfs"
          SourceVolume = "ipfs"
        }
      ]
      LogConfiguration = {
        LogDriver = "awslogs"
        Options = {
          awslogs-group = join("", ["/ecs/", local.stack_name, "-ipfs-node-", var.availability_zone3])
          awslogs-region = data.aws_region.current.name
          awslogs-stream-prefix = "ipfs"
        }
      }
      HealthCheck = {
        Command = [
          "CMD-SHELL",
          "/usr/local/bin/ipfs dag stat /ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn || exit 1"
        ]
      }
    },
    {
      Name = "ipfs-cluster"
      Image = var.docker_image_ipfs_cluster
      DependsOn = [
        {
          Condition = "HEALTHY"
          ContainerName = "ipfs"
        }
      ]
      Secrets = [
        {
          Name = "CLUSTER_SECRET"
          ValueFrom = aws_ssm_parameter.ssmpclustersecret.arn
        },
        {
          Name = "CLUSTER_RESTAPI_BASICAUTHCREDENTIALS"
          ValueFrom = aws_ssm_parameter.ssmpclusterbasicauth.arn
        }
      ]
      Environment = [
        {
          Name = "CLUSTER_CRDT_TRUSTEDPEERS"
          Value = var.cluster_crdt_trusted_peers
        },
        {
          Name = "CLUSTER_MONITORPINGINTERVAL"
          Value = var.cluster_monitoring_interval
        },
        {
          Name = "CLUSTER_PEERNAME"
          Value = join("-", [local.stack_name, "node3"])
        },
        {
          Name = "CLUSTER_IPFSHTTP_NODEMULTIADDRESS"
          Value = var.cluster_ipfshttp_node_muti_address
        },
        {
          Name = "CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS"
          Value = var.cluster_restapihttp_listen_multi_address
        }
      ]
      PortMappings = [
        {
          ContainerPort = 9094
          HostPort = 9094
          Protocol = "tcp"
        },
        {
          ContainerPort = 9096
          HostPort = 9096
          Protocol = "tcp"
        }
      ]
      MountPoints = [
        {
          ContainerPath = "/data/ipfs-cluster"
          SourceVolume = "ipfs"
        }
      ]
      Command = [
        "daemon",
        "--bootstrap",
        join("", ["/dns/", join("-", [local.stack_name, "ipfs-node", var.availability_zone1]), ".", local.stack_name, "/tcp/9096/p2p/", var.cluster_id])
      ]
      LogConfiguration = {
        LogDriver = "awslogs"
        Options = {
          awslogs-group = join("", ["/ecs/", local.stack_name, "-ipfs-node-", var.availability_zone3])
          awslogs-region = data.aws_region.current.name
          awslogs-stream-prefix = "ipfs-cluster"
        }
      }
      HealthCheck = {
        Command = [
          "CMD-SHELL",
          join(" ", ["/usr/local/bin/ipfs-cluster-ctl", "--force-http", "--basic-auth", aws_ssm_parameter.ssmpclusterbasicauth.arn, "|| exit 1"])
        ]
      }
    }
  ]
}

resource "aws_ecs_service" "ecss1" {
  name = join("-", [local.stack_name, "ipfs-node", var.availability_zone1])
  cluster = aws_ecs_cluster.ecscipfs.arn
  task_definition = aws_ecs_task_definition.ecstd1.arn
  desired_count = 1
  enable_execute_command = True
  health_check_grace_period_seconds = 10
  capacity_provider_strategy = [
    {
      Base = 1
      CapacityProvider = "FARGATE"
      Weight = 1
    },
    {
      Base = 0
      CapacityProvider = "FARGATE_SPOT"
      Weight = 0
    }
  ]
  load_balancer = [
    {
      ContainerName = "ipfs"
      ContainerPort = 8080
      TargetGroupArn = aws_inspector_resource_group.elbv2_tgipfspeersweb.arn
    },
    {
      ContainerName = "ipfs-cluster"
      ContainerPort = 9094
      TargetGroupArn = aws_inspector_resource_group.elbv2_tgipfspeersapi.arn
    }
  ]
  network_configuration {
    // CF Property(AwsvpcConfiguration) = {
    //   AssignPublicIp = "ENABLED"
    //   SecurityGroups = [
    //     aws_security_group.ec2_sgecs.arn
    //   ]
    //   Subnets = [
    //     var.public_subnet1
    //   ]
    // }
  }
  // CF Property(DeploymentConfiguration) = {
  //   MaximumPercent = 100
  //   MinimumHealthyPercent = 0
  // }
  service_registries = [
    {
      RegistryArn = aws_service_discovery_service.sds1.arn
    }
  ]
}

resource "aws_service_discovery_private_dns_namespace" "sdpdn" {
  description = "Private Discovery service for IPFS Nodes"
  name = local.stack_name
  // CF Property(Properties) = {
  //   DnsProperties = {
  //     SOA = {
  //       TTL = 15
  //     }
  //   }
  // }
  vpc = var.vpc_id
}

resource "aws_ecs_service" "ecss2" {
  name = join("-", [local.stack_name, "ipfs-node", var.availability_zone2])
  cluster = aws_ecs_cluster.ecscipfs.arn
  task_definition = aws_ecs_task_definition.ecstd2.arn
  desired_count = 1
  enable_execute_command = True
  health_check_grace_period_seconds = 10
  capacity_provider_strategy = [
    {
      Base = 1
      CapacityProvider = "FARGATE"
      Weight = 1
    },
    {
      Base = 0
      CapacityProvider = "FARGATE_SPOT"
      Weight = 0
    }
  ]
  load_balancer = [
    {
      ContainerName = "ipfs"
      ContainerPort = 8080
      TargetGroupArn = aws_inspector_resource_group.elbv2_tgipfspeersweb.arn
    },
    {
      ContainerName = "ipfs-cluster"
      ContainerPort = 9094
      TargetGroupArn = aws_inspector_resource_group.elbv2_tgipfspeersapi.arn
    }
  ]
  network_configuration {
    // CF Property(AwsvpcConfiguration) = {
    //   AssignPublicIp = "ENABLED"
    //   SecurityGroups = [
    //     aws_security_group.ec2_sgecs.arn
    //   ]
    //   Subnets = [
    //     var.public_subnet2
    //   ]
    // }
  }
  // CF Property(DeploymentConfiguration) = {
  //   MaximumPercent = 100
  //   MinimumHealthyPercent = 0
  // }
  service_registries = [
    {
      RegistryArn = aws_service_discovery_service.sds2.arn
    }
  ]
}

resource "aws_service_discovery_service" "sds1" {
  description = "IPFS Service discovery"
  name = join("-", [local.stack_name, "ipfs-node", var.availability_zone1])
  dns_config = {
    DnsRecords = [
      {
        TTL = 60
        Type = "A"
      }
    ]
    NamespaceId = aws_service_discovery_private_dns_namespace.sdpdn.id
  }
}

resource "aws_ecs_service" "ecss3" {
  name = join("-", [local.stack_name, "ipfs-node", var.availability_zone3])
  cluster = aws_ecs_cluster.ecscipfs.arn
  task_definition = aws_ecs_task_definition.ecstd3.arn
  desired_count = 1
  enable_execute_command = True
  health_check_grace_period_seconds = 10
  capacity_provider_strategy = [
    {
      Base = 1
      CapacityProvider = "FARGATE"
      Weight = 1
    },
    {
      Base = 0
      CapacityProvider = "FARGATE_SPOT"
      Weight = 0
    }
  ]
  load_balancer = [
    {
      ContainerName = "ipfs"
      ContainerPort = 8080
      TargetGroupArn = aws_inspector_resource_group.elbv2_tgipfspeersweb.arn
    },
    {
      ContainerName = "ipfs-cluster"
      ContainerPort = 9094
      TargetGroupArn = aws_inspector_resource_group.elbv2_tgipfspeersapi.arn
    }
  ]
  network_configuration {
    // CF Property(AwsvpcConfiguration) = {
    //   AssignPublicIp = "ENABLED"
    //   SecurityGroups = [
    //     aws_security_group.ec2_sgecs.arn
    //   ]
    //   Subnets = [
    //     var.public_subnet3
    //   ]
    // }
  }
  // CF Property(DeploymentConfiguration) = {
  //   MaximumPercent = 100
  //   MinimumHealthyPercent = 0
  // }
  service_registries = [
    {
      RegistryArn = aws_service_discovery_service.sds3.arn
    }
  ]
}

resource "aws_service_discovery_service" "sds3" {
  description = "IPFS Service discovery"
  name = join("-", [local.stack_name, "ipfs-node", var.availability_zone3])
  dns_config = {
    DnsRecords = [
      {
        TTL = 60
        Type = "A"
      }
    ]
    NamespaceId = aws_service_discovery_private_dns_namespace.sdpdn.id
  }
}

resource "aws_service_discovery_service" "sds2" {
  description = "IPFS Service discovery"
  name = join("-", [local.stack_name, "ipfs-node", var.availability_zone2])
  dns_config = {
    DnsRecords = [
      {
        TTL = 60
        Type = "A"
      }
    ]
    NamespaceId = aws_service_discovery_private_dns_namespace.sdpdn.id
  }
}

resource "aws_iam_role" "iamrtask" {
  name = join("-", [local.stack_name, "EcsRunTaskRole"])
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  ]
  assume_role_policy = "{
    "Version": "2008-10-17",
    "Statement": [
        {
            "Sid": "",
            "Effect": "Allow",
            "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
"
  force_detach_policies = [
    {
      PolicyName = join("-", [local.stack_name, "SSMECSExecAccess"])
      PolicyDocument = {
        Version = "2012-10-17"
        Statement = [
          {
            Effect = "Allow"
            Action = [
              "ssmmessages:CreateControlChannel",
              "ssmmessages:CreateDataChannel",
              "ssmmessages:OpenControlChannel",
              "ssmmessages:OpenDataChannel"
            ]
            Resource = "*"
          }
        ]
      }
    }
  ]
}

resource "aws_iam_role" "iamrexec" {
  name = join("-", [local.stack_name, "EcsTaskExecutionRole"])
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  ]
  assume_role_policy = "{
    "Version": "2008-10-17",
    "Statement": [
        {
            "Sid": "",
            "Effect": "Allow",
            "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
"
  force_detach_policies = [
    {
      PolicyName = join("-", [local.stack_name, "SSMAccessForIPFS"])
      PolicyDocument = {
        Version = "2012-10-17"
        Statement = [
          {
            Effect = "Allow"
            Action = [
              "ssm:GetParameters",
              "secretsmanager:GetSecretValue"
            ]
            Resource = [
              "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${local.stack_name}-CLUSTER_ID",
              "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${local.stack_name}-CLUSTER_PRIVATE_KEY",
              "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${local.stack_name}-CLUSTER_SECRET",
              "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${local.stack_name}-CLUSTER_RESTAPI_BASICAUTHCREDENTIALS",
              "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${var.cluster_aws_key}",
              "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${var.cluster_aws_secret}"
            ]
          }
        ]
      }
    }
  ]
}

resource "aws_inspector_resource_group" "llg1" {
  // CF Property(LogGroupName) = join("", ["/ecs/", local.stack_name, "-ipfs-node-", var.availability_zone1])
  // CF Property(RetentionInDays) = 30
}

resource "aws_inspector_resource_group" "llg2" {
  // CF Property(LogGroupName) = join("", ["/ecs/", local.stack_name, "-ipfs-node-", var.availability_zone2])
  // CF Property(RetentionInDays) = 30
}

resource "aws_inspector_resource_group" "llg3" {
  // CF Property(LogGroupName) = join("", ["/ecs/", local.stack_name, "-ipfs-node-", var.availability_zone3])
  // CF Property(RetentionInDays) = 30
}

resource "aws_wafv2_rule_group" "elbv2_listenerweb" {
  // CF Property(Port) = 80
  // CF Property(Protocol) = "HTTP"
  // CF Property(LoadBalancerArn) = aws_wafv2_regex_pattern_set.elbv2_alb.id
  // CF Property(DefaultActions) = [
  //   {
  //     TargetGroupArn = aws_inspector_resource_group.elbv2_tgipfspeersweb.arn
  //     Type = "forward"
  //   }
  // ]
}

resource "aws_inspector_resource_group" "elbv2_tgipfspeersweb" {
  // CF Property(VpcId) = var.vpc_id
  // CF Property(Name) = join("-", [local.stack_name, "nodes-web"])
  // CF Property(TargetType) = "ip"
  // CF Property(Protocol) = "HTTP"
  // CF Property(Port) = 8080
  // CF Property(HealthCheckEnabled) = True
  // CF Property(HealthCheckPath) = "/ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn"
  // CF Property(Matcher) = {
  //   HttpCode = "200,301,302,303,304,307,308"
  // }
}

resource "aws_wafv2_rule_group" "elbv2_listenerapi" {
  // CF Property(Port) = 9094
  // CF Property(Protocol) = "HTTP"
  // CF Property(LoadBalancerArn) = aws_wafv2_regex_pattern_set.elbv2_alb.id
  // CF Property(DefaultActions) = [
  //   {
  //     TargetGroupArn = aws_inspector_resource_group.elbv2_tgipfspeersapi.arn
  //     Type = "forward"
  //   }
  // ]
}

resource "aws_inspector_resource_group" "elbv2_tgipfspeersapi" {
  // CF Property(VpcId) = var.vpc_id
  // CF Property(Name) = join("-", [local.stack_name, "nodes-api"])
  // CF Property(TargetType) = "ip"
  // CF Property(Protocol) = "HTTP"
  // CF Property(Port) = 9094
  // CF Property(HealthCheckEnabled) = True
  // CF Property(HealthCheckPath) = "/id"
  // CF Property(Matcher) = {
  //   HttpCode = "401"
  // }
}

resource "aws_cloudfront_distribution" "cfdapi" {
  // CF Property(DistributionConfig) = {
  //   Enabled = True
  //   Origins = [
  //     {
  //       DomainName = aws_wafv2_regex_pattern_set.elbv2_alb.name
  //       Id = "ipfs"
  //       CustomOriginConfig = {
  //         HTTPPort = 9094
  //         OriginProtocolPolicy = "http-only"
  //       }
  //     }
  //   ]
  //   Comment = join(" - ", [local.stack_name, "CDN Distribution for IPFS Cluster REST API"])
  //   DefaultCacheBehavior = {
  //     TargetOriginId = "ipfs"
  //     Compress = True
  //     ViewerProtocolPolicy = "redirect-to-https"
  //     CachePolicyId = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
  //     OriginRequestPolicyId = "216adef6-5c7f-47e4-b989-5492eafa07d3"
  //     AllowedMethods = [
  //       "GET",
  //       "HEAD",
  //       "OPTIONS",
  //       "PUT",
  //       "PATCH",
  //       "POST",
  //       "DELETE"
  //     ]
  //   }
  // }
}

resource "aws_cloudfront_distribution" "cfdweb" {
  // CF Property(DistributionConfig) = {
  //   Enabled = True
  //   Origins = [
  //     {
  //       DomainName = aws_wafv2_regex_pattern_set.elbv2_alb.name
  //       Id = "ipfs"
  //       CustomOriginConfig = {
  //         HTTPPort = 80
  //         OriginProtocolPolicy = "http-only"
  //       }
  //     }
  //   ]
  //   Comment = join(" - ", [local.stack_name, "CDN Distribution for IPFS Gateway"])
  //   DefaultCacheBehavior = {
  //     TargetOriginId = "ipfs"
  //     Compress = True
  //     ViewerProtocolPolicy = "redirect-to-https"
  //     CachePolicyId = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  //   }
  // }
}

resource "aws_security_group" "ec2_sgalb" {
  vpc_id = var.vpc_id
  description = "ALB Inbound/Outbound rules for IPFS Cluster REST API and Inbound/Outbound rules for IPFS Gateways"
  name = join("-", [local.stack_name, "ipfs"])
  egress = [
    {
      cidr_blocks = var.cidr_block
      from_port = 9094
      to_port = 9094
      protocol = "TCP"
      description = "Allow connection out to the IPFS Cluster REST API on port 9094 anywhere in internal network"
    },
    {
      cidr_blocks = var.cidr_block
      from_port = 8080
      to_port = 8080
      protocol = "TCP"
      description = "Allow connection out to the IPFS Gateway on port 8080 anywhere in internal network"
    }
  ]
  ingress = [
    {
      prefix_list_ids = var.cloudfront_prefix_list_id
      from_port = 9094
      to_port = 9094
      protocol = "TCP"
      description = "Allow incoming traffic on port 9094 only from the CloudFront"
    },
    {
      prefix_list_ids = var.cloudfront_prefix_list_id
      from_port = 80
      to_port = 80
      protocol = "TCP"
      description = "Allow incoming traffic on HTTP port 80 only from a list of Cloudfront subnets managed by Prefix Lists (See VPC Console - Managed prefix lists)"
    }
  ]
}

resource "aws_wafv2_regex_pattern_set" "elbv2_alb" {
  // CF Property(IpAddressType) = "ipv4"
  name = join("-", [local.stack_name, "ipfs-alb"])
  // CF Property(Type) = "application"
  // CF Property(Scheme) = "internet-facing"
  // CF Property(Subnets) = [
  //   var.public_subnet1,
  //   var.public_subnet2,
  //   var.public_subnet3
  // ]
  // CF Property(SecurityGroups) = [
  //   aws_security_group.ec2_sgalb.arn
  // ]
}

resource "aws_ssm_parameter" "ssmpclusterid" {
  name = join("-", [local.stack_name, "CLUSTER_ID"])
  type = "String"
  value = var.cluster_id
  description = "CLUSTER_ID of our ipfs cluster"
  allowed_pattern = "^.{52}$"
}

resource "aws_ssm_parameter" "ssmpclusterprivatekey" {
  name = join("-", [local.stack_name, "CLUSTER_PRIVATE_KEY"])
  type = "String"
  value = var.cluster_private_key
  description = "CLUSTER_PRIVATE_KEY of our ipfs cluster"
  allowed_pattern = "^.{92}$"
}

resource "aws_ssm_parameter" "ssmpclustersecret" {
  name = join("-", [local.stack_name, "CLUSTER_SECRET"])
  type = "String"
  value = var.cluster_secret
  description = "CLUSTER_SECRET of our ipfs cluster"
  allowed_pattern = "^.{64}$"
}

resource "aws_ssm_parameter" "ssmpclusterbasicauth" {
  name = join("-", [local.stack_name, "CLUSTER_RESTAPI_BASICAUTHCREDENTIALS"])
  type = "String"
  value = var.cluster_restapi_basic_auth_credentials
  description = "CLUSTER REST API BasicAuth Credentials to authenticate when access IPFS Cluster"
  allowed_pattern = "^.+:.+$"
}

