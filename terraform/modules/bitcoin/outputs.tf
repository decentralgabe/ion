output "alb_dns_name" {
  value       = aws_lb.ecs_cluster_lb.dns_name
  description = "public dns name for the bitcoin cluster"
}
