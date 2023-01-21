locals {
  namespace                 = "${var.env}-ipfs"
  ipfs_container_image_name = "${local.namespace}-image"
  ipfs_task_log_group       = "/ecs/${local.namespace}-task"
  user_data                 = <<-EOT
    #!/bin/bash
    cat <<'EOF' >> /etc/ecs/ecs.config
    ECS_CLUSTER=${local.namespace}-ecs
    ECS_LOGLEVEL=debug
    EOF
  EOT
}
