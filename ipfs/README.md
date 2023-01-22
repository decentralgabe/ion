# IPFS with Config

IPFS instance with our config baked into the Docker image.

0. Authenticate into the ECR registry

`aws ecr get-login-pecr get-login-password --region usr ast-1 | docker login --username AWS --password-stdin 844731274526.dkr.ecr.us-east-1.amazonaws.com`

1. Build the image

`docker buildx build --platform linux/amd64 -f ./Dockerfile -t dev-ipfs-repo . --load`

2. Tag the image

`docker tag ipfs-with-config:latest 844731274526.dkr.ecr.us-east-1.amazonaws.com/dev-ipfs-repo:latest`

3. Push the image

`docker push 844731274526.dkr.ecr.us-east-1.amazonaws.com/dev-ipfs-repo:latest`