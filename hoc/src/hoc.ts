//
// Copyright (C) 2019 Dmitry Kolesnikov
//
// This file may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.
// https://github.com/fogfish/aws-cdk-pure
//
// Common HoC
import * as acm from '@aws-cdk/aws-certificatemanager'
import * as dns from '@aws-cdk/aws-route53'
import * as lambda from '@aws-cdk/aws-lambda'
import * as cdk from '@aws-cdk/core'
import * as pure from 'aws-cdk-pure'

//
// Lookup AWS Route 53 hosted zone for the domain
export function HostedZone(domainName: string): pure.IPure<dns.IHostedZone> {
  const awscdkIssue4592 = (parent: cdk.Construct, id: string, props: dns.HostedZoneProviderProps): dns.IHostedZone => (
    dns.HostedZone.fromLookup(parent, id, props)
  )
  const iaac = pure.include(awscdkIssue4592) // dns.HostedZone.fromLookup
  const SiteHostedZone = (): dns.HostedZoneProviderProps => ({ domainName })
  return iaac(SiteHostedZone)
}

//
// Issues AWS TLS Certificate for the domain
export function Certificate(site: string, hostedZone: dns.IHostedZone, arn?: string): pure.IPure<acm.ICertificate> {
  if (arn) {
    const wrap = pure.include(acm.Certificate.fromCertificateArn)
    const SiteCA = (): string => arn
    return wrap(SiteCA)
  } else {
    const iaac = pure.iaac(acm.DnsValidatedCertificate)
    const SiteCA = (): acm.DnsValidatedCertificateProps => ({ domainName: site, hostedZone })
    return iaac(SiteCA)
  }
}

//
// Bundles Golang Lambda function from source
export function AssetCodeGo(path: string): lambda.Code {
  return new lambda.AssetCode('', { bundling: gocc(path) })
}

const gocc = (path: string): cdk.BundlingOptions => {
  const gopath = process.env.GOPATH || '/go'
  const fnpath = path.split(gopath).join('')

  return {
    image: cdk.BundlingDockerImage.fromAsset(`${gopath}${fnpath}`),
    command: ["go", "build", "-o", `${cdk.AssetStaging.BUNDLING_OUTPUT_DIR}/main`],
    user: 'root',
    volumes: [
      {
        containerPath: '/go/src',
        hostPath: `${gopath}/src`,
      },
    ],
    workingDirectory: `/go${fnpath}`,
  }
}
