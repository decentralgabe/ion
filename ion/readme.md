# ION with Config

ION instance with our config baked into the Docker image.

0. Authenticate into the ECR registry

`aws ecr get-login-pecr get-login-password --region usr ast-1 | docker login --username AWS --password-stdin 844731274526.dkr.ecr.us-west-2.amazonaws.com`

## ION Bitcoin

1. Build the image

`docker buildx build --platform linux/amd64 -f ./Dockerfile -t dev-ion-bitcoin . --load`

2. Tag the image

`docker tag dev-ion-bitcoin:latest 844731274526.dkr.ecr.us-west-2.amazonaws.com/dev-ion-bitcoin:latest`

3. Push the image

`docker push 844731274526.dkr.ecr.us-west-2.amazonaws.com/dev-ion-bitcoin:latest`

## ION Core

1. Build the image

`docker buildx build --platform linux/amd64 -f ./Dockerfile -t dev-ion-core . --load`

2. Tag the image

`docker tag dev-ion-core:latest 844731274526.dkr.ecr.us-west-2.amazonaws.com/dev-ion-core:latest`

3. Push the image

`docker push 844731274526.dkr.ecr.us-west-2.amazonaws.com/dev-ion-core:latest`