/**
 * Pure Functional HoC: Config/Secret Management
 */
import * as secret from '@aws-cdk/aws-secretsmanager'
import { IaaC, include, IPure } from 'aws-cdk-pure'

const vault = include(secret.Secret.fromSecretAttributes)

export function String(key: string[]): IPure<string> {
  return vault(Config(key[0])).map(x => x.secretValueFromJson(key[1]).toString())
}

function Config(secretArn: string): IaaC<secret.SecretAttributes> {
  const Secret = () => ({ secretArn })
  return Secret
}
