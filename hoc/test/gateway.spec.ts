//
// Copyright (C) 2019 Dmitry Kolesnikov
//
// This file may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.
// https://github.com/fogfish/aws-cdk-pure
//
import { expect, haveResource } from '@aws-cdk/assert'
import * as assert from 'chai'
import * as api from '@aws-cdk/aws-apigateway'
import * as pure from 'aws-cdk-pure'
import * as cdk from '@aws-cdk/core'
import { gateway } from '../src/index'

it('gateway.Api implements IPure<T> interface',
  () => {
    const c = gateway.Api({domain: 'example.com', subdomain: 'www'})
    assert.expect( c.effect )
    assert.expect( c.map )
    assert.expect( c.flatMap )
  }
)

it('build gateway.Api',
  () => {
    const app = new cdk.App()
    const stack = new cdk.Stack(app, 'Stack', { 
      env: { account: '000000000000', region: 'us-east-1'}
    })

    // Note: mock is required to pass the test
    //       API GW cannot be created w/o any methods
    const gw = gateway
      .Api({domain: 'example.com', subdomain: 'www', siteRoot: 'api/a/b/c/d'})
      .effect(x => {
        x.root.addResource('test').addMethod('GET', new api.MockIntegration({}))
      })
    pure.join(stack, gw)

    const elements = [
      'AWS::IAM::Policy',
      'AWS::Lambda::Function',
      'AWS::CloudFormation::CustomResource',
      'AWS::ApiGateway::RestApi',
      'AWS::ApiGateway::Deployment',
      'AWS::ApiGateway::Stage',
      'AWS::ApiGateway::DomainName',
      'AWS::Route53::RecordSet',
    ]
    elements.forEach(x => expect(stack).to(haveResource(x)));
  }
)

it('define CORS policy',
  () => {
    const app = new cdk.App()
    const stack = new cdk.Stack(app, 'Stack', { 
      env: { account: '000000000000', region: 'us-east-1'}
    })

    const gw = gateway
      .Api({domain: 'example.com', subdomain: 'www', siteRoot: 'api/a/b/c/d'})
      .effect(x => {
        gateway.CORS(x.root.addResource('test'))
      })
    pure.join(stack, gw)

    const elements = [
      'AWS::IAM::Policy',
      'AWS::Lambda::Function',
      'AWS::CloudFormation::CustomResource',
      'AWS::ApiGateway::RestApi',
      'AWS::ApiGateway::Deployment',
      'AWS::ApiGateway::Stage',
      'AWS::ApiGateway::DomainName',
      'AWS::Route53::RecordSet',
    ]
    elements.forEach(x => expect(stack).to(haveResource(x)));
  }
)
