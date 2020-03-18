import * as cdk from '@aws-cdk/core'
import * as pure from 'aws-cdk-pure'
import * as hoc from 'aws-cdk-pure-hoc'

//
// Global configuration, the tls certificates requires few parameters
//  * root domain of the site (e.g. example.com). It must correspond to 
//    existing entity in AWS Hosted Zone
//  * subdomain of web-site or api (e.g. www | api)
//
const app = new cdk.App()
const stack = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  }
}
const subdomain = String(app.node.tryGetContext('subdomain'))
const domain = String(app.node.tryGetContext('domain'))

//
// Common stack creates a certificate and exports its.
// The stack is deployed only once during life-cycle of application.
//
const tlsCertificate = pure.join(
  new cdk.Stack(app, 'common', stack),
  hoc.common.HostedZone(domain).flatMap(
    zone => hoc.common.Certificate(`*.${domain}`, zone)
  ),
).certificateArn

//
// Application stack deploy application resource, which depends on
// existing tlsCertificate. The application stack can be destroyed/deployed
// unlimited amount of time. It would not cause re-create of certificate.
//
pure.join(
  new cdk.Stack(app, 'application', stack),
  hoc.staticweb.Gateway({
    domain,
    subdomain,
    tlsCertificate,
    sites: [{origin: '', site: 'api'}],
  }),
)



