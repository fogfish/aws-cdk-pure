import { expect } from 'chai'
import * as pure from '../src/index'
import * as cdk from '@aws-cdk/core'

function Stack(scope: cdk.Construct): cdk.Construct {
  return new cdk.CfnResource(scope, 'IaaC', { type: 'MyResourceType' });
}

it('create a stack to application',
  () => {
    const app = new cdk.App()
    pure.root(app, Stack)
    const response = app.synth()
    const stack = response.getStack('Stack')
    expect(stack.template).deep.equal(
      { Resources: { IaaC: { Type: 'MyResourceType' } } }
    )
  }
)
