# High Order Infrastructure Components

* [config](#config)
* [staticweb](#staticweb)


## config

It gives you a secure approach to retain confidentiality of your configuration by substituting an environment variables with Key Vault service, such as AWS Secret Manager.

```typescript
import * as config from 'aws-cdk-pure-hoc/config'

config.String('MySecretStore', 'MyConfigKey').flatMap(
  (value: string) => /* value is a CloudFormation reference to your secret */
)
```


## staticweb

Serverless implementation of Static WebSite using AWS S3 with HTTPS (TLS) support. The HoC implements two approaches using AWS CloudFront or AWS Gateway API. 

The CloudFront-based Static Web is deployed to `us-east-1` only but do not worry about latencies, it has an excellent [global coverage](https://aws.amazon.com/cloudfront/features/).

```typescript
import * as staticweb from 'aws-cdk-pure-hoc/staticweb'

const Site = staticweb.CloudFront({
  domain: 'example.com',
  subdomain: 'www',
})

const Stack = (): cdk.StackProps => ({
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1'
  }
})
const stack = pure.iaac(cdk.Stack)(Stack).effect(x => pure.join(x, Site))
const app = new cdk.App()
pure.join(app, stack)
app.synth()
```

The API Gateway-base Static Web is deployed to any region. It works best if you need to couple delivery of static web and api within same deployment. 

```typescript
import * as staticweb from 'aws-cdk-pure-hoc/staticweb'

const Site = staticweb.Gateway({
  domain: 'example.com',
  subdomain: 'www',
  siteRoot: 'api/myapp'  // https://www.example.com/api/myapp static site endpoint
})

Site.effect(
  (x: RestApi) => /* add other methods to rest api here */
)
```
