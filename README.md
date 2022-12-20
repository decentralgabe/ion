# ion-deployment

Deployment config for [ION](https://github.com/decentralized-identity/ion) on AWS. This project wraps [Sidetree](https://github.com/decentralized-identity/sidetree) with Bitcoin specific config.

Install guide [here](https://github.com/decentralized-identity/ion/blob/master/install-guide.md).

Two accounts. For now, this deployment is used for the `dev` account alone.

## AWS

We use Block's infrastructure. AWS accounts are under the [`tbd-ose` group here](https://square-console.sqprod.co/app/tbd-ose/aws/accounts).

Dev: `844731274526`
Staging: `481777022774`

# Deployment Instructions

## Prerequisites

Make sure you have both the [AWS CLI](https://aws.amazon.com/cli/), [ECS CLI](https://github.com/aws/amazon-ecs-cli#latest-version), and [jq](https://stedolan.github.io/jq/) installed.

## ECS Setup

To set up ECS we need to do a few things: create a keypair, set local environment variables, configure both the aws cli and ecs cli, set up an EFS instance, and then set up our ECS cluster.

1. Set local env vars

```sh
export KEY_PAIR=ion-cluster
export PROFILE_NAME=ion
export CLUSTER_NAME=ion-cluster
export REGION=us-west-2
export LAUNCH_TYPE=EC2
export AWS_ACCESS_KEY_ID="access key"
export AWS_SECRET_ACCESS_KEY="secret key"
```

2. Create keypair for the cluster

```sh
aws ec2 \
 --region="$REGION" \
 create-key-pair --key-name "$CLUSTER_NAME" \
 --query 'KeyMaterial' \
 --output text > ~/.ssh/ion-cluster.pem
```

3. Create an EFS that will be used by `ION_DATA_VOLUME`

```sh
aws efs create-file-system \
 --performance-mode generalPurpose \
 --throughput-mode bursting \
 --encrypted \
 --tags Key=Name,Value=ion-filesystem
```

Note the `FileSystemId` which will look like `fs-********`

4. Configure the ECS CLI

```sh
ecs-cli configure profile \
 --profile-name "$PROFILE_NAME" \
 --access-key "$AWS_ACCESS_KEY_ID" \
 --secret-key "$AWS_SECRET_ACCESS_KEY"
```

```sh
ecs-cli configure \
 --cluster "$CLUSTER_NAME" \
 --default-launch-type "$LAUNCH_TYPE" \
 --region "$REGION" \
 --config-name "$PROFILE_NAME"
```

5. Spin up the cluster

```sh
ecs-cli up \
 --region "$REGION" \
 --keypair $KEY_PAIR  \
 --capability-iam \
 --size 1 \
 --instance-type t3.medium \
 --tags project=ion \
 --cluster-config "$PROFILE_NAME" \
 --ecs-profile "$PROFILE_NAME"
```

This will take a few minutes. After you'll be able to run `ecs-cli ps` and view the running cluster.

6. Connect EFS to the ECS cluster

Add mount points to each VPC subnet

```sh
aws ec2 describe-subnets --filters Name=tag:project,Values=ion \
 | jq ".Subnets[].SubnetId" | \
xargs -ISUBNET  aws efs create-mount-target \
 --file-system-id fs-******* --subnet-id SUBNET
```

Get the security group associated with each mount target

```sh
EFS_SG=$(aws efs describe-mount-targets --file-system-id fs-****** \
    | jq ".MountTargets[0].MountTargetId" \
     | xargs -IMOUNTG aws efs describe-mount-target-security-groups \
     --mount-target-id MOUNTG | jq ".SecurityGroups[0]" | xargs echo )
```

Open TCP Port 2049 for the security group of the VPC

```sh
VPC_SG="$(aws ec2 describe-security-groups  \
 --filters Name=tag:project,Values=ion \
 | jq '.SecurityGroups[].GroupId' | xargs echo)"
```

Authorize TCP Port 2049 from the default security group of the VPC

```sh
aws ec2 authorize-security-group-ingress \
 --group-id $EFS_SG \
 --protocol tcp \
 --port 2049 \
 --source-group $VPC_SG \
 --region "$REGION"
```

Next you'll need to SSH into the EC2 instance and manually mount EFS. You can do it, once SSH'd in, with the following command

```sh
sudo mount -t efs fs-****** db_data
```

7. Connect
After this you should have
- A new public VPC
- An internet gateway
- Routing tables
- 2 public subnets in 2 availability zones
- 1 security group
- 1 autoscaling group
- 1 EC2 instances
- 1 ECS cluster
- 1 EFS

## ION Setup

1. Deploy the docker-compose file to the ECS cluster


Modify `ecs-params.yml` to add persistence:

```yml
version: 1
task_definition:
  efs_volumes:
    - name: db_data
      filesystem_id: fs-*********
      transit_encryption: ENABLED
```

Deploy the stack with compose, creating log groups and associating the file system.

```sh
ecs-cli compose \
 --project-name "$PROFILE_NAME" \
 --file docker-compose.yml \
 --debug service up  \
 --deployment-max-percent 100 \
 --deployment-min-healthy-percent 0 \
 --region "$REGION" \
 --ecs-profile "$PROFILE_NAME" \
 --cluster-config "$PROFILE_NAME" \
 --create-log-groups
```

2. Verify the service is running

```sh
ecs-cli ps
```

3. Teardown the service

```sh
ecs-cli compose \
 --project-name "$PROFILE_NAME" \
 --file docker-compose.yml \
 --debug service down  \
 --region "$REGION" \
 --ecs-profile "$PROFILE_NAME" \
 --cluster-config "$PROFILE_NAME"
```

## Connecting to the Cluster

Open port 22 to ssh into the cluster's EC2 instance(s).

```sh
# Get my IP
MY_IP="$(dig +short myip.opendns.com @resolver1.opendns.com)"

# Get the security group
SG="$(aws ec2 describe-security-groups --filters Name=tag:project,Values=ion | jq '.SecurityGroups[].GroupId')"

# Add port 22 to the Security Group of the VPC
aws ec2 authorize-security-group-ingress \
        --group-id $(echo $SG | tr -d '"') \
        --protocol tcp \
        --port 22 \
        --cidr "$MY_IP/32" | jq '.'
```

Connect to the EC2 instance. You can find the ip by doing `ecs-cli ps` and viewing the IP in the `Ports` column.

```sh
chmod 400 ~/.ssh/ion-cluster.pem
ssh -i ~/.ssh/ion-cluster.pem ec2-user@xxx.xxx.xxx.xxx
```

Observe the running containers
```sh
docker ps
```

Once you find a container you'll be able to view its logs using

```sh
docker logs <container-id>
```

More info [can be found here](https://docs.docker.com/engine/reference/commandline/logs/).

## Building a new image


1. Build a new image

```sh
docker buildx build --platform=linux/amd64 -t ion-js . --load
```

2. Tag the image

```sh
docker tag ion-js:latest <account-id>.dkr.ecr.us-west-2.amazonaws.com/ion-js:latest
```

3. Push the image to ECR

```sh
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/ion-js:latest
```

### Pulling from an EC2 image

Sometimes it's helpful to pull a new image while SSH'd into EC2. You can do so with the following command:

```sh
docker pull <account-id>.dkr.ecr.us-west-2.amazonaws.com/ion-js:latest
```

If you get an error you may need to authenticate ECR first, which can be done with the following command:

```sh
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com
```