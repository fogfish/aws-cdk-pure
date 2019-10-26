// import { expect } from 'chai'
import { expect, haveResource } from '@aws-cdk/assert'
import * as pure from 'aws-cdk-pure'
import * as cdk from '@aws-cdk/core'
import * as staticweb from '../src/staticweb'

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
    ]
    elements.forEach(x => expect(stack).to(haveResource(x)));
  }
)
