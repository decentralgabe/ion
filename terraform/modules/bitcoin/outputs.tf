output "alb_dns_name" {
  value       = module.ecs_lb_bitcoin.lb_dns_name
  description = "public dns name for the bitcoin cluster"
}
