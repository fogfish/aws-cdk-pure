//
// Copyright (C) 2019 Dmitry Kolesnikov
//
// This file may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.
// https://github.com/fogfish/aws-cdk-pure
//
import * as assert from '@aws-cdk/assert'
import * as pure from 'aws-cdk-pure'
import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import { actor } from '../src/index'

it('actor.Async implements IPure<T> interface',
  () => {
    const c = actor.Async('Actor', {
      actor: {
        code: new lambda.InlineCode('exports.handler = function(e) {return e}'),
        handler: 'main',
        runtime: lambda.Runtime.NODEJS_12_X,
      }
    })
    expect( c.effect ).toBeDefined()
    expect( c.map ).toBeDefined()
    expect( c.flatMap ).toBeDefined()
  }
)

it('build actor.Async',
  () => {
    const app = new cdk.App()
    const stack = new cdk.Stack(app, 'Stack', { 
      env: { account: '000000000000', region: 'us-east-1'}
    })

    pure.join(stack,
      actor.Async('Actor', {
        actor: {
          code: new lambda.InlineCode('exports.handler = function(e) {return e}'),
          handler: 'main',
          runtime: lambda.Runtime.NODEJS_12_X,
        }
      })
    )

    const elements = [
      'AWS::Lambda::Function',
      'AWS::SQS::Queue',
      'AWS::IAM::Role',
    ]
    elements.forEach(x => assert.expect(stack).to(assert.haveResource(x)));
  }
)
