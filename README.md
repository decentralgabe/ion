# ion-deployment

Deployment config for [ION](https://github.com/decentralized-identity/ion) on AWS. This project wraps [Sidetree](https://github.com/decentralized-identity/sidetree) with Bitcoin specific config.

Install guide [here](https://github.com/decentralized-identity/ion/blob/master/install-guide.md).

Two accounts. For now, this deployment is used for the `dev` account alone.

## Note on ION

ION is currently included in this repo and should be deleted after ION can accept config via environment variables, or another mechanism where config does not need to be baked into the image itself.

## AWS

We use Block's infrastructure. AWS accounts are under the [`tbd-ose` group here](https://square-console.sqprod.co/app/tbd-ose/aws/accounts).

Dev: `844731274526`
Staging: `481777022774`

# Deployment Instructions

## Prerequisites

Make sure you have both the [AWS CLI](https://aws.amazon.com/cli/) and [Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli) installed.

## Deploying

-1. Get an aws session using the aws cli

Here are some helpful aliases:

- `alias awho='aws sts get-caller-identity'`
- `apro () {
    export AWS_PROFILE=$1 AWS_SDK_LOAD_CONFIG=1
}`

With an `~/.aws/credentials` file with a number of profiles like...

```
[dev]
aws_access_key_id=<access-key-id>
aws_secret_access_key=<secret-access-key>

[staging]
aws_access_key_id=<access-key-id>
aws_secret_access_key=<secret-access-key>
```

You can then run `apro dev` to switch to the dev profile...and confirm with `awho`.

0. Alias `terraform` to `tf`

`alias tf=terraform`

1. Initialize your directory

`tf init`

2. Validate the tf config

`tf validate`

3. Show changes required by the current configuration

`tf plan -var-file="env/<env>.tfvars"`

4. Deploy

`tf apply -var-file="env/<env>.tfvars"`

5. Destroy

`tf destroy -var-file="env/<env>.tfvars"`