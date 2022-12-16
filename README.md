# ion-deployment

Deployment config for [ION](https://github.com/decentralized-identity/ion) on AWS. This project wraps [Sidetree](https://github.com/decentralized-identity/sidetree) with Bitcoin specific config.

Install guide [here](https://github.com/decentralized-identity/ion/blob/master/install-guide.md).

Two accounts. For now, this deployment is used for the `dev` account alone.

## AWS

We use Block's infrastructure. AWS accounts are under the [`tbd-ose` group here](https://square-console.sqprod.co/app/tbd-ose/aws/accounts).

Dev: `844731274526`
Staging: `481777022774`

The [ECS-CLI](https://docs.aws.amazon.com/cli/latest/reference/ecs/index.html) is used to simplify deployment.

## Config