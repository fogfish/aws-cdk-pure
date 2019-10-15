# aws-cdk-pure

The library is a toolkit to develop purely functional and high-order cloud components with AWS CDK.


## Inspiration

The library is an open-source extension to AWS CDK. It has been inspired by posts
* [Composable Cloud Components with AWS CDK](https://i.am.fog.fish/2019/07/28/composable-cloud-components-with-aws-cdk.html)
* [Purely Functional Cloud Components with AWS CDK](https://i.am.fog.fish/2019/08/23/purely-functional-cloud-with-aws-cdk.html).

aws-cdk-pure is an utility for design and development of purely functional and higher-order components. You know React Hooks! Think of it as Hooks for Cloud.


## Getting started

The latest version of the library is available at its `master` branch. All development, including new features and bug fixes, take place on the `master` branch using forking and pull requests as described in contribution guidelines. The latest package release is available at npm

```bash
npm install --save aws-cdk-pure
```

## Key features 

AWS development kit do not implement a pure functional approach. The abstraction of cloud resources is exposed using class hierarchy, each class represents a "cloud component" and encapsulates everything AWS CloudFormation needs to create the component. A shift from category of classes to category of pure functions simplifies the development by **scraping boilerplate**. A pure function component of type `IaaC<T>` is a right approach to express semantic of Infrastructure as a Code.

You cloud code will looks like following snippet with this library. Please check the details about key features [here](https://i.am.fog.fish/2019/08/23/purely-functional-cloud-with-aws-cdk.html). 

Check out the [**example**](example) for references 

```typescript
import { IaaC, root, join, flat, use, iaac, wrap } from 'aws-cdk-pure'

//
// type safe factory. 
// It takes a class constructor of “cloud component” as input
// It returns a function, which makes builds 
// a type-safe association between “cloud component” and its property.
namespace cloud {
  export const lambda  = iaac(Function)
  export const gateway = iaac(RestApi)
  export const resource = wrap(LambdaIntegration)
}

//
// pure Lambda
function WebHook(parent: cdk.Construct): lambda.FunctionProps {
  return {
    runtime: lambda.Runtime.NODEJS_10_X,
    code: new lambda.AssetCode(...),
    ...
  }
}

//
// pure API Gateway 
function Gateway(): api.RestApiProps {
  return {
    endpointTypes: [api.EndpointType.REGIONAL],
    ...
  }
}

//
// HoC RestApi
function RestApi(): IaaC<api.RestApi> {
  const restapi = cloud.gateway(Gateway)
  const webhook = cloud.resource(cloud.lambda(WebHook))
  
  return use({ restapi, webhook })
    .effect(
      x => x.restapi.root.addResource('webhook').addMethod('POST', x.webhook)
    )
    .yield('restapi')
}

//
// pure Stack
function CodeBuildBot(stack: cdk.Construct): cdk.Construct {
  join(stack, flat(RestApi))
  return stack
}

const app = new cdk.App()
root(app, CodeBuildBot)
app.synth()
```

## Other libraries

You've might head about [Punchcard](https://github.com/sam-goodwin/punchcard) 
> Punchcard adds to the vision by unifying infrastructure code with runtime code, meaning you can both declare resources and implement logic within one node.js application.

This library is not looking for unification of infrastructure and business logic code with this pure functional extension to AWS CDK. Instead, it promotes divercity of runtimes of your lambda functions. It just shifts IaaC development paradigm from category of classes to category of pure functions.

See an example in [demo project](https://github.com/fogfish/code-build-bot).

## How To Contribute

The library is [MIT](LICENSE) licensed and accepts contributions via GitHub pull requests:

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Added some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

```
npm install
npm run test
npm run lint
npm run build
```

## License

[![See LICENSE](https://img.shields.io/github/license/fogfish/aws-cdk-pure.svg?style=for-the-badge)](LICENSE)
