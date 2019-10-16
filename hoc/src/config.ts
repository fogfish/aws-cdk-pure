/**
 * Pure Functional HoC: Config/Secret Management
 */
import { IaaC, Pure, include } from 'aws-cdk-pure'
import * as secret from '@aws-cdk/aws-secretsmanager'

const vault = include(secret.Secret.fromSecretAttributes)

export function String(key: Array<string>): Pure<string> {
  return vault(Secret(key[0])).map(x => x.secretValueFromJson(key[1]).toString())
}

function Secret(secretArn: string): IaaC<secret.SecretAttributes> {
  const Secret = () => ({ secretArn })
  return Secret
}
