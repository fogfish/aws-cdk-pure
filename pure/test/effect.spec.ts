import { expect } from 'chai'
import { IaaC, root, join, iaac, use } from '../src/index'
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
  return use({ a, b })
    .effect((x) => x.a.addOverride('Other', x.b.logicalId))
    .yield('a')
}

function ResourceD(): IaaC<cdk.CfnResource> {
  return use({ a: cf(ResourceA) })
    .flatMap(_ => ({b: cf(ResourceB)}))
    .yield('b')
}

function StackA(scope: cdk.Construct): cdk.Construct {
  join(scope, ResourceC)
  return scope
}

function StackB(scope: cdk.Construct): cdk.Construct {
  join(scope, ResourceD)
  return scope
}

it('apply effects to pure functional component',
  () => {
    const app = new cdk.App()
    root(app, StackA, 'IaaC')
    const response = app.synth()
    const stack = response.getStack('IaaC')
    expect(stack.template).deep.equal(
      {
        Resources: { 
          ResourceA: { Type: 'TypeA', Other: 'ResourceB' },
          ResourceB: { Type: 'TypeB' },
        }
      }
    )
  }
)

it('apply flatMap to pure functional component',
() => {
  const app = new cdk.App()
  root(app, StackB, 'IaaC')
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