/**
 * Pure Functional HoC: Static Web 
 */
import * as api from '@aws-cdk/aws-apigateway'
import * as acm from '@aws-cdk/aws-certificatemanager'
import * as cdn from '@aws-cdk/aws-cloudfront'
import * as iam from '@aws-cdk/aws-iam'
import * as dns from '@aws-cdk/aws-route53'
import * as target from '@aws-cdk/aws-route53-targets'
import * as s3 from '@aws-cdk/aws-s3'
import * as cdk from '@aws-cdk/core'
import * as pure from 'aws-cdk-pure'

type DomainName = string
export interface StaticSiteProps {
  /**
   * root domain of the site (e.g. example.com).
   * It shall correspond to AWS Hosted Zone config
   */
  readonly domain: DomainName

  /**
   * subdomain of web-site (e.g. www | api)
   */
  readonly subdomain?: string

  /**
   * The root path at origin to serve static content
   */
  readonly originRoot?: string

  /**
   * The site path visible as a prefix
   */
  readonly siteRoot?: string
}

/******************************************************************************
 *
 * Static WebSite with AWS CloudFront
 * 
 ******************************************************************************/

/**
 * static web site hosting using AWS CloudFront, returns CloudFrontWebDistribution
 * The HoC function creates
 *  - WebSite public S3 bucket
 *  - TLS Certificate
 *  - AWS Cloud Front dedicated for your site
 *  - DNS Configuration
 * 
 * The site is defined as `subdomain.domain` (e.g. www.example.com)
 */
export function CloudFront(props: StaticSiteProps): pure.IPure<cdn.CloudFrontWebDistribution> {
  const zone = SiteHostedZone(props.domain) 
  const origin = SiteOrigin(props)

  return pure.use({ zone, origin })
    .flatMap(x => ({ cert: SiteCertificate(props, x.zone) }))
    .flatMap(x => ({ cdn: SiteCDN(props, x.cert.certificateArn, x.origin) }))
    .flatMap(x => ({ dns: CloudFrontDNS(props, x.zone, x.cdn) }))
    .yield('cdn')
}

//
function SiteCDN(props: StaticSiteProps, acmCertRef: string, s3BucketSource: s3.IBucket): pure.IPure<cdn.CloudFrontWebDistribution> {
  const iaac = pure.iaac(cdn.CloudFrontWebDistribution)
  const CDN = (): cdn.CloudFrontWebDistributionProps => ({
    aliasConfiguration: {
      acmCertRef,
      names: [ site(props) ],
      securityPolicy: cdn.SecurityPolicyProtocol.TLS_V1_2_2018,
      sslMethod: cdn.SSLMethod.SNI,
    },
    httpVersion: cdn.HttpVersion.HTTP1_1,
    originConfigs: [
      {
        behaviors : [
          {
            defaultTtl: cdk.Duration.hours(24),
            forwardedValues: {queryString: true},
            isDefaultBehavior: true,
            maxTtl: cdk.Duration.hours(24),
            minTtl: cdk.Duration.seconds(0),
          }
        ],
        originPath: props.originRoot,
        s3OriginSource: {
          s3BucketSource
        },
      }
    ]
  })
  return iaac(CDN)
}

//
function CloudFrontDNS(props: StaticSiteProps, zone: dns.IHostedZone, cloud: cdn.CloudFrontWebDistribution): pure.IPure<dns.ARecord> {
  const iaac = pure.iaac(dns.ARecord)
  const DNS  = (): dns.ARecordProps => ({
    recordName: site(props),
    target: {aliasTarget: new target.CloudFrontTarget(cloud)},
    ttl: cdk.Duration.seconds(60),
    zone,
  })
  return iaac(DNS)
}

/******************************************************************************
 *
 * Static WebSite with API Gateway
 * 
 ******************************************************************************/

/**
 * static web site hosting using AWS API Gateway, returns RestApi
 * The HoC function creates
 *  - WebSite public S3 bucket
 *  - TLS Certificate
 *  - AWS Gateway API
 *  - DNS Configuration
 * 
 * The site is defined as `subdomain.domain` (e.g. www.example.com)
 */
export function Gateway(props: StaticSiteProps): pure.IPure<api.RestApi> {
  const zone = SiteHostedZone(props.domain) 
  const origin = SiteOrigin(props, false)

  return pure.use({ zone, origin })
    .flatMap(x => ({ cert: SiteCertificate(props, x.zone) }))
    .flatMap(x => ({ role: SiteOriginAccessPolicy(x.origin) }))
    .flatMap(x => ({ gateway: SiteGateway(props, x.cert) }))
    .flatMap(x => ({ content: SiteStaticContent(props, x.origin, x.role, x.gateway) }))
    .flatMap(x => ({ dns: GatewayDNS(props, x.zone, x.gateway) }))
    .yield('gateway')
}

