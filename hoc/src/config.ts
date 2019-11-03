//
// Copyright (C) 2019 Dmitry Kolesnikov
//
// This file may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.
// https://github.com/fogfish/aws-cdk-pure
//
// Config/Secret Management HoC
//
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
