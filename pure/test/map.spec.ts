import { expect } from 'chai'
import * as pure from '../src/index'
import * as cdk from '@aws-cdk/core'

const cf = pure.iaac(cdk.CfnResource)

function MyA(): cdk.CfnResourceProps {
  return { type: 'A' }
}

function MyB(): cdk.CfnResourceProps {
  return { type: 'B' }
}

function MyC(): pure.IaaC<cdk.CfnResource> {
  return cf(MyA)
    .flatMap(a => 
      cf(MyB).effect(b => b.addOverride('Other', a.logicalId))
    )
}

function Stack(scope: cdk.Construct): cdk.Construct {
  pure.join(scope, MyC)
  return scope
}

it('apply flatmap to pure functional component',
  () => {
    const app = new cdk.App()
    pure.root(app, Stack, 'IaaC')
    const response = app.synth()
    const stack = response.getStack('IaaC')
    expect(stack.template).deep.equal(
      {
        Resources: { 
          MyA: { Type: 'A' },
          MyB: { Type: 'B', Other: 'MyA' },
        }
      }
    )
  }
)
