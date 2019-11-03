//
// Copyright (C) 2019 Dmitry Kolesnikov
//
// This file may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.
// https://github.com/fogfish/aws-cdk-pure
//
import { expect, haveResource } from '@aws-cdk/assert'
import * as assert from 'chai'
import * as pure from 'aws-cdk-pure'
import * as cdk from '@aws-cdk/core'
import { staticweb } from '../src/index'

it('staticweb.CloudFront implements IPure<T> interface',
  () => {
    const c = staticweb.CloudFront({domain: 'example.com', subdomain: 'www'})
    assert.expect( c.effect )
    assert.expect( c.map )
    assert.expect( c.flatMap )
  }
)

it('build Static Web Site with AWS CloudFront',
  () => {
    const app = new cdk.App()
    const stack = new cdk.Stack(app, 'Stack', { 
      env: { account: '000000000000', region: 'us-east-1'}
    })
    pure.join(stack,
      staticweb.CloudFront({domain: 'example.com', subdomain: 'www'})
    )

    const elements = [
      'AWS::S3::Bucket',
      'AWS::IAM::Policy',
      'AWS::Lambda::Function',
      'AWS::CloudFormation::CustomResource',
      'AWS::CloudFront::Distribution',
      'AWS::Route53::RecordSet',
    ]
    elements.forEach(x => expect(stack).to(haveResource(x)));
  }
)

it('staticweb.Gateway implements IPure<T> interface',
  () => {
    const c = staticweb.Gateway({domain: 'example.com', subdomain: 'www'})
    assert.expect( c.effect )
    assert.expect( c.map )
    assert.expect( c.flatMap )
  }
)

it('build Static Web Site with AWS API Gateway',
  () => {
    const app = new cdk.App()
    const stack = new cdk.Stack(app, 'Stack', { 
      env: { account: '000000000000', region: 'us-east-1'}
    })
    pure.join(stack,
      staticweb.Gateway({domain: 'example.com', subdomain: 'www', siteRoot: 'api/a/b/c/d'})
    )

    const elements = [
      'AWS::S3::Bucket',
      'AWS::IAM::Policy',
      'AWS::Lambda::Function',
      'AWS::CloudFormation::CustomResource',
      'AWS::ApiGateway::RestApi',
      'AWS::ApiGateway::Deployment',
      'AWS::ApiGateway::Stage',
      'AWS::ApiGateway::Resource',
      'AWS::ApiGateway::Method',
      'AWS::ApiGateway::DomainName',
      'AWS::Route53::RecordSet',
    ]
    elements.forEach(x => expect(stack).to(haveResource(x)));
  }
)