function SiteGateway(props: StaticSiteProps, certificate: acm.ICertificate): pure.IPure<api.RestApi> {
  const iaac = pure.iaac(api.RestApi)
  const fqdn = site(props)
  const GW = {
    [fqdn]: (): api.RestApiProps => ({
      deploy: true,
      deployOptions: {
        stageName: props.siteRoot ? props.siteRoot.split('/')[0] : 'api'
      },
      domainName: {
        certificate,
        domainName: site(props),
      },
      endpointTypes: [api.EndpointType.REGIONAL],
      failOnWarnings: true,
    })
  }
  return iaac(GW[fqdn])
}

function SiteOriginAccessPolicy(origin: s3.IBucket): pure.IaaC<iam.Role> {
  const role = pure.iaac(iam.Role)
  const Role = (): iam.RoleProps => ({
    assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com')
  })

  const ReadOnly = (): iam.PolicyStatement => (
    new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${origin.bucketArn}/*`],
    })
  )

  return role(Role).effect(x => x.addToPolicy(ReadOnly()))
}

function SiteStaticContent(props: StaticSiteProps, origin: s3.IBucket, role: iam.IRole, gw: api.RestApi): pure.IPure<api.AwsIntegration> {
  const iaac = pure.wrap(api.AwsIntegration)
  const content = (path: string) => (): api.AwsIntegrationProps => ({
    integrationHttpMethod: 'GET',
    options: {
      credentialsRole: role,
      integrationResponses: [
        {
          selectionPattern: 'default',
          statusCode: '500',
        },
        {
          selectionPattern: '2\\d{2}',
          statusCode: '200',
          responseParameters: {
            "method.response.header.Content-Type": "integration.response.header.Content-Type",
            "method.response.header.Content-Length": "integration.response.header.Content-Length",
          },
        },
        {
          selectionPattern: '404',
          statusCode: '404',
        },
        {
          selectionPattern: '4\\d{2}',
          statusCode: '403',
        }
      ],
      passthroughBehavior: api.PassthroughBehavior.WHEN_NO_MATCH,
      requestParameters: {
        "integration.request.path.key": "method.request.path.key"
      },
    },
    path,
    service: 's3',
  })
  const Content = content(
    props.originRoot 
      ? `${origin.bucketName}/${props.originRoot}/{key}`
      : `${origin.bucketName}/{key}`
  )
  const Default = content(
    props.originRoot 
      ? `${origin.bucketName}/${props.originRoot}/index.html`
      : `${origin.bucketName}/index.html`
  )

  const spec = {
    methodResponses: [
      {
        statusCode: '200',
        responseParameters: {
          "method.response.header.Content-Type": true,
          "method.response.header.Content-Length": true,
        },
      },
      {statusCode: '403'},
      {statusCode: '404'},
      {statusCode: '500'},
    ],
    requestParameters: {
      "method.request.path.key": true
    },
  }

  const segments = props.siteRoot ? props.siteRoot.split('/').slice(1) : []
  return pure.use({ content: iaac(Content), default: iaac(Default) })
    .effect(x => {
      const p = segments.reduce((acc, seg) => acc.addResource(seg), gw.root)
      p.addMethod('GET', x.default, spec)
      p.addResource('{key+}').addMethod('GET', x.content, spec)
    })
    .yield('content')
}

//
function GatewayDNS(props: StaticSiteProps, zone: dns.IHostedZone, restapi: api.RestApi): pure.IPure<dns.ARecord> {
  const iaac = pure.iaac(dns.ARecord)
  const DNS  = (): dns.ARecordProps => ({
    recordName: site(props),
    target: {aliasTarget: new target.ApiGateway(restapi)},
    ttl: cdk.Duration.seconds(60),
    zone,
  })
  return iaac(DNS)
}

/******************************************************************************
 *
 * Static WebSite Common Components
 * 
 ******************************************************************************/

//
//
function site(props: StaticSiteProps): string {
  return (props.subdomain) ? `${props.subdomain}.${props.domain}` : props.domain
}

//
// AWS S3 Bucket for Static Site(s)
function SiteOrigin(props: StaticSiteProps, publicReadAccess: boolean = true): pure.IPure<s3.Bucket> {
  const iaac = pure.iaac(s3.Bucket)
  const Origin = () => ({
    bucketName: site(props),
    publicReadAccess,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    websiteErrorDocument: 'error.html',
    websiteIndexDocument: 'index.html',
  })
  return iaac(Origin)
}

//
// Lookup AWS Route 53 hosted zone the site
function SiteHostedZone(domainName: DomainName): pure.IPure<dns.IHostedZone> {
  const awscdkIssue4592 = (parent: cdk.Construct, id: string, props: dns.HostedZoneProviderProps): dns.IHostedZone => (
    dns.HostedZone.fromLookup(parent, id, props)
  )
  const iaac = pure.include(awscdkIssue4592) // dns.HostedZone.fromLookup
  const Ns = (): dns.HostedZoneProviderProps => ({ domainName })
  return iaac(Ns)
}

//
// Issues AWS Certificate for the site
function SiteCertificate(props: StaticSiteProps, hostedZone: dns.IHostedZone): pure.IPure<acm.ICertificate> {
  const iaac = pure.iaac(acm.DnsValidatedCertificate)
  const Ca = (): acm.DnsValidatedCertificateProps => ({ domainName: site(props), hostedZone })
  return iaac(Ca).map(cert => cert)
}
