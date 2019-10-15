import { expect } from 'chai'
import { IaaC, root, join, iaac, use, flat } from '../src/index'
import * as cdk from '@aws-cdk/core'

const cf = iaac(cdk.CfnResource)

function ResourceA(): cdk.CfnResourceProps {
  return { type: 'TypeA' }
}

function ResourceB(): cdk.CfnResourceProps {
  return { type: 'TypeB' }
}

function ResourceC(): IaaC<cdk.CfnResource> {
  const a = cf(ResourceA)
  const b = cf(ResourceB)
  return use({ a })
    .flatmap(x => use({ b }).effect(y => y.b.addOverride('Other', x.a.logicalId)))
    .yield('b')
}

function Stack(scope: cdk.Construct): cdk.Construct {
  join(scope, flat(ResourceC))
  return scope
}

it('apply flatmap to pure functional component',
  () => {
    const app = new cdk.App()
    root(app, Stack, 'IaaC')
    const response = app.synth()
    const stack = response.getStack('IaaC')
    expect(stack.template).deep.equal(
      {
        Resources: { 
          ResourceA: { Type: 'TypeA' },
          ResourceB: { Type: 'TypeB', Other: 'ResourceA' },
        }
      }
    )
  }
)
