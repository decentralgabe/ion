[
    {
        "name": "${bitcoin_container_image_name}",
        "image": "${bitcoin_container_image}",
        "cpu": 4,
        "memory": 4096,
        "memoryReservation": 500,
        "portMappings":
        [
            {
                "containerPort": 8332,
                "hostPort": 8332,
                "protocol": "tcp"
            },
            {
                "containerPort": 8333,
                "hostPort": 8333,
                "protocol": "tcp"
            }
        ],
        "essential": true,
        "entryPoint": [],
        "command":
        [
            "-printtoconsole",
            "-txindex",
            "-server",
            "-rpcuser=user",
            "-rpcpassword=password",
            "-rpcallowip=0.0.0.0/0",
            "-rpcbind=0.0.0.0"
        ],
        "environment":
        [
            {
                "name": "BITCOIN_DATA",
                "value": "/data/bitcoin"
            }
        ],
        "mountPoints":
        [
            {
                "sourceVolume": "efs",
                "containerPath": "/data/bitcoin"
            }
        ],
        "volumesFrom": [],
        "readonlyRootFilesystem": false,
        "dnsServers": [],
        "logConfiguration":
        {
            "logDriver": "awslogs",
            "options":
            {
                "awslogs-group": "${bitcoin_task_log_group}",
                "awslogs-region": "${aws_region}",
                "awslogs-stream-prefix": "ecs"
            }
        }
    }
]