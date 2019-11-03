//
// Copyright (C) 2019 Dmitry Kolesnikov
//
// This file may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.
// https://github.com/fogfish/aws-cdk-pure
//
// Rest API Serverless Gateway HoC
//
import * as api from '@aws-cdk/aws-apigateway'
import * as acm from '@aws-cdk/aws-certificatemanager'
import * as pure from 'aws-cdk-pure'
import * as dns from '@aws-cdk/aws-route53'
import * as target from '@aws-cdk/aws-route53-targets'
import * as cdk from '@aws-cdk/core'
import * as hoc from './hoc'

export interface GatewayProps {
  /**
   * root domain of the site (e.g. example.com).
   * It shall correspond to AWS Hosted Zone config
   */
  readonly domain: string

  /**
   * subdomain of web-site (e.g. www | api)
   */
  readonly subdomain?: string

  /**
   * The api path visible as a prefix, default is `api`
   */
  readonly siteRoot?: string
}

/**
 * AWS API Gateway with DNS and TLS configuration, returns RestApi
 * The HoC function creates
 *  - TLS Certificate
 *  - AWS Gateway API
 *  - DNS Configuration
 * 
 * The site is defined as `subdomain.domain` (e.g. www.example.com)
 */
export function Api(props: GatewayProps): pure.IPure<api.RestApi> {
  const zone = hoc.HostedZone(props.domain) 

  return pure.use({ zone })
    .flatMap(x => ({ cert: hoc.Certificate(site(props), x.zone) }))
    .flatMap(x => ({ gateway: Gateway(props, x.cert) }))
    .flatMap(x => ({ dns: GatewayDNS(props, x.zone, x.gateway) }))
    .yield('gateway')
}

function Gateway(props: GatewayProps, certificate: acm.ICertificate): pure.IPure<api.RestApi> {
  const iaac = pure.iaac(api.RestApi)
  const fqdn = site(props)
  const GW = {
    [fqdn]: (): api.RestApiProps => ({
      deploy: true,
      deployOptions: {
        stageName: stage(props),
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

//
function GatewayDNS(props: GatewayProps, zone: dns.IHostedZone, restapi: api.RestApi): pure.IPure<dns.ARecord> {
  const iaac = pure.iaac(dns.ARecord)
  const ApiDNS  = (): dns.ARecordProps => ({
    recordName: site(props),
    target: {aliasTarget: new target.ApiGateway(restapi)},
    ttl: cdk.Duration.seconds(60),
    zone,
  })
  return iaac(ApiDNS)
}

//
function site(props: GatewayProps): string {
  return (props.subdomain) ? `${props.subdomain}.${props.domain}` : props.domain
}

//
function stage(props: GatewayProps): string {
  return props.siteRoot ? props.siteRoot.split('/')[0] : 'api'
}
