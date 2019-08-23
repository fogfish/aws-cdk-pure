import { expect } from 'chai'
import { root, join } from '../src/index'
import * as cdk from '@aws-cdk/core'

function ResourceA(node: cdk.Construct): cdk.Construct {
  return new cdk.CfnResource(node, 'ResourceA', { type: 'TypeA' })
}

function ResourceB(node: cdk.Construct): cdk.Construct {
  return new cdk.CfnResource(node, 'ResourceB', { type: 'TypeB' })
}

function Stack(scope: cdk.Construct): cdk.Construct {
  join(scope, ResourceA)
  join(scope, ResourceB)
  return scope
}

it('attach components to stack',
  () => {
    const app = new cdk.App()
    root(app, Stack, 'IaaC')
    const response = app.synth()
    const stack = response.getStack('IaaC')
    expect(stack.template).deep.equal(
      {
        Resources: { 
          ResourceA: { Type: 'TypeA' },
          ResourceB: { Type: 'TypeB' },
        }
      }
    )
  }
)
