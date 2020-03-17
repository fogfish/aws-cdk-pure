//
// Copyright (C) 2019 Dmitry Kolesnikov
//
// This file may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.
// https://github.com/fogfish/aws-cdk-pure
//
import * as pure from '../src/index'
import * as cdk from '@aws-cdk/core'

function MyA(node: cdk.Construct): cdk.Construct {
  return new cdk.CfnResource(node, 'MyA', { type: 'A' })
}

function MyB(node: cdk.Construct): cdk.Construct {
  return new cdk.CfnResource(node, 'MyB', { type: 'B' })
}

function Stack(scope: cdk.Construct): cdk.Construct {
  pure.join(scope, MyA)
  pure.join(scope, MyB)
  return scope
}

it('attach components to stack',
  () => {
    const app = new cdk.App()
    pure.root(app, Stack, 'IaaC')
    const response = app.synth()
    const stack = response.getStack('IaaC')
    expect(stack.template).toEqual(
      {
        Resources: { 
          MyA: { Type: 'A' },
          MyB: { Type: 'B' },
        }
      }
    )
  }
)
