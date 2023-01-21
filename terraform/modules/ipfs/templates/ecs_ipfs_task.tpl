[
    {
        "name": "${ipfs_container_image_name}",
        "image": "${ipfs_container_image}",
        "cpu": ${ipfs_task_cpu_count},
        "memory": ${ipfs_task_memory},
        "memoryReservation": 512,
        "runtimePlatform": {
            "cpuArchitecture": "X86_64",
            "operatingSystemFamily": "LINUX"
        },
        "linuxParameters": {
            "initProcessEnabled": true
        },
        "ulimits": [
            {
                "name": "nofile",
                "hardLimit": 1000000,
                "softLimit": 1000000
            }
        ],
        "portMappings":
        [
            {
                "containerPort": 4001,
                "hostPort": 4001,
                "protocol": "tcp",
                "appProtocol": "http"
            },
            {
                "containerPort": 4001,
                "hostPort": 4001,
                "protocol": "udp",
                "appProtocol": "http"
            },
            {
                "containerPort": 5001,
                "hostPort": 5001,
                "protocol": "tcp",
                "appProtocol": "http"
            },
            {
                "containerPort": 8080,
                "hostPort": 8080,
                "protocol": "tcp",
                "appProtocol": "http"
            }
        ],
        "essential": true,
        "entryPoint": [],
        "environment": [
            {
                "name": "IPFS_PATH",
                "value": "/data/ipfs"
            },
            {
                "name": "GOLOG_LOG_LEVEL",
                "value": "info"
            },
            {
                "name": "GOLOG_LOG_FMT",
                "value": "json"
            }
        ],
        "mountPoints":
        [
            {
                "sourceVolume": "efs",
                "containerPath": "/data/ipfs"
            }
        ],
        "volumesFrom": [],
        "readonlyRootFilesystem": false,
        "dnsServers": [],
        "logConfiguration":
        {
            "logDriver": "awslogs",
            "options": {
                "awslogs-group": "${ipfs_task_log_group}",
                "awslogs-region": "${aws_region}",
                "awslogs-stream-prefix": "ecs"
            }
        }
    }
]