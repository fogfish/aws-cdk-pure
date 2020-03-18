# Reusable TLS Certificate

This application shows the possible solution on the TLS certificate issue depicted in the blog post:

[How To Fix Error About Limits of TLS Certificates That Caused by AWS CDK](https://i.am.fog.fish/2020/03/18/how-to-fix-error-about-limits-of-tls-certificates-that-caused-by-aws-cdk.html)


A frequent deployment of AWS CDK application might cause an error

```
Error: you have reached your limit of 20 certificates in the last year.
```

The root cause of the error is an automation on TLS Certificate. The following CDK code requests a new certificate from AWS Certificate Manager.

```ts
import * as acm from '@aws-cdk/aws-certificatemanager'

const cert = new acm.DnsValidatedCertificate(this, 'Cert', { domainName, hostedZone })
```

This app uses cross-stack references to demonstrates the re-use of certificates in actions.

```
cdk deploy -c domain=example.com -c subdomain=myapp application
```

The usage of cross-stack references allows you to deploy a TLS certificate only once using AWS CDK IaC principles. You are not limited with redeployment cycles of actual application. You can safely enforce continuous deployment workflow for your application without any issue with AWS Certificate Manager quotas.
