//
// Copyright (C) 2019 Dmitry Kolesnikov
//
// This file may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.
// https://github.com/fogfish/aws-cdk-pure
//
import * as pure from 'aws-cdk-pure'
import * as cdk from '@aws-cdk/core'
import { config } from '../src/index'

function Config(): pure.IaaC<cdk.CfnResource> {
  return config.String('key', 'bucket').flatMap(Component)
}

function Component(type: string): pure.IaaC<cdk.CfnResource> {
  const cf = pure.iaac(cdk.CfnResource)
  const MyA = (): cdk.CfnResourceProps => ({ type })
  return cf(MyA)
}

it('config implements IPure<T> interface',
  () => {
    const c = config.String('key', 'bucket')
    expect( c.effect )
    expect( c.map )
    expect( c.flatMap )
  }
)

it('fetch config from secret manager',
  () => {
    const app = new cdk.App()
    const Stack = (): cdk.StackProps => ({ env: {} })
    pure.join(app,
      pure.iaac(cdk.Stack)(Stack).effect(x => pure.join(x, Config))
    )
    const stack = app.synth().getStack('Stack')
    expect(stack.template).toEqual(
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
