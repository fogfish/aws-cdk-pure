/**
 * Pure Functional HoC: Config/Secret Management
 */
import * as secret from '@aws-cdk/aws-secretsmanager'
import { IaaC, include, IPure } from 'aws-cdk-pure'

const defaultBucket = process.env.AWS_IAAC_CONFIG || 'undefined'
const vault = include(secret.Secret.fromSecretAttributes)

/**
 * returns a configuration as string value for given key as it is stored by AWS Secret Manager 
 *   
 * @param key name of the key
 * @param bucket AWS Secret Manager bucket, the value of AWS_IAAC_CONFIG env var is used as default bucket,
 */
export function String(key: string, bucket: string = defaultBucket): IPure<string> {
  return vault(Config(bucket)).map(x => x.secretValueFromJson(key).toString())
}

function Config(secretArn: string): IaaC<secret.SecretAttributes> {
  const Secret = () => ({ secretArn })
  return Secret
}
