output "alb_dns_name" {
  value       = module.ecs_lb.lb_dns_name
  description = "public dns name for the ipfs cluster"
}
