//
// Copyright (C) 2019 Dmitry Kolesnikov
//
// This file may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.
// https://github.com/fogfish/aws-cdk-pure
//
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

//
function HoCC(a: cdk.CfnResource, b: cdk.CfnResource): pure.IaaC<cdk.CfnResource> {
  const MyC = (): cdk.CfnResourceProps => ({
    type: 'C',
    properties: {a: a.logicalId, b: b.logicalId}
  })
  return cf(MyC)
}

function HoCD(c: cdk.CfnResource): pure.IaaC<cdk.CfnResource> {
  const MyD =(): cdk.CfnResourceProps => ({
    type: 'D',
    properties: {c: c.logicalId}
  })
  return cf(MyD)
}

//
function HoC1(): pure.IaaC<cdk.CfnResource> {
  const a = cf(MyA)
  const b = cf(MyB)

  return pure.use({ a, b })
    .effect((x) => x.a.addOverride('Other', x.b.logicalId))
    .yield('a')
}
  
function HoC2(): pure.IaaC<cdk.CfnResource> {
  const a = cf(MyA)
  return pure.use({ a })
  .flatMap(_ => ({b: cf(MyB)}) )
  .yield('b')
}

function HoC3(): pure.IaaC<cdk.CfnResource> {
  const a = cf(MyA)
  const b = cf(MyB)

  return pure.use({ a, b })
    .flatMap(x => ({ c: HoCC(x.a, x.b) }))
    .flatMap(x => ({ d: HoCD(x.c) }))
    .yield('c')
}


function MyApp(iaac: pure.IaaC<cdk.CfnResource>): cdk.App {
  const Stack = (): cdk.StackProps => ({ env: {} })
  const stack = pure.iaac(cdk.Stack)(Stack).effect(x => pure.join(x, iaac))
  const app = new cdk.App()
  pure.join(app, stack)
  return app
} 

//
//
it('apply effects to product of pure functional component',
  () => {
    const app = MyApp(HoC1())
    const response = app.synth()
    const stack = response.getStack('Stack')    
    expect(stack.template).deep.equal(
      {
        Resources: { 
          MyA: { Type: 'A', Other: 'MyB' },
          MyB: { Type: 'B' },
        }
      }
    )
  }
)

it('apply flatMap to product of pure functional component',
  () => {
    const app = MyApp(HoC2())
    const response = app.synth()
    const stack = response.getStack('Stack')
    expect(stack.template).deep.equal(
      {
        Resources: { 
          MyA: { Type: 'A' },
          MyB: { Type: 'B' },
        }
      }
    )
  }
)


it('apply nested flatMap to product of pure functional component',
  () => {
    const app = MyApp(HoC3())
    const response = app.synth()
    const stack = response.getStack('Stack')
    expect(stack.template).deep.equal(
      {
        Resources: { 
          MyA: { Type: 'A' },
          MyB: { Type: 'B' },
          MyC: { Type: 'C', Properties: { a: 'MyA', b: 'MyB' }},
          MyD: { Type: 'D', Properties: { c: 'MyC' }},
        }
      }
    )
  }
)