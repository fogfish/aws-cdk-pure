import { expect } from 'chai'
import * as pure from 'aws-cdk-pure'
import * as cdk from '@aws-cdk/core'
import * as config from '../src/config'

function Config(): pure.IaaC<cdk.CfnResource> {
  return config.String('key', 'bucket').flatMap(Component)
}

function Component(type: string): pure.IaaC<cdk.CfnResource> {
  const cf = pure.iaac(cdk.CfnResource)
  const MyA = (): cdk.CfnResourceProps => ({ type })
  return cf(MyA)
}

it('fetch config from secret manager',
  () => {
    const app = new cdk.App()
    const Stack = (): cdk.StackProps => ({ env: {} })
    pure.join(app,
      pure.iaac(cdk.Stack)(Stack).effect(x => pure.join(x, Config))
    )
    const stack = app.synth().getStack('Stack')
    expect(stack.template).deep.equal(
      {
        Resources: {
          MyA: {
            Type: '{{resolve:secretsmanager:bucket:SecretString:key::}}'
          }
        }
      }
    )
  }
)