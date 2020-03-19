//
// Copyright (C) 2019 Dmitry Kolesnikov
//
// This file may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.
// https://github.com/fogfish/aws-cdk-pure
//

//
// Actor HoC: deploys SQS and Lambda
//
import * as pure from 'aws-cdk-pure'
import * as lambda from '@aws-cdk/aws-lambda'
import * as sqs from '@aws-cdk/aws-sqs'
import * as iam from '@aws-cdk/aws-iam'
import * as source from '@aws-cdk/aws-lambda-event-sources'
import * as logs from '@aws-cdk/aws-logs'
import * as cdk from '@aws-cdk/core'

type ActorPolicy = iam.PolicyStatementProps | string

export interface ActorProps {
  readonly actor: lambda.FunctionProps
  readonly queue?: sqs.QueueProps
  readonly policy?: ActorPolicy[]
  readonly batch?: number
}

/**
 * 
 */
export function Async(id: string, props: ActorProps): pure.IPure<sqs.Queue> {
  const queue = pure.iaac(sqs.Queue)(
    (): sqs.QueueProps => props.queue || defaultQueue(),
    `${id}Queue`,
  )

  const perms = pure.iaac(iam.Role)(Role, `${id}Role`)
    .effect(role => 
      props.policy && props.policy.forEach(
        x => typeof x === "string"
          ? role.addManagedPolicy(
              iam.ManagedPolicy.fromAwsManagedPolicyName(x)
            )
          : role.addToPolicy(
              new iam.PolicyStatement(x)
            )
      )
    )

  const fn = perms.flatMap(role => (
    pure.iaac(lambda.Function)(
      (): lambda.FunctionProps => ({ role, ...defaultActor(props.actor) }),
      id,
    )
  ))

  return pure.use({ queue, fn }).effect(
    eff =>
      eff.fn.addEventSource(
        new source.SqsEventSource(eff.queue, {batchSize: props.batch || 1})
      )
  ).yield('queue')
}

//
const defaultQueue = (): sqs.QueueProps => ({
  deliveryDelay: cdk.Duration.seconds(0),
  retentionPeriod: cdk.Duration.days(4),
  visibilityTimeout: cdk.Duration.minutes(15),
})

//
const Role = (): iam.RoleProps => ({
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
  ],
})

//
const defaultActor = ({
  logRetention,
  memorySize,
  timeout,
  ...props
}: lambda.FunctionProps): lambda.FunctionProps  => ({
  logRetention: logRetention || logs.RetentionDays.FIVE_DAYS,
  memorySize: memorySize || 128,
  timeout: timeout || cdk.Duration.seconds(10),
  ...props,
})
