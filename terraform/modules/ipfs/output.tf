output "cfdweb" {
  description = "DNS of the CloudFront distribution for IPFS Gateway. Use this DNS name to access IPFS files over HTTPS."
  value = aws_cloudfront_distribution.cfdweb.domain_name
}

output "cfdapi" {
  description = "DNS of the CloudFront distribution for IPFS Cluster REST API. Use this DNS name to access IPFS Cluster REST API over HTTPS."
  value = aws_cloudfront_distribution.cfdapi.domain_name
}

