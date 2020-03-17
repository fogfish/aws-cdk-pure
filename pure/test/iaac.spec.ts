//
// Copyright (C) 2019 Dmitry Kolesnikov
//
// This file may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.
// https://github.com/fogfish/aws-cdk-pure
//
import * as pure from '../src/index'
import * as cdk from '@aws-cdk/core'

const cf = pure.iaac(cdk.CfnResource)

function MyA(): cdk.CfnResourceProps {
  return { type: 'A' }
}

function MyB(): cdk.CfnResourceProps {
  return { type: 'B' }
}

class Wrap {
  constructor(c: cdk.CfnResource) {
    c.addOverride('Some', 'Wrap')
  }
}
const wf = pure.wrap(Wrap)

class Lookup {
  public static from(scope: cdk.Construct, name: string, props: {type: string}): cdk.CfnResource {
    return new cdk.CfnResource(scope, name, { type: props.type })
  }
}
const lf = pure.include(Lookup.from)

function Stack(scope: cdk.Construct): cdk.Construct {
  pure.join(scope, cf(MyA))
  pure.join(scope, cf(MyB))
  return scope
}

it('attach components to stack using type safe factory',
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
      },
    )
  }
)

it('attach components to stack using effects',
  () => {
    const app = new cdk.App()
    const Stack = (): cdk.StackProps => ({ env: {} })
    pure.join(app,
      pure.iaac(cdk.Stack)(Stack)
        .effect(x => {
          pure.join(x, cf(MyA))
          pure.join(x, cf(MyB))
        })
    )
    const response = app.synth()
    const stack = response.getStack('Stack')
    expect(stack.template).toEqual(
      {
        Resources: { 
          MyA: { Type: 'A' },
          MyB: { Type: 'B' },
        }
      },
    )
  }
)

it('attach components to stack using wrap',
  () => {
    const app = new cdk.App()
    const Stack = (): cdk.StackProps => ({ env: {} })
    pure.join(app,
      pure.iaac(cdk.Stack)(Stack)
        .effect(x => pure.join(x, wf(cf(MyA))))
    )
    const response = app.synth()
    const stack = response.getStack('Stack')
    expect(stack.template).toEqual(
      {
        Resources: { 
          MyA: { Type: 'A', Some: 'Wrap' },
        }
      },
    )
  }
)

it('attach components to stack using include',
  () => {
    const app = new cdk.App()
    const Stack = (): cdk.StackProps => ({ env: {} })
    const MyD   = (): {type: string} => ({ type: 'D' })

    pure.join(app,
      pure.iaac(cdk.Stack)(Stack)
        .effect(x => pure.join(x, lf(MyD)))
    )
    const response = app.synth()
    const stack = response.getStack('Stack')
    expect(stack.template).toEqual(
      {
        Resources: { 
          MyD: { Type: 'D' },
        }
      },
    )
  }
)