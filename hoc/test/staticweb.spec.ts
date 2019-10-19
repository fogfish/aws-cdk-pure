/*

see https://github.com/aws/aws-cdk/issues/4592

import { expect } from 'chai'
import * as pure from 'aws-cdk-pure'
import * as cdk from '@aws-cdk/core'
import * as staticweb from '../src/staticweb'

it('build staticweb',
  () => {
    const app = new cdk.App()
    const Stack = (): cdk.StackProps => ({ 
      env: { account: '000000000000', region: 'us-east-1'}
    })
    pure.join(app,
      pure.iaac(cdk.Stack)(Stack)
        .effect(x => pure.join(x, staticweb.StaticWeb('www', 'example.com') ))
    )
    const stack = app.synth().getStack('Stack')
    expect(stack.template).deep.equal(
      {
      }
    )
  }
)
*/