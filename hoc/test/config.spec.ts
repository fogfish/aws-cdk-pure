import { expect } from 'chai'
import { join, root, iaac, IaaC } from 'aws-cdk-pure'
import * as cdk from '@aws-cdk/core'
import * as config from '../src/config'

const cf = iaac(cdk.CfnResource)

function ResourceA(): IaaC<cdk.CfnResource> {
  return config.String('key', 'bucket').flatMap(ResourceB)
}

function ResourceB(type: string): IaaC<cdk.CfnResource> {
  const ResourceB = (): cdk.CfnResourceProps => ({ type })
  return cf(ResourceB)
}

function Stack(stack: cdk.Construct): cdk.Construct {
  join(stack, ResourceA)
  return stack
}

it('fetch config from secret manager',
  () => {
    const app = new cdk.App()
    root(app, Stack, 'IaaC')
    const response = app.synth()
    const stack = response.getStack('IaaC')
    expect(stack.template).deep.equal(
      {
        Resources: {
          ResourceB: {
            Type: '{{resolve:secretsmanager:bucket:SecretString:key::}}'
          }
        }
      }
    )
  }
)