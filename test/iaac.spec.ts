import { expect } from 'chai'
import { root, join, iaac } from '../src/index'
import * as cdk from '@aws-cdk/core'

const cf = iaac(cdk.CfnResource)

function ResourceA(): cdk.CfnResourceProps {
  return { type: 'TypeA' }
}

function ResourceB(): cdk.CfnResourceProps {
  return { type: 'TypeB' }
}

function Stack(scope: cdk.Construct): cdk.Construct {
  join(scope, cf(ResourceA))
  join(scope, cf(ResourceB))
  return scope
}

it('attach components to stack using type safe factory',
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
