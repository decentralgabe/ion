locals {
  namespace                    = "${var.env}-bitcoin"
  bitcoin_container_image_name = "${local.namespace}-image"
  bitcoin_task_log_group       = "/ecs/${local.namespace}-task"
}
