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
export AWS_ACCESS_KEY_ID="your access key"
export AWS_SECRET_ACCESS_KEY="your secret key"
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
 --file-system-id fs-******** --subnet-id SUBNET
```

Get the security group associated with each mount target

```sh
EFS_SG=$(aws efs describe-mount-targets --file-system-id fs-******** \
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