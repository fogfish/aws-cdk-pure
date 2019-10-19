/**
 * Pure Functional HoC: Static Web 
 */
import * as acm from '@aws-cdk/aws-certificatemanager'
import * as cdn from '@aws-cdk/aws-cloudfront'
import * as s3 from '@aws-cdk/aws-s3'
import * as dns from '@aws-cdk/aws-route53'
import * as target from '@aws-cdk/aws-route53-targets'
import * as cdk from '@aws-cdk/core'
import * as pure from 'aws-cdk-pure'

/**
 * creates a cloud infrastructure to host static web site and returns CloudFrontWebDistribution
 * The HoC function creates
 *  - WebSite public S3 bucket
 *  - TLS Certificate
 *  - AWS Cloud Front dedicated for your site
 *  - DNS Configuration
 * 
 * The site is defined as `subdomain.domain` (e.g. www.example.com)
 * 
 * @param subdomain subdomain of web-site (e.g. www)
 * @param domain  root domain of web-site (e.g. example.com)
 */
export function StaticWeb(subdomain: string | undefined, domain: string): pure.IPure<cdn.CloudFrontWebDistribution> {
  const site = (subdomain) ? `${subdomain}.${domain}` : domain
  const zone = SiteHostedZone(domain) 
  const origin = SiteOrigin(site)

  return pure.use({ zone, origin })
    .flatMap(x => ({ cert: SiteCertificate(site, x.zone) }))
    .flatMap(x => ({ cdn: SiteCDN(site, x.cert, x.origin) }))
    .flatMap(x => ({ dns: SiteDNS(site, x.zone, x.cdn) }))
    .yield('cdn')
}

//
function SiteHostedZone(domainName: string): pure.IPure<dns.IHostedZone> {
  const iaac = pure.include(dns.HostedZone.fromLookup)
  const Ns = (): dns.HostedZoneProviderProps => ({ domainName})
  return iaac(Ns)
}

//
function SiteCertificate(site: string, hostedZone: dns.IHostedZone): pure.IPure<string> {
  const iaac = pure.iaac(acm.DnsValidatedCertificate)
  const Ca = (): acm.DnsValidatedCertificateProps => ({ domainName: site, hostedZone })
  return iaac(Ca).map(cert => cert.certificateArn)
}

//
function SiteOrigin(site: string): pure.IPure<s3.Bucket> {
  const iaac = pure.iaac(s3.Bucket)
  const Origin = () => ({
    bucketName: site,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    websiteIndexDocument: 'index.html',
    websiteErrorDocument: 'error.html',
    publicReadAccess: true,
  })
  return iaac(Origin)
}

//
function SiteCDN(site: string, acmCertRef: string, s3BucketSource: s3.IBucket): pure.IPure<cdn.CloudFrontWebDistribution> {
  const iaac = pure.iaac(cdn.CloudFrontWebDistribution)
  const CDN = (): cdn.CloudFrontWebDistributionProps => ({
    httpVersion: cdn.HttpVersion.HTTP1_1,
      aliasConfiguration: {
        acmCertRef,
        names: [ site ],
        sslMethod: cdn.SSLMethod.SNI,
        securityPolicy: cdn.SecurityPolicyProtocol.TLS_V1_2_2018,
      },
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource
          },
          behaviors : [
            {
              isDefaultBehavior: true,
              defaultTtl: cdk.Duration.hours(24),
              maxTtl: cdk.Duration.hours(24),
              minTtl: cdk.Duration.seconds(0),
              forwardedValues: {queryString: true}
            }
          ],
        }
      ]
  })
  return iaac(CDN)
}

//
function SiteDNS(site: string, zone: dns.IHostedZone, cdn: cdn.CloudFrontWebDistribution): pure.IPure<dns.ARecord> {
  const iaac = pure.iaac(dns.ARecord)
  const DNS  = (): dns.ARecordProps => ({
    zone,
    ttl: cdk.Duration.seconds(60),
    recordName: site,
    target: {aliasTarget: new target.CloudFrontTarget(cdn)}
  })
  return iaac(DNS)
}
