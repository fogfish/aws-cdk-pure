/**
 * Pure Functional HoC: Config/Secret Management
 */
import * as secret from '@aws-cdk/aws-secretsmanager'
import { IaaC, include, IPure } from 'aws-cdk-pure'

const defaultBucket = process.env.AWS_IAAC_CONFIG || 'undefined'
const vault = include(secret.Secret.fromSecretAttributes)

export function String(key: string, bucket: string = defaultBucket): IPure<string> {
  return vault(Config(bucket)).map(x => x.secretValueFromJson(key).toString())
}

function Config(secretArn: string): IaaC<secret.SecretAttributes> {
  const Secret = () => ({ secretArn })
  return Secret
}
